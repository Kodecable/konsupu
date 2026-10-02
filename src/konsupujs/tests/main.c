#include <setjmp.h>
#include <stdarg.h>
#include <stddef.h>
#include <stdint.h>

#include <cmocka.h>

void test_runtime_context_value(void **state);

void test_formatter_formats_and_reuses(void **state);
void test_formatter_reports_exception(void **state);
void test_formatter_rejects_invalid_bundle(void **state);
void test_formatter_requires_entry_function(void **state);
void test_formatter_validates_arguments(void **state);
void test_formatter_enforces_memory_limit(void **state);
void test_formatter_drains_pending_jobs(void **state);
void test_formatter_reports_rejection_reason(void **state);
void test_formatter_consumes_escaping_job_exception(void **state);
void test_formatter_reports_limit_interrupt(void **state);
void test_formatter_classifies_diagnostic_codes(void **state);
void test_formatter_reports_documented_codes(void **state);

int main(void)
{
    const struct CMUnitTest tests[] = {
        cmocka_unit_test(test_runtime_context_value),
        cmocka_unit_test(test_formatter_formats_and_reuses),
        cmocka_unit_test(test_formatter_reports_exception),
        cmocka_unit_test(test_formatter_rejects_invalid_bundle),
        cmocka_unit_test(test_formatter_requires_entry_function),
        cmocka_unit_test(test_formatter_validates_arguments),
        cmocka_unit_test(test_formatter_enforces_memory_limit),
        cmocka_unit_test(test_formatter_drains_pending_jobs),
        cmocka_unit_test(test_formatter_reports_rejection_reason),
        cmocka_unit_test(test_formatter_consumes_escaping_job_exception),
        cmocka_unit_test(test_formatter_reports_limit_interrupt),
        cmocka_unit_test(test_formatter_classifies_diagnostic_codes),
        cmocka_unit_test(test_formatter_reports_documented_codes),
    };
    return cmocka_run_group_tests(tests, NULL, NULL);
}
