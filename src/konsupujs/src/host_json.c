#include "diagnostic.h"
#include "host.h"
#include "module.h"

#include <stdlib.h>
#include <string.h>

typedef enum json_operation
{
    JSON_READ = 0,
    JSON_WRITE,
    JSON_CREATE,
    JSON_REMOVE,
    JSON_MOVE,
} json_operation_t;

JSValue kjs_throw_host_diagnostic(JSContext *context, kjs_status_t status, kjs_diagnostic_t *diagnostic,
                                  const char *fallback)
{
    kjs_context_t *owner = JS_GetContextOpaque(context);
    const char *message = diagnostic == NULL ? fallback : kjs_diagnostic_message(diagnostic);
    JSValue exception = JS_ThrowInternalError(context, "%s", message == NULL ? "host operation failed" : message);
    if (owner != NULL)
    {
        kjs_diagnostic_destroy(&owner->pending_host_diagnostic);
        owner->pending_host_status = status == KJS_STATUS_OK ? KJS_STATUS_HOST_FAILURE : status;
        owner->pending_host_diagnostic = diagnostic;
    }
    else
    {
        kjs_diagnostic_destroy(&diagnostic);
    }
    return exception;
}

// JSON operation failures are part of the JavaScript API contract. They must
// remain ordinary JavaScript exceptions so cognition code can handle them with
// try/catch. Module-loader failures use kjs_throw_host_diagnostic instead,
// because they cannot be recovered by the importing module's execution.
static JSValue throw_json_diagnostic(JSContext *context, kjs_status_t status, kjs_diagnostic_t *diagnostic,
                                     const char *fallback)
{
    (void)status;
    const char *message = diagnostic == NULL ? fallback : kjs_diagnostic_message(diagnostic);
    JSValue exception = JS_ThrowInternalError(context, "%s", message == NULL ? "host operation failed" : message);
    kjs_diagnostic_destroy(&diagnostic);
    return exception;
}

static JSValue json_operation(JSContext *context, json_operation_t operation, int argc, JSValueConst *argv)
{
    kjs_context_t *owner = JS_GetContextOpaque(context);
    if (owner == NULL) { return JS_ThrowInternalError(context, "JSON host is unavailable"); }
    int minimum = operation == JSON_MOVE || operation == JSON_WRITE || operation == JSON_CREATE ? 2 : 1;
    if (argc != minimum) { return JS_ThrowTypeError(context, "invalid JSON host argument count"); }
    size_t path_length = 0U;
    const char *path = JS_ToCStringLen(context, &path_length, argv[0]);
    if (path == NULL) { return JS_EXCEPTION; }
    if (memchr(path, '\0', path_length) != NULL || !kjs_valid_utf8((const unsigned char *)path, path_length))
    {
        JS_FreeCString(context, path);
        return JS_ThrowTypeError(context, "JSON path must be valid UTF-8 without NUL bytes");
    }
    const char *destination = NULL;
    const unsigned char *input = NULL;
    size_t input_length = 0U;
    JSValue serialized = JS_UNDEFINED;
    const char *serialized_text = NULL;
    if (operation == JSON_MOVE)
    {
        size_t destination_length = 0U;
        destination = JS_ToCStringLen(context, &destination_length, argv[1]);
        if (destination == NULL)
        {
            JS_FreeCString(context, path);
            return JS_EXCEPTION;
        }
        if (memchr(destination, '\0', destination_length) != NULL ||
            !kjs_valid_utf8((const unsigned char *)destination, destination_length))
        {
            JS_FreeCString(context, destination);
            JS_FreeCString(context, path);
            return JS_ThrowTypeError(context, "JSON destination path must be valid UTF-8 without NUL bytes");
        }
    }
    else if (operation == JSON_WRITE || operation == JSON_CREATE)
    {
        serialized = JS_JSONStringify(context, argv[1], JS_UNDEFINED, JS_UNDEFINED);
        if (JS_IsException(serialized) || JS_IsUndefined(serialized))
        {
            JS_FreeCString(context, path);
            JS_FreeValue(context, serialized);
            return JS_ThrowTypeError(context, "JSON value is not serializable");
        }
        serialized_text = JS_ToCStringLen(context, &input_length, serialized);
        if (serialized_text == NULL)
        {
            JS_FreeCString(context, path);
            JS_FreeValue(context, serialized);
            return JS_EXCEPTION;
        }
        input = (const unsigned char *)serialized_text;
    }

    size_t required = 0U;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status;
    switch (operation)
    {
    case JSON_READ:
        status = owner->owner->host.read_json(owner->owner->host.userdata, owner->kind, path, NULL, 0U, &required,
                                              &diagnostic);
        break;
    case JSON_WRITE:
        status = owner->owner->host.write_json(owner->owner->host.userdata, owner->kind, path, input, input_length,
                                               &diagnostic);
        break;
    case JSON_CREATE:
        status = owner->owner->host.create_json(owner->owner->host.userdata, owner->kind, path, input, input_length,
                                                &diagnostic);
        break;
    case JSON_REMOVE:
        status = owner->owner->host.remove_json(owner->owner->host.userdata, owner->kind, path, &diagnostic);
        break;
    case JSON_MOVE:
        status = owner->owner->host.move_json(owner->owner->host.userdata, owner->kind, path, destination, &diagnostic);
        break;
    default:
        status = KJS_STATUS_INVALID_ARGUMENT;
        break;
    }
    unsigned char *output = NULL;
    if (status == KJS_STATUS_OK && operation == JSON_READ)
    {
        if (required == 0U || required == SIZE_MAX) { status = KJS_STATUS_HOST_FAILURE; }
        else
        {
            output = malloc(required + 1U);
            if (output == NULL) { status = KJS_STATUS_INTERNAL_FAILURE; }
            else
            {
                size_t written = 0U;
                status = owner->owner->host.read_json(owner->owner->host.userdata, owner->kind, path, output, required,
                                                      &written, &diagnostic);
                if (status == KJS_STATUS_OK && written != required) { status = KJS_STATUS_HOST_FAILURE; }
                if (written <= required)
                {
                    output[written] = '\0';
                    required = written;
                }
                else
                {
                    output[required] = '\0';
                    status = KJS_STATUS_HOST_FAILURE;
                }
            }
        }
    }

    if (serialized_text != NULL) JS_FreeCString(context, serialized_text);
    JS_FreeValue(context, serialized);
    if (destination != NULL) JS_FreeCString(context, destination);
    JS_FreeCString(context, path);
    if (status != KJS_STATUS_OK)
    {
        free(output);
        return throw_json_diagnostic(context, status, diagnostic, "JSON host operation failed");
    }
    kjs_diagnostic_destroy(&diagnostic);
    if (operation != JSON_READ) { return JS_UNDEFINED; }
    JSValue value = JS_ParseJSON(context, (const char *)output, required, "<konsupu:json>");
    free(output);
    if (JS_IsException(value))
    {
        JSValue parse_exception = JS_GetException(context);
        JS_FreeValue(context, parse_exception);
        return throw_json_diagnostic(context, KJS_STATUS_HOST_FAILURE, NULL, "JSON Host returned invalid JSON");
    }
    return value;
}

static JSValue js_read(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    return json_operation(ctx, JSON_READ, argc, argv);
}
static JSValue js_write(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    return json_operation(ctx, JSON_WRITE, argc, argv);
}
static JSValue js_create(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    return json_operation(ctx, JSON_CREATE, argc, argv);
}
static JSValue js_remove(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    return json_operation(ctx, JSON_REMOVE, argc, argv);
}
static JSValue js_move(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    return json_operation(ctx, JSON_MOVE, argc, argv);
}

static int json_module_init(JSContext *context, JSModuleDef *module)
{
    JS_SetModuleExport(context, module, "Read", JS_NewCFunction(context, js_read, "Read", 1));
    JS_SetModuleExport(context, module, "Write", JS_NewCFunction(context, js_write, "Write", 2));
    JS_SetModuleExport(context, module, "Create", JS_NewCFunction(context, js_create, "Create", 2));
    JS_SetModuleExport(context, module, "Remove", JS_NewCFunction(context, js_remove, "Remove", 1));
    JS_SetModuleExport(context, module, "Move", JS_NewCFunction(context, js_move, "Move", 2));
    return 0;
}

JSModuleDef *kjs_json_module(JSContext *context, const char *name)
{
    JSModuleDef *module = JS_NewCModule(context, name, json_module_init);
    if (module == NULL) return NULL;
    JS_AddModuleExport(context, module, "Read");
    JS_AddModuleExport(context, module, "Write");
    JS_AddModuleExport(context, module, "Create");
    JS_AddModuleExport(context, module, "Remove");
    JS_AddModuleExport(context, module, "Move");
    return module;
}
