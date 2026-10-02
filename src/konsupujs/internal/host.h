#ifndef KJS_HOST_H
#define KJS_HOST_H

#include "context.h"

JSValue kjs_throw_host_diagnostic(JSContext *context, kjs_status_t status, kjs_diagnostic_t *diagnostic,
                                  const char *fallback);

#endif
