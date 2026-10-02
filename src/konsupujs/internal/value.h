#ifndef KJS_VALUE_H
#define KJS_VALUE_H

#include "context.h"

struct kjs_value
{
    kjs_runtime_t *owner;
    JSValue value;
};

kjs_value_t *kjs_wrap_value(kjs_runtime_t *runtime, JSValue value);

#endif
