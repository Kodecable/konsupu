#include "value.h"

#include <stdlib.h>
#include <string.h>

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

kjs_status_t kjs_value_string(const kjs_value_t *value, size_t max_bytes, char **text, size_t *text_length,
                              kjs_diagnostic_t **diagnostic)
{
    if (value == NULL || text == NULL || text_length == NULL || value->owner == NULL ||
        value->owner->preview_context == NULL)
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *text = NULL;
    *text_length = 0U;
    if (!JS_IsString(value->value))
    {
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_INVALID_ARGUMENT, "not_string",
                                                "JavaScript value is not a string");
        }
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    JSContext *context = value->owner->preview_context;
    JS_UpdateStackTop(value->owner->runtime);
    size_t length = 0U;
    const char *converted = JS_ToCStringLen(context, &length, value->value);
    if (converted == NULL)
    {
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_JAVASCRIPT_EXCEPTION, "string_failed",
                                                "cannot convert JavaScript string");
        }
        return KJS_STATUS_JAVASCRIPT_EXCEPTION;
    }
    if (length > max_bytes)
    {
        JS_FreeCString(context, converted);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_LIMIT_EXCEEDED, "string_limit",
                                                "JavaScript string exceeds its size limit");
        }
        return KJS_STATUS_LIMIT_EXCEEDED;
    }
    char *copy = malloc(length + 1U);
    if (copy == NULL)
    {
        JS_FreeCString(context, converted);
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    memcpy(copy, converted, length);
    copy[length] = '\0';
    JS_FreeCString(context, converted);
    *text = copy;
    *text_length = length;
    return KJS_STATUS_OK;
}
