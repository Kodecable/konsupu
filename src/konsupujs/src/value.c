#include "value.h"

#include <stdlib.h>

kjs_value_t *kjs_wrap_value(kjs_runtime_t *runtime, JSValue value)
{
    kjs_value_t *wrapped = malloc(sizeof(*wrapped));
    if (wrapped == NULL) { return NULL; }
    wrapped->owner = runtime;
    wrapped->value = value;
    return wrapped;
}

kjs_status_t kjs_value_retain(const kjs_value_t *value, kjs_value_t **retained)
{
    if (value == NULL || retained == NULL || value->owner == NULL || value->owner->runtime == NULL)
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    JSValue duplicate = JS_DupValueRT(value->owner->runtime, value->value);
    *retained = kjs_wrap_value(value->owner, duplicate);
    if (*retained == NULL)
    {
        JS_FreeValueRT(value->owner->runtime, duplicate);
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    return KJS_STATUS_OK;
}

void kjs_value_release(kjs_value_t **value_pointer)
{
    if (value_pointer == NULL || *value_pointer == NULL) { return; }
    kjs_value_t *value = *value_pointer;
    *value_pointer = NULL;
    if (value->owner != NULL && value->owner->runtime != NULL) { JS_FreeValueRT(value->owner->runtime, value->value); }
    value->owner = NULL;
    free(value);
}
