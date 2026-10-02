#include "diagnostic.h"
#include "context.h"

#include <stdlib.h>
#include <string.h>

kjs_diagnostic_t *kjs_diagnostic_create(kjs_status_t status, const char *code, const char *message)
{
    const char *effective_code = code == NULL ? "internal" : code;
    const char *effective_message = message == NULL ? "JavaScript execution failed" : message;
    size_t code_length = strlen(effective_code);
    size_t message_length = strlen(effective_message);
    if (status < KJS_STATUS_OK || status > KJS_STATUS_INTERNAL_FAILURE ||
        !kjs_valid_utf8((const unsigned char *)effective_code, code_length) ||
        !kjs_valid_utf8((const unsigned char *)effective_message, message_length))
    {
        return NULL;
    }
    kjs_diagnostic_t *diagnostic = calloc(1U, sizeof(*diagnostic));
    if (diagnostic == NULL) { return NULL; }
    diagnostic->status = status;
    diagnostic->code = kjs_copy_string(effective_code);
    diagnostic->message = kjs_copy_string(effective_message);
    if (diagnostic->code == NULL || diagnostic->message == NULL)
    {
        kjs_diagnostic_destroy(&diagnostic);
        return NULL;
    }
    return diagnostic;
}

void kjs_set_exception_details(kjs_diagnostic_t *diagnostic, const char *exception_type, const char *stack)
{
    if (diagnostic == NULL) { return; }
    free(diagnostic->exception_type);
    free(diagnostic->stack);
    diagnostic->exception_type = kjs_copy_string(exception_type);
    diagnostic->stack = kjs_copy_string(stack);
}

kjs_status_t kjs_diagnostic_status(const kjs_diagnostic_t *diagnostic)
{ return diagnostic == NULL ? KJS_STATUS_INTERNAL_FAILURE : diagnostic->status; }

const char *kjs_diagnostic_code(const kjs_diagnostic_t *diagnostic)
{ return diagnostic == NULL ? "internal" : diagnostic->code; }

const char *kjs_diagnostic_message(const kjs_diagnostic_t *diagnostic)
{ return diagnostic == NULL ? "JavaScript execution failed" : diagnostic->message; }

const char *kjs_diagnostic_exception_type(const kjs_diagnostic_t *diagnostic)
{ return diagnostic == NULL ? NULL : diagnostic->exception_type; }

const char *kjs_diagnostic_stack(const kjs_diagnostic_t *diagnostic)
{ return diagnostic == NULL ? NULL : diagnostic->stack; }

void kjs_diagnostic_destroy(kjs_diagnostic_t **diagnostic_pointer)
{
    if (diagnostic_pointer == NULL || *diagnostic_pointer == NULL) { return; }
    kjs_diagnostic_t *diagnostic = *diagnostic_pointer;
    *diagnostic_pointer = NULL;
    free(diagnostic->code);
    free(diagnostic->message);
    free(diagnostic->exception_type);
    free(diagnostic->stack);
    free(diagnostic);
}

static const char *exception_string_property(JSContext *context, JSValueConst exception, const char *name)
{
    JSAtom atom = JS_NewAtom(context, name);
    if (atom == JS_ATOM_NULL) return NULL;
    JSPropertyDescriptor descriptor = {0};
    int present = JS_GetOwnProperty(context, &descriptor, exception, atom);
    JS_FreeAtom(context, atom);
    if (present <= 0) return NULL;
    const char *text = NULL;
    if ((descriptor.flags & JS_PROP_TMASK) == JS_PROP_NORMAL && JS_IsString(descriptor.value))
    {
        text = JS_ToCString(context, descriptor.value);
    }
    JS_FreeValue(context, descriptor.value);
    JS_FreeValue(context, descriptor.getter);
    JS_FreeValue(context, descriptor.setter);
    return text;
}

kjs_status_t kjs_exception_status(kjs_context_t *context, kjs_diagnostic_t **diagnostic)
{
    kjs_status_t pending = kjs_pending_host_status(context, diagnostic);
    if (pending != KJS_STATUS_OK)
    {
        JSValue exception = JS_GetException(context->context);
        JS_FreeValue(context->context, exception);
        return pending;
    }
    kjs_status_t limited = kjs_execution_limit_status(context, diagnostic);
    if (limited != KJS_STATUS_OK)
    {
        JSValue exception = JS_GetException(context->context);
        JS_FreeValue(context->context, exception);
        return limited;
    }
    JSValue exception = JS_GetException(context->context);
    int input_invalid = JS_IsObject(exception) && JS_GetClassID(exception) == context->owner->input_error_class;
    int native_error = input_invalid || JS_IsError(exception);
    const char *type = native_error ? exception_string_property(context->context, exception, "name") : NULL;
    const char *message = native_error ? exception_string_property(context->context, exception, "message") : NULL;
    const char *stack = native_error ? exception_string_property(context->context, exception, "stack") : NULL;
    kjs_status_t status = input_invalid ? KJS_STATUS_INPUT_OBJECT_INVALID : KJS_STATUS_JAVASCRIPT_EXCEPTION;
    if (diagnostic != NULL)
    {
        *diagnostic = kjs_diagnostic_create(status, input_invalid ? "input_object_invalid" : "javascript_exception",
                                            message == NULL ? "JavaScript exception" : message);
        kjs_set_exception_details(*diagnostic, type == NULL ? (native_error ? "Error" : "ThrownValue") : type, stack);
    }
    if (type != NULL) JS_FreeCString(context->context, type);
    if (message != NULL) JS_FreeCString(context->context, message);
    if (stack != NULL) JS_FreeCString(context->context, stack);
    JS_FreeValue(context->context, exception);
    return status;
}

kjs_status_t kjs_execution_limit_status(kjs_context_t *context, kjs_diagnostic_t **diagnostic)
{
    if (context == NULL || !kjs_execution_exceeded(context->owner)) { return KJS_STATUS_OK; }
    if (diagnostic != NULL)
    {
        *diagnostic =
            kjs_diagnostic_create(KJS_STATUS_LIMIT_EXCEEDED, "execution_limit", "JavaScript execution limit exceeded");
    }
    return KJS_STATUS_LIMIT_EXCEEDED;
}

kjs_status_t kjs_pending_host_status(kjs_context_t *context, kjs_diagnostic_t **diagnostic)
{
    if (context == NULL || context->pending_host_status == KJS_STATUS_OK) { return KJS_STATUS_OK; }
    kjs_status_t status = context->pending_host_status;
    context->pending_host_status = KJS_STATUS_OK;
    kjs_diagnostic_t *pending = context->pending_host_diagnostic;
    context->pending_host_diagnostic = NULL;
    if (diagnostic != NULL)
    {
        if (pending == NULL)
        {
            pending = kjs_diagnostic_create(status, "host_failure", "JavaScript Host operation failed");
        }
        *diagnostic = pending;
    }
    else
    {
        kjs_diagnostic_destroy(&pending);
    }
    return status;
}
