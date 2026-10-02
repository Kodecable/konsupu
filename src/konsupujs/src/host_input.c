#include "module.h"

static int define_string_property(JSContext *context, JSValueConst object, const char *name, JSValue value, int flags)
{
    if (JS_IsException(value)) { return -1; }
    return JS_DefinePropertyValueStr(context, object, name, value, flags);
}

static JSValue input_error_constructor(JSContext *context, JSValueConst new_target, int argc, JSValueConst *argv)
{
    (void)new_target;
    kjs_context_t *owner = JS_GetContextOpaque(context);
    if (owner == NULL || owner->owner == NULL || owner->owner->input_error_class == JS_INVALID_CLASS_ID)
    {
        return JS_ThrowInternalError(context, "Konsupu JavaScript context is not initialized");
    }

    JSValue native_error = JS_NewError(context);
    if (JS_IsException(native_error)) return native_error;
    JSValue prototype = JS_GetPrototype(context, native_error);
    JSValue stack = JS_GetPropertyStr(context, native_error, "stack");

    JSValue error = JS_NewObjectClass(context, owner->owner->input_error_class);
    if (JS_IsException(error))
    {
        JS_FreeValue(context, prototype);
        JS_FreeValue(context, stack);
        JS_FreeValue(context, native_error);
        return error;
    }
    if (JS_SetPrototype(context, error, prototype) < 0 ||
        define_string_property(context, error, "name", JS_NewString(context, "InputObjectInvalidError"),
                               JS_PROP_CONFIGURABLE) < 0)
    {
        JS_FreeValue(context, prototype);
        JS_FreeValue(context, stack);
        JS_FreeValue(context, native_error);
        JS_FreeValue(context, error);
        return JS_EXCEPTION;
    }
    JS_FreeValue(context, prototype);
    if (argc > 0)
    {
        JSValue message = JS_ToString(context, argv[0]);
        if (JS_IsException(message))
        {
            JS_FreeValue(context, stack);
            JS_FreeValue(context, native_error);
            JS_FreeValue(context, error);
            return message;
        }
        if (define_string_property(context, error, "message", message, JS_PROP_CONFIGURABLE | JS_PROP_WRITABLE) < 0)
        {
            JS_FreeValue(context, stack);
            JS_FreeValue(context, native_error);
            JS_FreeValue(context, error);
            return JS_EXCEPTION;
        }
    }
    if (!JS_IsException(stack) && !JS_IsUndefined(stack))
    {
        if (define_string_property(context, error, "stack", stack, JS_PROP_CONFIGURABLE | JS_PROP_WRITABLE) < 0)
        {
            JS_FreeValue(context, native_error);
            JS_FreeValue(context, error);
            return JS_EXCEPTION;
        }
    }
    else
    {
        JS_FreeValue(context, stack);
    }
    JS_FreeValue(context, native_error);
    return error;
}

static int input_module_init(JSContext *context, JSModuleDef *module)
{
    JSValue constructor =
        JS_NewCFunction2(context, input_error_constructor, "InputObjectInvalidError", 1, JS_CFUNC_constructor, 0);
    JS_SetModuleExport(context, module, "InputObjectInvalidError", constructor);
    return 0;
}

JSModuleDef *kjs_input_module(JSContext *context, const char *name)
{
    JSModuleDef *module = JS_NewCModule(context, name, input_module_init);
    if (module == NULL) return NULL;
    JS_AddModuleExport(context, module, "InputObjectInvalidError");
    return module;
}
