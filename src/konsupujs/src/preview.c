#include "value.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum
{
    KJS_PREVIEW_MAX_DEPTH = 6,
    KJS_PREVIEW_MAX_NODES = 256,
    KJS_PREVIEW_MAX_STRING = 4096,
    KJS_PREVIEW_MAX_ITEMS = 64,
    KJS_PREVIEW_MAX_BYTES = 12288,
};

typedef struct preview_builder
{
    char *data;
    size_t length;
    size_t capacity;
    size_t nodes;
    const void *ancestors[KJS_PREVIEW_MAX_DEPTH + 1U];
} preview_builder_t;

static int append_bytes(preview_builder_t *builder, const char *text, size_t length)
{
    if (length > KJS_PREVIEW_MAX_BYTES - builder->length) return 0;
    size_t required = builder->length + length + 1U;
    if (required > builder->capacity)
    {
        size_t capacity = builder->capacity == 0U ? 128U : builder->capacity;
        while (capacity < required && capacity < KJS_PREVIEW_MAX_BYTES + 1U) { capacity *= 2U; }
        if (capacity > KJS_PREVIEW_MAX_BYTES + 1U) { capacity = KJS_PREVIEW_MAX_BYTES + 1U; }
        char *data = realloc(builder->data, capacity);
        if (data == NULL) return -1;
        builder->data = data;
        builder->capacity = capacity;
    }
    memcpy(builder->data + builder->length, text, length);
    builder->length += length;
    builder->data[builder->length] = '\0';
    return 1;
}

static int append_text(preview_builder_t *builder, const char *text)
{ return append_bytes(builder, text, strlen(text)); }

static size_t valid_utf8_prefix(const char *text, size_t length)
{
    while (length > 0U && ((unsigned char)text[length] & 0xc0U) == 0x80U) length--;
    return length;
}

static int append_quoted(preview_builder_t *builder, const char *text, size_t length)
{
    int result = append_text(builder, "\"");
    if (result <= 0) return result;
    int truncated = length > KJS_PREVIEW_MAX_STRING;
    if (truncated) length = valid_utf8_prefix(text, KJS_PREVIEW_MAX_STRING);
    for (size_t index = 0U; index < length; index++)
    {
        unsigned char byte = (unsigned char)text[index];
        const char *escape = NULL;
        switch (byte)
        {
        case '\\':
            escape = "\\\\";
            break;
        case '"':
            escape = "\\\"";
            break;
        case '\b':
            escape = "\\b";
            break;
        case '\f':
            escape = "\\f";
            break;
        case '\n':
            escape = "\\n";
            break;
        case '\r':
            escape = "\\r";
            break;
        case '\t':
            escape = "\\t";
            break;
        default:
            break;
        }
        if (escape != NULL) { result = append_text(builder, escape); }
        else if (byte < 0x20U)
        {
            char encoded[7];
            int written = snprintf(encoded, sizeof(encoded), "\\u%04x", byte);
            result = written == 6 ? append_bytes(builder, encoded, 6U) : -1;
        }
        else
        {
            result = append_bytes(builder, (const char *)&text[index], 1U);
        }
        if (result <= 0) return result;
    }
    if (truncated && append_text(builder, "…") <= 0) return 0;
    return append_text(builder, "\"");
}

static void free_descriptor(JSContext *context, JSPropertyDescriptor *descriptor)
{
    JS_FreeValue(context, descriptor->value);
    JS_FreeValue(context, descriptor->getter);
    JS_FreeValue(context, descriptor->setter);
}

static int preview_value(JSContext *context, const kjs_runtime_t *runtime, preview_builder_t *builder,
                         JSValueConst value, size_t depth);

static int preview_property(JSContext *context, const kjs_runtime_t *runtime, preview_builder_t *builder,
                            JSValueConst object, JSAtom atom, size_t depth)
{
    JSPropertyDescriptor descriptor = {
        .value = JS_UNDEFINED,
        .getter = JS_UNDEFINED,
        .setter = JS_UNDEFINED,
    };
    int present = JS_GetOwnProperty(context, &descriptor, object, atom);
    if (present <= 0) return present;
    int result;
    if ((descriptor.flags & JS_PROP_TMASK) != JS_PROP_NORMAL) { result = append_text(builder, "[accessor]"); }
    else
    {
        result = preview_value(context, runtime, builder, descriptor.value, depth);
    }
    free_descriptor(context, &descriptor);
    return result;
}

static int preview_array(JSContext *context, const kjs_runtime_t *runtime, preview_builder_t *builder,
                         JSValueConst value, size_t depth)
{
    int64_t length = 0;
    if (JS_GetLength(context, value, &length) < 0) return -1;
    if (append_text(builder, "[") <= 0) return 0;
    int64_t visible = length > KJS_PREVIEW_MAX_ITEMS ? KJS_PREVIEW_MAX_ITEMS : length;
    for (int64_t index = 0; index < visible; index++)
    {
        if (index != 0 && append_text(builder, ", ") <= 0) return 0;
        JSAtom atom = JS_NewAtomUInt32(context, (uint32_t)index);
        int result = preview_property(context, runtime, builder, value, atom, depth + 1U);
        JS_FreeAtom(context, atom);
        if (result < 0) return -1;
        if (result == 0 && append_text(builder, "<empty>") <= 0) return 0;
    }
    if (visible < length)
    {
        if (visible != 0 && append_text(builder, ", ") <= 0) return 0;
        if (append_text(builder, "…") <= 0) return 0;
    }
    return append_text(builder, "]");
}

static int preview_object(JSContext *context, const kjs_runtime_t *runtime, preview_builder_t *builder,
                          JSValueConst value, size_t depth)
{
    JSPropertyEnum *properties = NULL;
    uint32_t count = 0U;
    if (JS_GetOwnPropertyNames(context, &properties, &count, value,
                               JS_GPN_STRING_MASK | JS_GPN_ENUM_ONLY | JS_GPN_SET_ENUM) < 0)
    {
        return -1;
    }
    if (append_text(builder, "{") <= 0)
    {
        JS_FreePropertyEnum(context, properties, count);
        return 0;
    }
    uint32_t visible = count > KJS_PREVIEW_MAX_ITEMS ? KJS_PREVIEW_MAX_ITEMS : count;
    for (uint32_t index = 0U; index < visible; index++)
    {
        if (index != 0U && append_text(builder, ", ") <= 0)
        {
            JS_FreePropertyEnum(context, properties, count);
            return 0;
        }
        size_t key_length = 0U;
        const char *key = JS_AtomToCStringLen(context, &key_length, properties[index].atom);
        if (key == NULL || append_quoted(builder, key, key_length) <= 0 || append_text(builder, ": ") <= 0)
        {
            if (key != NULL) JS_FreeCString(context, key);
            JS_FreePropertyEnum(context, properties, count);
            return key == NULL ? -1 : 0;
        }
        JS_FreeCString(context, key);
        int result = preview_property(context, runtime, builder, value, properties[index].atom, depth + 1U);
        if (result <= 0)
        {
            JS_FreePropertyEnum(context, properties, count);
            return result;
        }
    }
    if (visible < count)
    {
        if (visible != 0U && append_text(builder, ", ") <= 0)
        {
            JS_FreePropertyEnum(context, properties, count);
            return 0;
        }
        if (append_text(builder, "…") <= 0)
        {
            JS_FreePropertyEnum(context, properties, count);
            return 0;
        }
    }
    JS_FreePropertyEnum(context, properties, count);
    return append_text(builder, "}");
}

static int preview_value(JSContext *context, const kjs_runtime_t *runtime, preview_builder_t *builder,
                         JSValueConst value, size_t depth)
{
    if (++builder->nodes > KJS_PREVIEW_MAX_NODES) return append_text(builder, "…");
    if (JS_IsUndefined(value)) return append_text(builder, "undefined");
    if (JS_IsNull(value)) return append_text(builder, "null");
    if (JS_IsBool(value)) { return append_text(builder, JS_VALUE_GET_BOOL(value) ? "true" : "false"); }
    if (JS_IsNumber(value))
    {
        double number = 0.0;
        if (JS_ToFloat64(context, &number, value) < 0) return -1;
        if (isnan(number)) return append_text(builder, "NaN");
        if (isinf(number)) return append_text(builder, number < 0 ? "-Infinity" : "Infinity");
        char text[64];
        int length = snprintf(text, sizeof(text), "%.17g", number);
        return length > 0 && (size_t)length < sizeof(text) ? append_bytes(builder, text, (size_t)length) : -1;
    }
    if (JS_IsString(value))
    {
        size_t length = 0U;
        const char *text = JS_ToCStringLen(context, &length, value);
        if (text == NULL) return -1;
        int result = append_quoted(builder, text, length);
        JS_FreeCString(context, text);
        return result;
    }
    if (JS_IsFunction(context, value)) return append_text(builder, "[function]");
    if (!JS_IsObject(value)) return append_text(builder, "[value]");
    if (depth >= KJS_PREVIEW_MAX_DEPTH) return append_text(builder, "…");

    JSClassID class_id = JS_GetClassID(value);
    if (class_id != runtime->plain_object_class && class_id != runtime->array_class)
    {
        return append_text(builder, "[object]");
    }
    const void *identity = JS_VALUE_GET_PTR(value);
    for (size_t index = 0U; index < depth; index++)
    {
        if (builder->ancestors[index] == identity) { return append_text(builder, "[Circular]"); }
    }
    builder->ancestors[depth] = identity;
    int result = class_id == runtime->array_class ? preview_array(context, runtime, builder, value, depth)
                                                  : preview_object(context, runtime, builder, value, depth);
    builder->ancestors[depth] = NULL;
    return result;
}

kjs_status_t kjs_value_preview(const kjs_value_t *value, char **text, size_t *text_length,
                               kjs_diagnostic_t **diagnostic)
{
    if (value == NULL || text == NULL || text_length == NULL || value->owner == NULL ||
        value->owner->preview_context == NULL)
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *text = NULL;
    *text_length = 0U;
    preview_builder_t builder = {0};
    JSContext *context = value->owner->preview_context;
    JS_UpdateStackTop(value->owner->runtime);
    int result = preview_value(context, value->owner, &builder, value->value, 0U);
    if (result <= 0)
    {
        free(builder.data);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(
                result < 0 ? KJS_STATUS_JAVASCRIPT_EXCEPTION : KJS_STATUS_LIMIT_EXCEEDED,
                result < 0 ? "preview_failed" : "preview_limit",
                result < 0 ? "cannot preview JavaScript value" : "JavaScript value preview exceeded its output limit");
        }
        return result < 0 ? KJS_STATUS_JAVASCRIPT_EXCEPTION : KJS_STATUS_LIMIT_EXCEEDED;
    }
    if (builder.data == NULL)
    {
        builder.data = malloc(1U);
        if (builder.data == NULL) return KJS_STATUS_INTERNAL_FAILURE;
        builder.data[0] = '\0';
    }
    *text = builder.data;
    *text_length = builder.length;
    return KJS_STATUS_OK;
}
