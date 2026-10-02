#include "bridge.h"

extern kjs_status_t goKJSLoadModule(uintptr_t userdata, kjs_context_kind_t kind, const char *module_version,
                                    const char *module_name, unsigned char *destination, size_t capacity,
                                    size_t *written, kjs_diagnostic_t **diagnostic);
extern kjs_status_t goKJSReadJSON(uintptr_t userdata, kjs_context_kind_t kind, const char *path, unsigned char *output,
                                  size_t output_capacity, size_t *output_length, kjs_diagnostic_t **diagnostic);
extern kjs_status_t goKJSWriteJSON(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                   const unsigned char *input, size_t input_length, kjs_diagnostic_t **diagnostic);
extern kjs_status_t goKJSCreateJSON(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                    const unsigned char *input, size_t input_length, kjs_diagnostic_t **diagnostic);
extern kjs_status_t goKJSRemoveJSON(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                    kjs_diagnostic_t **diagnostic);
extern kjs_status_t goKJSMoveJSON(uintptr_t userdata, kjs_context_kind_t kind, const char *path,
                                  const char *destination_path, kjs_diagnostic_t **diagnostic);
extern bool goKJSShouldInterrupt(uintptr_t userdata);

kjs_host_t kjs_go_host(uintptr_t userdata)
{
    kjs_host_t host = {
        .userdata = userdata,
        .load_module = goKJSLoadModule,
        .read_json = goKJSReadJSON,
        .write_json = goKJSWriteJSON,
        .create_json = goKJSCreateJSON,
        .remove_json = goKJSRemoveJSON,
        .move_json = goKJSMoveJSON,
        .should_interrupt = goKJSShouldInterrupt,
    };
    return host;
}
