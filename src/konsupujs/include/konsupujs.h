#ifndef KONSUPUJS_H
#define KONSUPUJS_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#if defined(_WIN32) && defined(KJS_SHARED)
#if defined(KJS_BUILD)
#define KJS_API __declspec(dllexport)
#else
#define KJS_API __declspec(dllimport)
#endif
#elif defined(KJS_SHARED) && (defined(__GNUC__) || defined(__clang__))
#define KJS_API __attribute__((visibility("default")))
#else
#define KJS_API
#endif

#ifdef __cplusplus
extern "C"
{
#endif

    typedef struct kjs_runtime kjs_runtime_t;
    typedef struct kjs_context kjs_context_t;
    typedef struct kjs_value kjs_value_t;
    typedef struct kjs_diagnostic kjs_diagnostic_t;
    typedef struct kjs_formatter kjs_formatter_t;

    typedef enum kjs_context_kind
    {
        KJS_CONTEXT_INPUT = 0,
        KJS_CONTEXT_RESOLVE = 1,
        KJS_CONTEXT_OUTPUT = 2,
        KJS_CONTEXT_TEST = 3
    } kjs_context_kind_t;

    typedef enum kjs_status
    {
        KJS_STATUS_OK = 0,
        KJS_STATUS_INVALID_ARGUMENT = 1,
        KJS_STATUS_INPUT_OBJECT_INVALID = 2,
        KJS_STATUS_JAVASCRIPT_EXCEPTION = 3,
        KJS_STATUS_LIMIT_EXCEEDED = 4,
        KJS_STATUS_HOST_FAILURE = 5,
        KJS_STATUS_INTERNAL_FAILURE = 6
    } kjs_status_t;

    typedef struct kjs_limits
    {
        size_t memory_limit_bytes;
        size_t stack_limit_bytes;
        uint64_t interrupt_budget;
        uint64_t timeout_milliseconds;
    } kjs_limits_t;

    typedef kjs_status_t (*kjs_load_module_fn)(uintptr_t userdata, kjs_context_kind_t kind, const char *module_version,
                                               const char *module_name, unsigned char *destination, size_t capacity,
                                               size_t *written, kjs_diagnostic_t **diagnostic);

    typedef kjs_status_t (*kjs_read_json_fn)(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                             unsigned char *output, size_t output_capacity, size_t *output_length,
                                             kjs_diagnostic_t **diagnostic);

    typedef kjs_status_t (*kjs_write_json_fn)(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                              const unsigned char *input, size_t input_length,
                                              kjs_diagnostic_t **diagnostic);

    typedef kjs_status_t (*kjs_remove_json_fn)(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                               kjs_diagnostic_t **diagnostic);

    typedef kjs_status_t (*kjs_move_json_fn)(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                             const char *destination_path, kjs_diagnostic_t **diagnostic);

    typedef bool (*kjs_should_interrupt_fn)(uintptr_t userdata);

    typedef struct kjs_host
    {
        uintptr_t userdata;
        kjs_load_module_fn load_module;
        kjs_read_json_fn read_json;
        kjs_write_json_fn write_json;
        kjs_write_json_fn create_json;
        kjs_remove_json_fn remove_json;
        kjs_move_json_fn move_json;
        kjs_should_interrupt_fn should_interrupt;
    } kjs_host_t;

    KJS_API kjs_status_t kjs_runtime_create(const kjs_limits_t *limits, const kjs_host_t *host, kjs_runtime_t **runtime,
                                            kjs_diagnostic_t **diagnostic);
    KJS_API void kjs_runtime_destroy(kjs_runtime_t **runtime);

    KJS_API kjs_status_t kjs_context_create(kjs_runtime_t *runtime, kjs_context_kind_t kind, const char *module_version,
                                            kjs_context_t **context, kjs_diagnostic_t **diagnostic);
    KJS_API void kjs_context_destroy(kjs_context_t **context);

    KJS_API kjs_status_t kjs_context_evaluate_module(kjs_context_t *context, const char *source, size_t source_length,
                                                     kjs_value_t **value, kjs_diagnostic_t **diagnostic);
    KJS_API kjs_status_t kjs_context_has_global(kjs_context_t *context, const char *name, bool *present,
                                                kjs_diagnostic_t **diagnostic);
    KJS_API kjs_status_t kjs_context_get_global(kjs_context_t *context, const char *name, kjs_value_t **value,
                                                kjs_diagnostic_t **diagnostic);
    KJS_API kjs_status_t kjs_context_set_global(kjs_context_t *context, const char *name, const kjs_value_t *value,
                                                kjs_diagnostic_t **diagnostic);
    KJS_API kjs_status_t kjs_context_call_resolve(kjs_context_t *context, const kjs_value_t *input,
                                                  kjs_value_t **output, kjs_diagnostic_t **diagnostic);
    KJS_API kjs_status_t kjs_context_validate_resolve(kjs_context_t *context, kjs_diagnostic_t **diagnostic);
    KJS_API kjs_status_t kjs_context_call_test(kjs_context_t *context, bool *passed, kjs_diagnostic_t **diagnostic);

    /* Canonical JavaScript formatter.
     *
     * The formatter is independent of cognition execution: it owns a private
     * runtime, exposes no host callbacks, and is never used to run Cognition
     * Space source. `bundle` is the formatter program itself, evaluated once by
     * kjs_formatter_create; each kjs_formatter_format call reuses it.
     *
     * A formatter is single-threaded and must not be used concurrently.
     * `output` is NUL-terminated and released with kjs_buffer_free. */
    KJS_API kjs_status_t kjs_formatter_create(const char *bundle, size_t bundle_length, const kjs_limits_t *limits,
                                              kjs_formatter_t **formatter, kjs_diagnostic_t **diagnostic);
    KJS_API void kjs_formatter_destroy(kjs_formatter_t **formatter);
    KJS_API kjs_status_t kjs_formatter_format(kjs_formatter_t *formatter, const char *source, size_t source_length,
                                              char **output, size_t *output_length, kjs_diagnostic_t **diagnostic);

    /* Diagnostic codes reported by the formatter API. They are stable
     * identifiers for the kind of failure, not human-readable messages.
     *
     * KJS_FORMATTER_CODE_FORMAT and KJS_FORMATTER_CODE_LIMIT describe the
     * source being formatted. Every other code describes a formatter failure,
     * which the caller cannot fix by changing its source. */
#define KJS_FORMATTER_CODE_CREATE "formatter_create"
#define KJS_FORMATTER_CODE_BUNDLE "formatter_bundle"
#define KJS_FORMATTER_CODE_ENTRY "formatter_entry"
#define KJS_FORMATTER_CODE_FORMAT "formatter_format"
#define KJS_FORMATTER_CODE_RESULT "formatter_result"
#define KJS_FORMATTER_CODE_LIMIT "execution_limit"

    /* Reports whether a formatter diagnostic code describes a formatter
     * failure rather than a bounded failure of the formatted source. Unknown
     * and NULL codes are treated as formatter failures. */
    KJS_API bool kjs_formatter_code_is_infrastructure(const char *code);

    KJS_API kjs_status_t kjs_value_retain(const kjs_value_t *value, kjs_value_t **retained);
    KJS_API void kjs_value_release(kjs_value_t **value);
    KJS_API kjs_status_t kjs_value_preview(const kjs_value_t *value, char **text, size_t *text_length,
                                           kjs_diagnostic_t **diagnostic);

    KJS_API kjs_diagnostic_t *kjs_diagnostic_create(kjs_status_t status, const char *code, const char *message);
    KJS_API kjs_status_t kjs_diagnostic_status(const kjs_diagnostic_t *diagnostic);
    KJS_API const char *kjs_diagnostic_code(const kjs_diagnostic_t *diagnostic);
    KJS_API const char *kjs_diagnostic_message(const kjs_diagnostic_t *diagnostic);
    KJS_API const char *kjs_diagnostic_exception_type(const kjs_diagnostic_t *diagnostic);
    KJS_API const char *kjs_diagnostic_stack(const kjs_diagnostic_t *diagnostic);
    KJS_API void kjs_diagnostic_destroy(kjs_diagnostic_t **diagnostic);
    KJS_API void kjs_buffer_free(void *buffer);

#ifdef __cplusplus
}
#endif

#endif
