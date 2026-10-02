#include "formatter.h"
#include "diagnostic.h"

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

// The formatter program installs this global. It is part of the vendored bundle
// contract, not a public konsupujs symbol.
static const char formatter_entry[] = "__konsupuFormat";

// A bounded failure of the source being formatted. Every other formatter code
// reports a failure the caller cannot fix by changing its source.
bool kjs_formatter_code_is_infrastructure(const char *code)
{
    if (code == NULL) { return true; }
    return strcmp(code, KJS_FORMATTER_CODE_FORMAT) != 0 && strcmp(code, KJS_FORMATTER_CODE_LIMIT) != 0;
}

// Builds a diagnostic from a thrown or rejected value. QuickJS exposes the
// message of an Error object, which is what prettier uses to report a syntax
// error.
static kjs_diagnostic_t *formatter_value_diagnostic(kjs_formatter_t *formatter, JSValueConst value, const char *code,
                                                    const char *fallback)
{
    const char *message = NULL;
    if (JS_IsError(value) || JS_IsObject(value))
    {
        JSValue property = JS_GetPropertyStr(formatter->context, value, "message");
        if (JS_IsString(property)) { message = JS_ToCString(formatter->context, property); }
        JS_FreeValue(formatter->context, property);
    }
    kjs_diagnostic_t *diagnostic =
        kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, code, message == NULL ? fallback : message);
    if (message != NULL) JS_FreeCString(formatter->context, message);
    return diagnostic;
}

static kjs_diagnostic_t *formatter_exception(kjs_formatter_t *formatter, const char *code, const char *fallback)
{
    JSValue exception = JS_GetException(formatter->context);
    kjs_diagnostic_t *diagnostic = formatter_value_diagnostic(formatter, exception, code, fallback);
    JS_FreeValue(formatter->context, exception);
    return diagnostic;
}

static kjs_status_t formatter_failure(kjs_formatter_t *formatter, const char *code, const char *fallback,
                                      kjs_diagnostic_t **diagnostic)
{
    kjs_diagnostic_t *failure = formatter_exception(formatter, code, fallback);
    if (diagnostic != NULL) { *diagnostic = failure; }
    else { kjs_diagnostic_destroy(&failure); }
    return KJS_STATUS_JAVASCRIPT_EXCEPTION;
}

// Builds the bounded failure reported when the formatted source exceeded its
// execution limit. A NULL diagnostic argument simply discards it.
static kjs_status_t formatter_limit_failure(const char *message, kjs_diagnostic_t **diagnostic)
{
    if (diagnostic != NULL)
    {
        *diagnostic = kjs_diagnostic_create(KJS_STATUS_LIMIT_EXCEEDED, KJS_FORMATTER_CODE_LIMIT, message);
    }
    return KJS_STATUS_LIMIT_EXCEEDED;
}

// Consumes and discards a pending exception. An interruption arrives as an
// exception, so a path that reports its own diagnostic must still clear it:
// QuickJS keeps the exception on the context until it is read, and the next
// call would otherwise inherit it.
static void formatter_discard_exception(kjs_formatter_t *formatter)
{
    JSValue exception = JS_GetException(formatter->context);
    JS_FreeValue(formatter->context, exception);
}

// Drains the formatter's private job queue. Prettier's format entry returns a
// Promise, so its result is only observable after its microtasks run. Draining
// is safe here because this runtime is never shared with cognition execution.
//
// A job that throws instead of settling a promise leaves no result to read and
// leaves the context holding a pending exception, so that exception is consumed
// here and reported as a formatter failure. The vendored bundle never takes
// this path: every job it enqueues is a promise reaction, which turns a
// throwing handler into a rejected promise. An interruption can also make a job
// throw, which is why the exception is consumed on both failure paths.
//
// limit_message names the execution that hit a limit; the caller knows which
// one it is.
static kjs_status_t drain_jobs(kjs_formatter_t *formatter, const char *limit_message, kjs_diagnostic_t **diagnostic)
{
    JSContext *context = NULL;
    int result = 0;
    while ((result = JS_ExecutePendingJob(formatter->runtime, &context)) > 0) {}

    bool job_failed = result < 0;
    // The formatter owns exactly one context, which is the context its jobs ran
    // in. JS_GetException returns JS_NULL when nothing is pending.
    JSValue exception = job_failed ? JS_GetException(formatter->context) : JS_UNDEFINED;
    kjs_status_t status = KJS_STATUS_OK;
    if (kjs_guard_exceeded(&formatter->guard))
    {
        status = formatter_limit_failure(limit_message, diagnostic);
    }
    else if (job_failed)
    {
        status = KJS_STATUS_JAVASCRIPT_EXCEPTION;
        kjs_diagnostic_t *failure = formatter_value_diagnostic(formatter, exception, KJS_FORMATTER_CODE_RESULT,
                                                               "formatter job raised an exception");
        if (diagnostic != NULL) { *diagnostic = failure; }
        else { kjs_diagnostic_destroy(&failure); }
    }
    if (job_failed) { JS_FreeValue(formatter->context, exception); }
    return status;
}

// Runs the compiled bundle once so it can install its entry function.
static kjs_status_t formatter_install(kjs_formatter_t *formatter, kjs_diagnostic_t **diagnostic)
{
    JS_UpdateStackTop(formatter->runtime);
    kjs_guard_begin(&formatter->guard);
    kjs_status_t status = KJS_STATUS_OK;
    JSValue evaluated = JS_EvalFunction(formatter->context, formatter->format);
    formatter->format = JS_UNDEFINED;
    if (JS_IsException(evaluated))
    {
        status = formatter_failure(formatter, "formatter_bundle", "formatter bundle failed to initialize", diagnostic);
    }
    else
    {
        JS_FreeValue(formatter->context, evaluated);
        status = drain_jobs(formatter, "formatter bundle initialization exceeded its execution limit", diagnostic);
    }
    kjs_guard_end(&formatter->guard);
    return status;
}

// Releases the runtime and everything compiled into it. This drops the whole
// job queue, which is the only way to discard unfinished jobs safely: they
// cannot run under an expired limit, and there is no API to remove them one by
// one. formatter_start rebuilds the runtime from the retained bundle.
static void formatter_release_runtime(kjs_formatter_t *formatter)
{
    if (formatter->context != NULL)
    {
        JS_FreeValue(formatter->context, formatter->format);
        formatter->format = JS_UNDEFINED;
        JS_FreeContext(formatter->context);
        formatter->context = NULL;
    }
    if (formatter->runtime != NULL)
    {
        JS_FreeRuntime(formatter->runtime);
        formatter->runtime = NULL;
    }
}

// Builds the isolated runtime and installs the bundle's entry function. Used by
// kjs_formatter_create and by a format call that finds its runtime discarded
// after a limit failure.
static kjs_status_t formatter_start(kjs_formatter_t *formatter, kjs_diagnostic_t **diagnostic)
{
    formatter->format = JS_UNDEFINED;
    formatter->runtime = JS_NewRuntime();
    if (formatter->runtime == NULL)
    {
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, KJS_FORMATTER_CODE_CREATE,
                                                "cannot create formatter runtime");
        }
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    JS_SetMemoryLimit(formatter->runtime, formatter->guard.limits.memory_limit_bytes);
    JS_SetMaxStackSize(formatter->runtime, formatter->guard.limits.stack_limit_bytes);
    JS_SetInterruptHandler(formatter->runtime, kjs_interrupt_handler, &formatter->guard);
    formatter->context = JS_NewContext(formatter->runtime);
    if (formatter->context == NULL)
    {
        formatter_release_runtime(formatter);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, KJS_FORMATTER_CODE_CREATE,
                                                "cannot create formatter context");
        }
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    // The bundle is a plain global script, so it compiles to bytecode without a
    // module loader and is evaluated once here.
    formatter->format = JS_Eval(formatter->context, formatter->bundle, formatter->bundle_length, "prettier-bundle.js",
                                JS_EVAL_TYPE_GLOBAL | JS_EVAL_FLAG_COMPILE_ONLY);
    if (JS_IsException(formatter->format))
    {
        kjs_diagnostic_t *failure = formatter_exception(formatter, "formatter_bundle", "cannot compile formatter bundle");
        formatter_release_runtime(formatter);
        if (diagnostic != NULL) { *diagnostic = failure; }
        else { kjs_diagnostic_destroy(&failure); }
        return KJS_STATUS_JAVASCRIPT_EXCEPTION;
    }
    kjs_status_t status = formatter_install(formatter, diagnostic);
    if (status != KJS_STATUS_OK)
    {
        formatter_release_runtime(formatter);
        return status;
    }
    JSValue global = JS_GetGlobalObject(formatter->context);
    JSValue entry = JS_GetPropertyStr(formatter->context, global, formatter_entry);
    JS_FreeValue(formatter->context, global);
    if (!JS_IsFunction(formatter->context, entry))
    {
        JS_FreeValue(formatter->context, entry);
        formatter_release_runtime(formatter);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, KJS_FORMATTER_CODE_ENTRY,
                                                "formatter bundle does not install its entry function");
        }
        return KJS_STATUS_JAVASCRIPT_EXCEPTION;
    }
    formatter->format = entry;
    return KJS_STATUS_OK;
}

// A limit can interrupt a job, leaving the queue with jobs that must not run
// under the expired limit. Dropping the runtime drops those jobs too, so the
// next call starts from an empty queue; formatter_start rebuilds the runtime.
static void formatter_discard_unfinished(kjs_formatter_t *formatter)
{
    if (formatter->runtime != NULL && JS_IsJobPending(formatter->runtime))
    {
        formatter_release_runtime(formatter);
    }
}

kjs_status_t kjs_formatter_create(const char *bundle, size_t bundle_length, const kjs_limits_t *limits,
                                  kjs_formatter_t **formatter, kjs_diagnostic_t **diagnostic)
{
    if (formatter == NULL || bundle == NULL || bundle_length == 0U || bundle_length == SIZE_MAX || limits == NULL ||
        limits->memory_limit_bytes == 0U || limits->stack_limit_bytes == 0U || limits->interrupt_budget == 0U ||
        limits->timeout_milliseconds == 0U || !kjs_valid_utf8((const unsigned char *)bundle, bundle_length))
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *formatter = NULL;
    kjs_formatter_t *owner = calloc(1U, sizeof(*owner));
    if (owner == NULL) { return KJS_STATUS_INTERNAL_FAILURE; }
    kjs_guard_init(&owner->guard, limits);
    owner->bundle = malloc(bundle_length + 1U);
    if (owner->bundle == NULL)
    {
        free(owner);
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    memcpy(owner->bundle, bundle, bundle_length);
    owner->bundle[bundle_length] = '\0';
    owner->bundle_length = bundle_length;
    kjs_status_t status = formatter_start(owner, diagnostic);
    if (status != KJS_STATUS_OK)
    {
        kjs_formatter_destroy(&owner);
        return status;
    }
    *formatter = owner;
    return KJS_STATUS_OK;
}

void kjs_formatter_destroy(kjs_formatter_t **formatter_pointer)
{
    if (formatter_pointer == NULL || *formatter_pointer == NULL) { return; }
    kjs_formatter_t *formatter = *formatter_pointer;
    *formatter_pointer = NULL;
    formatter_release_runtime(formatter);
    free(formatter->bundle);
    formatter->bundle = NULL;
    formatter->bundle_length = 0U;
    free(formatter);
}

kjs_status_t kjs_formatter_format(kjs_formatter_t *formatter, const char *source, size_t source_length, char **output,
                                  size_t *output_length, kjs_diagnostic_t **diagnostic)
{
    if (formatter == NULL || source == NULL || output == NULL || output_length == NULL ||
        !kjs_valid_utf8((const unsigned char *)source, source_length))
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *output = NULL;
    *output_length = 0U;
    // A previous limit failure may have dropped the runtime to clear its job
    // queue; rebuild it from the retained bundle before formatting again.
    if (formatter->runtime == NULL)
    {
        kjs_status_t restarted = formatter_start(formatter, diagnostic);
        if (restarted != KJS_STATUS_OK) { return restarted; }
    }
    JS_UpdateStackTop(formatter->runtime);
    kjs_guard_begin(&formatter->guard);
    kjs_status_t status = KJS_STATUS_OK;
    kjs_status_t drained = KJS_STATUS_OK;
    JSValue argument = JS_NewStringLen(formatter->context, source, source_length);
    JSValue result = JS_Call(formatter->context, formatter->format, JS_UNDEFINED, 1, &argument);
    JS_FreeValue(formatter->context, argument);
    if (JS_IsException(result))
    {
        // An interruption aborts the entry with an exception too, so the limit
        // check comes first: a source that ate the execution budget is a
        // bounded failure of that source, not a formatter fault. This mirrors
        // the cognition path, which resolves a limit before an exception.
        if (kjs_guard_exceeded(&formatter->guard))
        {
            formatter_discard_exception(formatter);
            status = formatter_limit_failure("formatting exceeded its execution limit", diagnostic);
        }
        else
        {
            status =
                formatter_failure(formatter, KJS_FORMATTER_CODE_FORMAT, "formatter raised an exception", diagnostic);
        }
    }
    else if ((drained = drain_jobs(formatter, "formatting exceeded its execution limit", diagnostic)) != KJS_STATUS_OK)
    {
        status = drained;
    }
    else if (!JS_IsPromise(result) || JS_PromiseState(formatter->context, result) != JS_PROMISE_FULFILLED)
    {
        status = KJS_STATUS_JAVASCRIPT_EXCEPTION;
        if (diagnostic != NULL)
        {
            // A rejected promise carries the parser's own diagnostic, which is
            // the useful message for a syntax error. Any other unsettled state
            // means the entry never resolved.
            if (JS_IsPromise(result) && JS_PromiseState(formatter->context, result) == JS_PROMISE_REJECTED)
            {
                JSValue reason = JS_PromiseResult(formatter->context, result);
                *diagnostic = formatter_value_diagnostic(formatter, reason, KJS_FORMATTER_CODE_FORMAT, "formatter rejected its input");
                JS_FreeValue(formatter->context, reason);
            }
            else
            {
                *diagnostic = kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, KJS_FORMATTER_CODE_RESULT,
                                                    "formatter did not produce a settled result");
            }
        }
    }
    else
    {
        JSValue settled = JS_PromiseResult(formatter->context, result);
        if (JS_IsException(settled))
        {
            status = formatter_failure(formatter, KJS_FORMATTER_CODE_FORMAT, "formatter rejected its input", diagnostic);
        }
        else if (!JS_IsString(settled))
        {
            status = KJS_STATUS_JAVASCRIPT_EXCEPTION;
            if (diagnostic != NULL)
            {
                *diagnostic = kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, KJS_FORMATTER_CODE_RESULT,
                                                    "formatter result is not a string");
            }
        }
        else
        {
            size_t length = 0U;
            const char *text = JS_ToCStringLen(formatter->context, &length, settled);
            if (text == NULL)
            {
                status = KJS_STATUS_INTERNAL_FAILURE;
                if (diagnostic != NULL)
                {
                    *diagnostic = kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, KJS_FORMATTER_CODE_RESULT,
                                                        "cannot read formatter result");
                }
            }
            else
            {
                char *copy = malloc(length + 1U);
                if (copy == NULL)
                {
                    status = KJS_STATUS_INTERNAL_FAILURE;
                }
                else
                {
                    memcpy(copy, text, length);
                    copy[length] = '\0';
                    *output = copy;
                    *output_length = length;
                }
                JS_FreeCString(formatter->context, text);
            }
        }
        JS_FreeValue(formatter->context, settled);
    }
    JS_FreeValue(formatter->context, result);
    kjs_guard_end(&formatter->guard);
    // A limit can interrupt a job, leaving the queue with jobs that must not run
    // under the expired limit. Drop the runtime (and its queue) so the next call
    // starts from an empty queue; formatter_start rebuilds it.
    if (status != KJS_STATUS_OK && kjs_guard_exceeded(&formatter->guard))
    {
        formatter_discard_unfinished(formatter);
    }
    return status;
}
