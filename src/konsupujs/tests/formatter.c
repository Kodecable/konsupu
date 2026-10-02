#include <setjmp.h>
#include <stdarg.h>
#include <stddef.h>
#include <stdint.h>

#include <cmocka.h>
#include <stdlib.h>
#include <string.h>

#include "konsupujs.h"

// A tiny stand-in for the vendored formatter bundle. It exercises the same
// contract the real bundle uses: a global script that installs an entry
// function returning a Promise that settles after one microtask.
static const char stub_bundle[] =
    "globalThis.__konsupuFormat = (source) => Promise.resolve(source.trim() + '\\n');";

static kjs_limits_t stub_limits(void)
{
    kjs_limits_t limits = {
        .memory_limit_bytes = 16U << 20,
        .stack_limit_bytes = 1U << 20,
        .interrupt_budget = 1000000U,
        .timeout_milliseconds = 5000U,
    };
    return limits;
}

static kjs_formatter_t *create_formatter(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status = kjs_formatter_create(stub_bundle, sizeof(stub_bundle) - 1U, &limits, &formatter, &diagnostic);
    if (status != KJS_STATUS_OK)
    {
        fail_msg("kjs_formatter_create() = %d: %s", (int)status, kjs_diagnostic_message(diagnostic));
    }
    kjs_diagnostic_destroy(&diagnostic);
    assert_non_null(formatter);
    return formatter;
}

void test_formatter_formats_and_reuses(void **state)
{
    kjs_formatter_t *formatter = create_formatter(state);
    for (int index = 0; index < 3; index++)
    {
        char *output = NULL;
        size_t length = 0U;
        kjs_diagnostic_t *diagnostic = NULL;
        kjs_status_t status =
            kjs_formatter_format(formatter, "  value  ", 9U, &output, &length, &diagnostic);
        assert_int_equal(status, KJS_STATUS_OK);
        assert_null(diagnostic);
        assert_non_null(output);
        assert_int_equal(length, 6U);
        assert_string_equal(output, "value\n");
        kjs_buffer_free(output);
    }
    kjs_formatter_destroy(&formatter);
    assert_null(formatter);
}

void test_formatter_reports_exception(void **state)
{
    kjs_limits_t limits = stub_limits();
    const char *bundle = "globalThis.__konsupuFormat = () => { throw new Error('formatter exploded'); };";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status =
        kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    kjs_diagnostic_destroy(&diagnostic);

    char *output = NULL;
    size_t length = 0U;
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_JAVASCRIPT_EXCEPTION);
    assert_null(output);
    assert_int_equal(length, 0U);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), "formatter_format");
    assert_string_equal(kjs_diagnostic_message(diagnostic), "formatter exploded");
    kjs_diagnostic_destroy(&diagnostic);
    kjs_formatter_destroy(&formatter);
}

void test_formatter_rejects_invalid_bundle(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    const char *bundle = "globalThis.__konsupuFormat = (source) => {";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status =
        kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_JAVASCRIPT_EXCEPTION);
    assert_null(formatter);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), "formatter_bundle");
    kjs_diagnostic_destroy(&diagnostic);
}

void test_formatter_requires_entry_function(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    const char *bundle = "globalThis.other = 1;";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status =
        kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_JAVASCRIPT_EXCEPTION);
    assert_null(formatter);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), "formatter_entry");
    kjs_diagnostic_destroy(&diagnostic);
}

void test_formatter_validates_arguments(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    kjs_formatter_t *formatter = NULL;
    assert_int_equal(kjs_formatter_create(NULL, 1U, &limits, &formatter, NULL), KJS_STATUS_INVALID_ARGUMENT);
    assert_int_equal(kjs_formatter_create(stub_bundle, 0U, &limits, &formatter, NULL), KJS_STATUS_INVALID_ARGUMENT);
    assert_int_equal(kjs_formatter_create(stub_bundle, sizeof(stub_bundle) - 1U, NULL, &formatter, NULL),
                     KJS_STATUS_INVALID_ARGUMENT);
    assert_int_equal(kjs_formatter_create(stub_bundle, sizeof(stub_bundle) - 1U, &limits, NULL, NULL),
                     KJS_STATUS_INVALID_ARGUMENT);
    kjs_limits_t zeroed = stub_limits();
    zeroed.memory_limit_bytes = 0U;
    assert_int_equal(kjs_formatter_create(stub_bundle, sizeof(stub_bundle) - 1U, &zeroed, &formatter, NULL),
                     KJS_STATUS_INVALID_ARGUMENT);

    kjs_formatter_t *live = create_formatter(state);
    char *output = NULL;
    size_t length = 0U;
    assert_int_equal(kjs_formatter_format(NULL, "value", 5U, &output, &length, NULL), KJS_STATUS_INVALID_ARGUMENT);
    assert_int_equal(kjs_formatter_format(live, NULL, 5U, &output, &length, NULL), KJS_STATUS_INVALID_ARGUMENT);
    assert_int_equal(kjs_formatter_format(live, "value", 5U, NULL, &length, NULL), KJS_STATUS_INVALID_ARGUMENT);
    assert_int_equal(kjs_formatter_format(live, "value", 5U, &output, NULL, NULL), KJS_STATUS_INVALID_ARGUMENT);
    // Invalid UTF-8 must be refused rather than passed into QuickJS.
    assert_int_equal(kjs_formatter_format(live, "\xff\xfe", 2U, &output, &length, NULL),
                     KJS_STATUS_INVALID_ARGUMENT);
    kjs_formatter_destroy(&live);
    kjs_formatter_destroy(NULL);
    kjs_formatter_destroy(&formatter);
}

void test_formatter_enforces_memory_limit(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    limits.memory_limit_bytes = 2U << 20;
    // Allocating far beyond the limit must fail as a limit or exception, never
    // as a crash or a silent success.
    const char *bundle =
        "globalThis.__konsupuFormat = () => { const held = []; for (;;) { held.push(new Array(65536).fill(1)); } };";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status =
        kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    kjs_diagnostic_destroy(&diagnostic);

    char *output = NULL;
    size_t length = 0U;
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_not_equal(status, KJS_STATUS_OK);
    assert_null(output);
    kjs_diagnostic_destroy(&diagnostic);
    kjs_formatter_destroy(&formatter);
}

void test_formatter_drains_pending_jobs(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    // The result is only observable if the formatter drains the job queue.
    const char *bundle =
        "globalThis.__konsupuFormat = (source) => Promise.resolve().then(() => "
        "Promise.resolve(source.toUpperCase()));";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status =
        kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    kjs_diagnostic_destroy(&diagnostic);

    char *output = NULL;
    size_t length = 0U;
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    assert_string_equal(output, "VALUE");
    assert_int_equal(length, 5U);
    kjs_buffer_free(output);
    kjs_formatter_destroy(&formatter);
}

// A rejected formatter promise must surface the rejection reason, because that
// is where a real parser reports the syntax error.
void test_formatter_reports_rejection_reason(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    const char *bundle =
        "globalThis.__konsupuFormat = () => Promise.reject(new SyntaxError('Unexpected token'));";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status = kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    kjs_diagnostic_destroy(&diagnostic);

    char *output = NULL;
    size_t length = 0U;
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_JAVASCRIPT_EXCEPTION);
    assert_null(output);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), "formatter_format");
    assert_string_equal(kjs_diagnostic_message(diagnostic), "Unexpected token");
    kjs_diagnostic_destroy(&diagnostic);
    kjs_formatter_destroy(&formatter);
}

// An exception that escapes a job instead of rejecting a promise leaves no
// result to read, so it must be turned into a formatter failure and consumed;
// a pending exception left in the context would corrupt the next call.
void test_formatter_consumes_escaping_job_exception(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    const char *bundle =
        "let pending = true;"
        "globalThis.__konsupuFormat = () => {"
        "  if (pending) {"
        "    pending = false;"
        "    queueMicrotask(() => { throw new Error('job exploded'); });"
        "    return new Promise(() => {});"
        "  }"
        "  return Promise.resolve('recovered\\n');"
        "};";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status = kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    kjs_diagnostic_destroy(&diagnostic);

    char *output = NULL;
    size_t length = 0U;
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_JAVASCRIPT_EXCEPTION);
    assert_null(output);
    assert_int_equal(length, 0U);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), KJS_FORMATTER_CODE_RESULT);
    assert_string_equal(kjs_diagnostic_message(diagnostic), "job exploded");
    // A job that escapes cannot be fixed by editing the formatted source.
    assert_true(kjs_formatter_code_is_infrastructure(kjs_diagnostic_code(diagnostic)));
    kjs_diagnostic_destroy(&diagnostic);

    // The consumed exception must not leak: the next call still reaches the
    // bundle and formats normally.
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    assert_null(diagnostic);
    assert_non_null(output);
    assert_string_equal(output, "recovered\n");
    assert_int_equal(length, 10U);
    kjs_buffer_free(output);
    kjs_formatter_destroy(&formatter);
}

// A source that eats the execution budget is a bounded failure of that source,
// so it must report the limit code even though QuickJS surfaces the
// interruption as an exception, and the consumed exception must not leak into
// the next call.
void test_formatter_reports_limit_interrupt(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    limits.interrupt_budget = 1000U;
    const char *bundle =
        "let armed = true;"
        "globalThis.__konsupuFormat = (source) => {"
        "  if (armed) { armed = false; for (;;) {} }"
        "  return Promise.resolve(source.trim() + '\\n');"
        "};";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status = kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    kjs_diagnostic_destroy(&diagnostic);

    char *output = NULL;
    size_t length = 0U;
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_LIMIT_EXCEEDED);
    assert_null(output);
    assert_int_equal(length, 0U);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), KJS_FORMATTER_CODE_LIMIT);
    assert_false(kjs_formatter_code_is_infrastructure(kjs_diagnostic_code(diagnostic)));
    kjs_diagnostic_destroy(&diagnostic);

    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    assert_null(diagnostic);
    assert_non_null(output);
    assert_string_equal(output, "value\n");
    kjs_buffer_free(output);
    kjs_formatter_destroy(&formatter);
}

// The code vocabulary is a contract: only invalid source and its execution
// limit describe the formatted source; everything else is a formatter failure.
void test_formatter_classifies_diagnostic_codes(void **state)
{
    (void)state;
    assert_false(kjs_formatter_code_is_infrastructure(KJS_FORMATTER_CODE_FORMAT));
    assert_false(kjs_formatter_code_is_infrastructure(KJS_FORMATTER_CODE_LIMIT));
    assert_true(kjs_formatter_code_is_infrastructure(KJS_FORMATTER_CODE_CREATE));
    assert_true(kjs_formatter_code_is_infrastructure(KJS_FORMATTER_CODE_BUNDLE));
    assert_true(kjs_formatter_code_is_infrastructure(KJS_FORMATTER_CODE_ENTRY));
    assert_true(kjs_formatter_code_is_infrastructure(KJS_FORMATTER_CODE_RESULT));
    assert_true(kjs_formatter_code_is_infrastructure("something_else"));
    assert_true(kjs_formatter_code_is_infrastructure(NULL));
}

// A real syntax error must report the documented source code, so the Go side's
// classification matches what konsupujs actually emits.
void test_formatter_reports_documented_codes(void **state)
{
    (void)state;
    kjs_limits_t limits = stub_limits();
    const char *bundle =
        "globalThis.__konsupuFormat = () => Promise.reject(new SyntaxError('Unexpected token'));";
    kjs_formatter_t *formatter = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status = kjs_formatter_create(bundle, strlen(bundle), &limits, &formatter, &diagnostic);
    assert_int_equal(status, KJS_STATUS_OK);
    kjs_diagnostic_destroy(&diagnostic);

    char *output = NULL;
    size_t length = 0U;
    status = kjs_formatter_format(formatter, "value", 5U, &output, &length, &diagnostic);
    assert_int_equal(status, KJS_STATUS_JAVASCRIPT_EXCEPTION);
    assert_string_equal(kjs_diagnostic_code(diagnostic), KJS_FORMATTER_CODE_FORMAT);
    assert_false(kjs_formatter_code_is_infrastructure(kjs_diagnostic_code(diagnostic)));
    kjs_diagnostic_destroy(&diagnostic);
    kjs_formatter_destroy(&formatter);
}
