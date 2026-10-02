#ifndef KJS_MODULE_H
#define KJS_MODULE_H

#include "context.h"

char *kjs_normalize_module(JSContext *context, const char *base_name, const char *name, void *opaque);
JSModuleDef *kjs_load_module(JSContext *context, const char *name, void *opaque);
JSModuleDef *kjs_json_module(JSContext *context, const char *name);
JSModuleDef *kjs_input_module(JSContext *context, const char *name);

#endif
