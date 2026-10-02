#include "context.h"
#include "diagnostic.h"
#include "value.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static kjs_status_t reject_promise_result(kjs_context_t *context, JSValue *result, kjs_diagnostic_t **diagnostic)
{
    if (!JS_IsPromise(*result)) { return KJS_STATUS_OK; }
    JS_FreeValue(context->context, *result);
    *result = JS_UNDEFINED;
    if (diagnostic != NULL)
    {
        *diagnostic = kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, "asynchronous_result",
                                            "JavaScript entry returned a Promise; Konsupu execution is synchronous");
    }
    return KJS_STATUS_JAVASCRIPT_EXCEPTION;
}

kjs_status_t kjs_context_create(kjs_runtime_t *runtime, kjs_context_kind_t kind, const char *module_version,
                                kjs_context_t **context, kjs_diagnostic_t **diagnostic)
{
    size_t version_length = module_version == NULL ? 0U : strlen(module_version);
    if (runtime == NULL || context == NULL || module_version == NULL || version_length == 0U || version_length > 192U ||
        !kjs_valid_utf8((const unsigned char *)module_version, version_length) || kind < KJS_CONTEXT_INPUT ||
        kind > KJS_CONTEXT_TEST)
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *context = NULL;
    kjs_context_t *owner = calloc(1U, sizeof(*owner));
    if (owner == NULL) { return KJS_STATUS_INTERNAL_FAILURE; }
    owner->owner = runtime;
    owner->kind = kind;
    owner->pending_host_status = KJS_STATUS_OK;
    owner->module_version = kjs_copy_string(module_version);
    uint64_t sequence = atomic_fetch_add_explicit(&runtime->context_sequence, 1U, memory_order_relaxed) + 1U;
    char module_identity[256];
    int identity_length =
        snprintf(module_identity, sizeof(module_identity), "%s~%llu", module_version, (unsigned long long)sequence);
    if (identity_length > 0 && (size_t)identity_length < sizeof(module_identity))
    {
        owner->module_identity = kjs_copy_string(module_identity);
    }
    owner->context = JS_NewContext(runtime->runtime);
    if (owner->module_version == NULL || owner->module_identity == NULL || owner->context == NULL)
    {
        kjs_context_destroy(&owner);
        if (diagnostic != NULL)
        {
            *diagnostic =
                kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, "context_create", "cannot create QuickJS context");
        }
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    JS_SetContextOpaque(owner->context, owner);
    *context = owner;
    return KJS_STATUS_OK;
}

void kjs_context_destroy(kjs_context_t **context_pointer)
{
    if (context_pointer == NULL || *context_pointer == NULL) { return; }
    kjs_context_t *context = *context_pointer;
    *context_pointer = NULL;
    if (context->context != NULL)
    {
        JS_SetContextOpaque(context->context, NULL);
        JS_FreeContext(context->context);
    }
    kjs_diagnostic_destroy(&context->pending_host_diagnostic);
    free(context->module_version);
    free(context->module_identity);
    free(context);
}

kjs_status_t kjs_evaluate_default_export(kjs_context_t *context, const char *source, size_t source_length,
                                         const char *filename, JSValue *value, kjs_diagnostic_t **diagnostic)
{
    JS_UpdateStackTop(context->owner->runtime);
    JSValue compiled =
        JS_Eval(context->context, source, source_length, filename, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
    if (JS_IsException(compiled)) { return kjs_exception_status(context, diagnostic); }
    JSModuleDef *module = JS_VALUE_GET_PTR(compiled);
    JSValue evaluated = JS_EvalFunction(context->context, compiled);
    kjs_status_t pending = kjs_pending_host_status(context, diagnostic);
    if (pending != KJS_STATUS_OK)
    {
        if (JS_IsException(evaluated))
        {
            JSValue exception = JS_GetException(context->context);
            JS_FreeValue(context->context, exception);
        }
        else
        {
            JS_FreeValue(context->context, evaluated);
        }
        return pending;
    }
    if (JS_IsException(evaluated)) { return kjs_exception_status(context, diagnostic); }
    JS_FreeValue(context->context, evaluated);
    JSValue namespace_value = JS_GetModuleNamespace(context->context, module);
    if (JS_IsException(namespace_value)) { return kjs_exception_status(context, diagnostic); }
    *value = JS_GetPropertyStr(context->context, namespace_value, "default");
    JS_FreeValue(context->context, namespace_value);
    if (JS_IsException(*value)) { return kjs_exception_status(context, diagnostic); }
    return KJS_STATUS_OK;
}

kjs_status_t kjs_context_evaluate_module(kjs_context_t *context, const char *source, size_t source_length,
                                         kjs_value_t **value, kjs_diagnostic_t **diagnostic)
{
    if (context == NULL || source == NULL || value == NULL ||
        !kjs_valid_utf8((const unsigned char *)source, source_length))
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *value = NULL;
    char filename[256];
    context->evaluations++;
    int length = snprintf(filename, sizeof(filename), "@transient/%s/%llu.js", context->module_identity,
                          (unsigned long long)context->evaluations);
    if (length < 0 || (size_t)length >= sizeof(filename)) { return KJS_STATUS_INVALID_ARGUMENT; }
    JSValue result = JS_UNDEFINED;
    kjs_execution_begin(context->owner);
    kjs_status_t status = kjs_evaluate_default_export(context, source, source_length, filename, &result, diagnostic);
    if (status == KJS_STATUS_OK) { status = reject_promise_result(context, &result, diagnostic); }
    if (status == KJS_STATUS_OK) { status = kjs_execution_limit_status(context, diagnostic); }
    kjs_execution_end(context->owner);
    if (status != KJS_STATUS_OK)
    {
        if (!JS_IsUndefined(result)) JS_FreeValue(context->context, result);
        return status;
    }
    *value = kjs_wrap_value(context->owner, result);
    if (*value == NULL)
    {
        JS_FreeValue(context->context, result);
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    return KJS_STATUS_OK;
}

kjs_status_t kjs_context_has_global(kjs_context_t *context, const char *name, bool *present,
                                    kjs_diagnostic_t **diagnostic)
{
    size_t name_length = name == NULL ? 0U : strlen(name);
    if (context == NULL || name == NULL || present == NULL || name_length == 0U ||
        !kjs_valid_utf8((const unsigned char *)name, name_length))
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    JSAtom atom = JS_NewAtom(context->context, name);
    JSValue global = JS_GetGlobalObject(context->context);
    int result = JS_GetOwnProperty(context->context, NULL, global, atom);
    JS_FreeAtom(context->context, atom);
    JS_FreeValue(context->context, global);
    if (result < 0) { return kjs_exception_status(context, diagnostic); }
    *present = result != 0;
    return KJS_STATUS_OK;
}

kjs_status_t kjs_context_get_global(kjs_context_t *context, const char *name, kjs_value_t **value,
                                    kjs_diagnostic_t **diagnostic)
{
    size_t name_length = name == NULL ? 0U : strlen(name);
    if (context == NULL || name == NULL || value == NULL || name_length == 0U ||
        !kjs_valid_utf8((const unsigned char *)name, name_length))
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *value = NULL;
    kjs_execution_begin(context->owner);
    JSValue global = JS_GetGlobalObject(context->context);
    JSValue result = JS_GetPropertyStr(context->context, global, name);
    JS_FreeValue(context->context, global);
    if (JS_IsException(result))
    {
        kjs_status_t status = kjs_exception_status(context, diagnostic);
        kjs_execution_end(context->owner);
        return status;
    }
    kjs_status_t limit_status = kjs_execution_limit_status(context, diagnostic);
    kjs_execution_end(context->owner);
    if (limit_status != KJS_STATUS_OK)
    {
        JS_FreeValue(context->context, result);
        return limit_status;
    }
    *value = kjs_wrap_value(context->owner, result);
    if (*value == NULL)
    {
        JS_FreeValue(context->context, result);
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    return KJS_STATUS_OK;
}

kjs_status_t kjs_context_set_global(kjs_context_t *context, const char *name, const kjs_value_t *value,
                                    kjs_diagnostic_t **diagnostic)
{
    size_t name_length = name == NULL ? 0U : strlen(name);
    if (context == NULL || name == NULL || value == NULL || name_length == 0U ||
        !kjs_valid_utf8((const unsigned char *)name, name_length) || context->owner != value->owner)
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    kjs_execution_begin(context->owner);
    JSValue global = JS_GetGlobalObject(context->context);
    int result = JS_SetPropertyStr(context->context, global, name, JS_DupValue(context->context, value->value));
    JS_FreeValue(context->context, global);
    if (result < 0)
    {
        kjs_status_t status = kjs_exception_status(context, diagnostic);
        kjs_execution_end(context->owner);
        return status;
    }
    kjs_status_t status = kjs_execution_limit_status(context, diagnostic);
    kjs_execution_end(context->owner);
    return status;
}

static kjs_status_t call_entry(kjs_context_t *context, const char *source, JSValueConst *arguments, int argument_count,
                               JSValue *result, kjs_diagnostic_t **diagnostic)
{
    JS_UpdateStackTop(context->owner->runtime);
    kjs_execution_begin(context->owner);
    char filename[320];
    int filename_length = snprintf(filename, sizeof(filename), "@entry/%s/bootstrap.js", context->module_identity);
    if (filename_length < 0 || (size_t)filename_length >= sizeof(filename))
    {
        kjs_execution_end(context->owner);
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    JSValue function = JS_UNDEFINED;
    kjs_status_t status = kjs_evaluate_default_export(context, source, strlen(source), filename, &function, diagnostic);
    if (status != KJS_STATUS_OK)
    {
        kjs_execution_end(context->owner);
        return status;
    }
    if (!JS_IsFunction(context->context, function))
    {
        JS_FreeValue(context->context, function);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, "entry_not_callable",
                                                "required JavaScript export is not callable");
        }
        kjs_execution_end(context->owner);
        return KJS_STATUS_JAVASCRIPT_EXCEPTION;
    }
    *result = JS_Call(context->context, function, JS_UNDEFINED, argument_count, arguments);
    JS_FreeValue(context->context, function);
    kjs_status_t pending = kjs_pending_host_status(context, diagnostic);
    if (pending != KJS_STATUS_OK)
    {
        if (JS_IsException(*result))
        {
            JSValue exception = JS_GetException(context->context);
            JS_FreeValue(context->context, exception);
        }
        else
        {
            JS_FreeValue(context->context, *result);
        }
        *result = JS_UNDEFINED;
        kjs_execution_end(context->owner);
        return pending;
    }
    if (JS_IsException(*result))
    {
        status = kjs_exception_status(context, diagnostic);
        kjs_execution_end(context->owner);
        return status;
    }
    status = reject_promise_result(context, result, diagnostic);
    if (status != KJS_STATUS_OK)
    {
        kjs_execution_end(context->owner);
        return status;
    }
    status = kjs_execution_limit_status(context, diagnostic);
    kjs_execution_end(context->owner);
    if (status != KJS_STATUS_OK)
    {
        JS_FreeValue(context->context, *result);
        *result = JS_UNDEFINED;
    }
    return status;
}

kjs_status_t kjs_context_call_resolve(kjs_context_t *context, const kjs_value_t *input, kjs_value_t **output,
                                      kjs_diagnostic_t **diagnostic)
{
    if (context == NULL || input == NULL || output == NULL || context->kind != KJS_CONTEXT_RESOLVE ||
        context->owner != input->owner)
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    const char *bootstrap = "import { Resolve } from './Resolve.js'; export default Resolve;";
    JSValue argument = input->value;
    JSValue result = JS_UNDEFINED;
    kjs_status_t status = call_entry(context, bootstrap, &argument, 1, &result, diagnostic);
    if (status != KJS_STATUS_OK) { return status; }
    *output = kjs_wrap_value(context->owner, result);
    if (*output == NULL)
    {
        JS_FreeValue(context->context, result);
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    return KJS_STATUS_OK;
}

kjs_status_t kjs_context_validate_resolve(kjs_context_t *context, kjs_diagnostic_t **diagnostic)
{
    if (context == NULL || context->kind != KJS_CONTEXT_RESOLVE) { return KJS_STATUS_INVALID_ARGUMENT; }
    const char *bootstrap = "import { Resolve } from './Resolve.js'; export default Resolve;";
    JSValue function = JS_UNDEFINED;
    kjs_execution_begin(context->owner);
    kjs_status_t status = kjs_evaluate_default_export(context, bootstrap, strlen(bootstrap),
                                                      "@entry/resolve-contract.js", &function, diagnostic);
    if (status != KJS_STATUS_OK)
    {
        kjs_execution_end(context->owner);
        return status;
    }
    if (!JS_IsFunction(context->context, function))
    {
        JS_FreeValue(context->context, function);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, "resolve_not_callable",
                                                "required Resolve export is not callable");
        }
        kjs_execution_end(context->owner);
        return KJS_STATUS_JAVASCRIPT_EXCEPTION;
    }
    JS_FreeValue(context->context, function);
    status = kjs_execution_limit_status(context, diagnostic);
    kjs_execution_end(context->owner);
    return status;
}

kjs_status_t kjs_context_call_test(kjs_context_t *context, bool *passed, kjs_diagnostic_t **diagnostic)
{
    if (context == NULL || passed == NULL || context->kind != KJS_CONTEXT_TEST) { return KJS_STATUS_INVALID_ARGUMENT; }
    const char *bootstrap = "import { Test } from './Test.js'; export default Test;";
    JSValue result = JS_UNDEFINED;
    kjs_status_t status = call_entry(context, bootstrap, NULL, 0, &result, diagnostic);
    if (status != KJS_STATUS_OK)
    {
        *passed = false;
        return status;
    }
    *passed = true;
    JS_FreeValue(context->context, result);
    return KJS_STATUS_OK;
}
