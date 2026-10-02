#ifndef KJS_CONTEXT_H
#define KJS_CONTEXT_H

#include "runtime.h"

struct kjs_context
{
    kjs_runtime_t *owner;
    JSContext *context;
    kjs_context_kind_t kind;
    char *module_version;
    char *module_identity;
    uint64_t evaluations;
    kjs_status_t pending_host_status;
    kjs_diagnostic_t *pending_host_diagnostic;
};

kjs_status_t kjs_exception_status(kjs_context_t *context, kjs_diagnostic_t **diagnostic);
kjs_status_t kjs_pending_host_status(kjs_context_t *context, kjs_diagnostic_t **diagnostic);
kjs_status_t kjs_execution_limit_status(kjs_context_t *context, kjs_diagnostic_t **diagnostic);
kjs_status_t kjs_evaluate_default_export(kjs_context_t *context, const char *source, size_t source_length,
                                         const char *filename, JSValue *value, kjs_diagnostic_t **diagnostic);

#endif
