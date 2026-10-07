#include <setjmp.h>
#include <stdarg.h>
#include <stddef.h>
#include <stdint.h>

#include <cmocka.h>
#include <string.h>

#include "konsupujs.h"

static kjs_status_t load_module(uintptr_t userdata, kjs_context_kind_t kind, const char *version, const char *name,
                                unsigned char *destination, size_t capacity, size_t *written,
                                kjs_diagnostic_t **diagnostic)
{
    (void)userdata;
    (void)kind;
    (void)version;
    (void)name;
    (void)destination;
    (void)capacity;
    *written = 0U;
    if (diagnostic != NULL)
    {
        *diagnostic = kjs_diagnostic_create(KJS_STATUS_HOST_FAILURE, "not_found", "module not found");
    }
    return KJS_STATUS_HOST_FAILURE;
}

static kjs_status_t json_failure(kjs_diagnostic_t **diagnostic)
{
    if (diagnostic != NULL)
    {
        *diagnostic = kjs_diagnostic_create(KJS_STATUS_HOST_FAILURE, "denied", "JSON host is unavailable in this test");
    }
    return KJS_STATUS_HOST_FAILURE;
}

static kjs_status_t read_json(uintptr_t userdata, kjs_context_kind_t kind, const char *path, unsigned char *output,
                              size_t output_capacity, size_t *output_length, kjs_diagnostic_t **diagnostic)
{
    (void)userdata;
    (void)kind;
    (void)path;
    (void)output;
    (void)output_capacity;
    *output_length = 0U;
    return json_failure(diagnostic);
}

static kjs_status_t write_json(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                               const unsigned char *input, size_t input_length, kjs_diagnostic_t **diagnostic)
{
    (void)userdata;
    (void)kind;
    (void)path;
    (void)input;
    (void)input_length;
    return json_failure(diagnostic);
}

static kjs_status_t remove_json(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                kjs_diagnostic_t **diagnostic)
{
    (void)userdata;
    (void)kind;
    (void)path;
    return json_failure(diagnostic);
}

static kjs_status_t move_json(uintptr_t userdata, kjs_context_kind_t kind, const char *path, const char *destination,
                              kjs_diagnostic_t **diagnostic)
{
    (void)userdata;
    (void)kind;
    (void)path;
    (void)destination;
    return json_failure(diagnostic);
}

void test_runtime_context_value(void **state)
{
    (void)state;
    kjs_limits_t limits = {
        .memory_limit_bytes = 16U << 20,
        .stack_limit_bytes = 1U << 20,
        .interrupt_budget = 100000U,
        .timeout_milliseconds = 1000U,
    };
    kjs_host_t host = {
        .load_module = load_module,
        .read_json = read_json,
        .write_json = write_json,
        .create_json = write_json,
        .remove_json = remove_json,
        .move_json = move_json,
    };
    kjs_runtime_t *runtime = NULL;
    kjs_context_t *input = NULL;
    kjs_context_t *output = NULL;
    kjs_runtime_t *other_runtime = NULL;
    kjs_context_t *other_context = NULL;
    kjs_value_t *value = NULL;
    kjs_value_t *retained = NULL;
    kjs_value_t *invalid_value = NULL;
    kjs_diagnostic_t *diagnostic = NULL;
    assert_int_equal(kjs_runtime_create(&limits, &host, &runtime, &diagnostic), KJS_STATUS_OK);
    assert_non_null(runtime);
    assert_int_equal(kjs_context_create(runtime, KJS_CONTEXT_INPUT, "revision-a", &input, &diagnostic), KJS_STATUS_OK);
    assert_int_equal(kjs_context_create(runtime, KJS_CONTEXT_OUTPUT, "revision-a", &output, &diagnostic),
                     KJS_STATUS_OK);
    const char source[] = "export default { answer: 42 };";
    assert_int_equal(kjs_context_evaluate_module(input, source, strlen(source), &value, &diagnostic), KJS_STATUS_OK);

    const char promise_source[] = "export default Promise.resolve(42);";
    assert_int_equal(
        kjs_context_evaluate_module(input, promise_source, strlen(promise_source), &invalid_value, &diagnostic),
        KJS_STATUS_JAVASCRIPT_EXCEPTION);
    assert_null(invalid_value);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), "asynchronous_result");
    kjs_diagnostic_destroy(&diagnostic);

    assert_int_equal(kjs_value_retain(value, &retained), KJS_STATUS_OK);
    assert_int_equal(kjs_context_set_global(output, "StructuredOutput", retained, &diagnostic), KJS_STATUS_OK);
    bool present = false;
    assert_int_equal(kjs_context_has_global(output, "StructuredOutput", &present, &diagnostic), KJS_STATUS_OK);
    assert_true(present);
    char *preview = NULL;
    size_t preview_length = 0U;
    assert_int_equal(kjs_value_preview(value, &preview, &preview_length, &diagnostic), KJS_STATUS_OK);
    assert_non_null(preview);
    assert_non_null(strstr(preview, "\"answer\": 42"));
    assert_int_equal(strlen(preview), preview_length);
    kjs_buffer_free(preview);

    char *whole = NULL;
    size_t whole_length = 0U;
    assert_int_equal(kjs_value_string(value, 64U, &whole, &whole_length, &diagnostic), KJS_STATUS_INVALID_ARGUMENT);
    assert_non_null(diagnostic);
    assert_string_equal(kjs_diagnostic_code(diagnostic), "not_string");
    kjs_diagnostic_destroy(&diagnostic);
    kjs_value_t *long_string = NULL;
    const char long_source[] = "export default 'x'.repeat(2000) + '\\u00e9';";
    assert_int_equal(kjs_context_evaluate_module(input, long_source, strlen(long_source), &long_string, &diagnostic),
                     KJS_STATUS_OK);
    assert_int_equal(kjs_value_string(long_string, 4096U, &whole, &whole_length, &diagnostic), KJS_STATUS_OK);
    assert_int_equal(whole_length, 2002U);
    assert_int_equal((unsigned char)whole[2000], 0xc3U);
    kjs_buffer_free(whole);
    assert_int_equal(kjs_value_string(long_string, 1000U, &whole, &whole_length, &diagnostic),
                     KJS_STATUS_LIMIT_EXCEEDED);
    assert_null(whole);
    kjs_diagnostic_destroy(&diagnostic);
    kjs_value_release(&long_string);

    const char invalid_utf8[] = {(char)0xc3, (char)0x28};
    invalid_value = NULL;
    assert_int_equal(
        kjs_context_evaluate_module(input, invalid_utf8, sizeof(invalid_utf8), &invalid_value, &diagnostic),
        KJS_STATUS_INVALID_ARGUMENT);
    assert_null(invalid_value);

    assert_int_equal(kjs_runtime_create(&limits, &host, &other_runtime, &diagnostic), KJS_STATUS_OK);
    assert_int_equal(kjs_context_create(other_runtime, KJS_CONTEXT_OUTPUT, "revision-b", &other_context, &diagnostic),
                     KJS_STATUS_OK);
    assert_int_equal(kjs_context_set_global(other_context, "ForeignValue", value, &diagnostic),
                     KJS_STATUS_INVALID_ARGUMENT);
    kjs_context_destroy(&other_context);
    kjs_runtime_destroy(&other_runtime);
    kjs_value_release(&retained);
    assert_null(retained);
    kjs_value_release(&retained);
    kjs_value_release(&value);
    assert_null(value);
    kjs_value_release(&value);
    kjs_context_destroy(&output);
    assert_null(output);
    kjs_context_destroy(&output);
    kjs_context_destroy(&input);
    assert_null(input);
    kjs_context_destroy(&input);
    kjs_runtime_destroy(&runtime);
    assert_null(runtime);
    kjs_runtime_destroy(&runtime);

    diagnostic = kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, "test", "test diagnostic");
    assert_non_null(diagnostic);
    kjs_diagnostic_destroy(&diagnostic);
    assert_null(diagnostic);
    kjs_diagnostic_destroy(&diagnostic);

    const char invalid_diagnostic_utf8[] = {(char)0xc3, (char)0x28, '\0'};
    assert_null(kjs_diagnostic_create(KJS_STATUS_HOST_FAILURE, invalid_diagnostic_utf8, "invalid diagnostic"));
    assert_null(kjs_diagnostic_create((kjs_status_t)99, "invalid_status", "invalid diagnostic"));

    kjs_limits_t invalid_limits = limits;
    invalid_limits.memory_limit_bytes = 0U;
    assert_int_equal(kjs_runtime_create(&invalid_limits, &host, &other_runtime, &diagnostic),
                     KJS_STATUS_INVALID_ARGUMENT);
    assert_null(other_runtime);

    kjs_limits_t timeout_limits = limits;
    timeout_limits.interrupt_budget = UINT64_MAX;
    timeout_limits.timeout_milliseconds = 1U;
    assert_int_equal(kjs_runtime_create(&timeout_limits, &host, &other_runtime, &diagnostic), KJS_STATUS_OK);
    assert_int_equal(kjs_context_create(other_runtime, KJS_CONTEXT_INPUT, "timeout", &other_context, &diagnostic),
                     KJS_STATUS_OK);
    const char infinite_source[] = "export default (() => { while (true) {} })();";
    assert_int_equal(kjs_context_evaluate_module(other_context, infinite_source, strlen(infinite_source),
                                                 &invalid_value, &diagnostic),
                     KJS_STATUS_LIMIT_EXCEEDED);
    assert_null(invalid_value);
    assert_non_null(diagnostic);
    assert_int_equal(kjs_diagnostic_status(diagnostic), KJS_STATUS_LIMIT_EXCEEDED);
    kjs_diagnostic_destroy(&diagnostic);
    kjs_context_destroy(&other_context);
    kjs_runtime_destroy(&other_runtime);
}
