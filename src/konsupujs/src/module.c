#include "module.h"
#include "diagnostic.h"
#include "host.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int is_host_module(const char *name)
{ return strcmp(name, "konsupu:json") == 0 || strcmp(name, "konsupu:input") == 0; }

static char *versioned_host_name(JSContext *context, kjs_context_t *owner, const char *name)
{
    static const char prefix[] = "@host/";
    const char *logical = strcmp(name, "konsupu:json") == 0 ? "json" : "input";
    size_t prefix_length = sizeof(prefix) - 1U;
    size_t identity_length = strlen(owner->module_identity);
    size_t logical_length = strlen(logical);
    if (prefix_length > SIZE_MAX - identity_length - logical_length - 2U)
    {
        JS_ThrowRangeError(context, "module identity is too long");
        return NULL;
    }
    size_t length = prefix_length + identity_length + 1U + logical_length;
    char *output = js_malloc(context, length + 1U);
    if (output == NULL)
    {
        JS_ThrowOutOfMemory(context);
        return NULL;
    }
    memcpy(output, prefix, prefix_length);
    memcpy(output + prefix_length, owner->module_identity, identity_length);
    output[prefix_length + identity_length] = '/';
    memcpy(output + prefix_length + identity_length + 1U, logical, logical_length + 1U);
    return output;
}

static const char *logical_host_name(kjs_context_t *owner, const char *name)
{
    static const char prefix[] = "@host/";
    if (strncmp(name, prefix, sizeof(prefix) - 1U) != 0) return NULL;
    const char *identity = name + sizeof(prefix) - 1U;
    size_t identity_length = strlen(owner->module_identity);
    if (strncmp(identity, owner->module_identity, identity_length) != 0 || identity[identity_length] != '/')
    {
        return NULL;
    }
    const char *logical = identity + identity_length + 1U;
    if (strcmp(logical, "json") == 0) return "konsupu:json";
    if (strcmp(logical, "input") == 0) return "konsupu:input";
    return NULL;
}

static int invalid_specifier(const char *name)
{
    return name == NULL || name[0] == '\0' || name[0] == '/' || strstr(name, "://") != NULL ||
           strchr(name, '\\') != NULL || name[strlen(name) - 1U] == '/';
}

static const char *logical_base_name(kjs_context_t *owner, const char *base_name)
{
    static const char prefix[] = "@cognition/";
    if (owner == NULL || base_name == NULL || strncmp(base_name, prefix, sizeof(prefix) - 1U) != 0)
    {
        return base_name;
    }
    const char *version = base_name + sizeof(prefix) - 1U;
    size_t identity_length = strlen(owner->module_identity);
    if (strncmp(version, owner->module_identity, identity_length) != 0 || version[identity_length] != '/')
    {
        return base_name;
    }
    return version + identity_length + 1U;
}

static char *versioned_name(JSContext *context, kjs_context_t *owner, const char *logical_name)
{
    static const char prefix[] = "@cognition/";
    size_t prefix_length = sizeof(prefix) - 1U;
    size_t version_length = strlen(owner->module_identity);
    size_t logical_length = strlen(logical_name);
    if (prefix_length > SIZE_MAX - version_length - logical_length - 2U)
    {
        JS_ThrowRangeError(context, "module identity is too long");
        return NULL;
    }
    size_t length = prefix_length + version_length + 1U + logical_length;
    char *output = js_malloc(context, length + 1U);
    if (output == NULL)
    {
        JS_ThrowOutOfMemory(context);
        return NULL;
    }
    memcpy(output, prefix, prefix_length);
    memcpy(output + prefix_length, owner->module_identity, version_length);
    output[prefix_length + version_length] = '/';
    memcpy(output + prefix_length + version_length + 1U, logical_name, logical_length + 1U);
    return output;
}

static const char *logical_loaded_name(kjs_context_t *owner, const char *name)
{ return logical_base_name(owner, name); }

static char *normalize_path(JSContext *context, const char *base_name, const char *name)
{
    char combined[4096];
    if (strncmp(base_name, "@transient/", 11U) == 0 || strncmp(base_name, "@entry/", 7U) == 0)
    {
        if (strncmp(name, "./", 2U) != 0)
        {
            JS_ThrowReferenceError(context, "entry modules require explicit relative imports");
            return NULL;
        }
        int length = snprintf(combined, sizeof(combined), "%s", name + 2U);
        if (length < 0 || (size_t)length >= sizeof(combined))
        {
            JS_ThrowReferenceError(context, "module path is too long");
            return NULL;
        }
    }
    else
    {
        const char *separator = strrchr(base_name, '/');
        size_t directory_length = separator == NULL ? 0U : (size_t)(separator - base_name + 1);
        if (directory_length + strlen(name) >= sizeof(combined))
        {
            JS_ThrowReferenceError(context, "module path is too long");
            return NULL;
        }
        memcpy(combined, base_name, directory_length);
        strcpy(combined + directory_length, name);
    }

    char working[4096];
    strcpy(working, combined);
    char *segments[256];
    size_t count = 0U;
    char *cursor = working;
    while (*cursor != '\0')
    {
        while (*cursor == '/') cursor++;
        if (*cursor == '\0') break;
        char *segment = cursor;
        while (*cursor != '\0' && *cursor != '/') cursor++;
        if (*cursor == '/')
        {
            *cursor = '\0';
            cursor++;
        }
        if (strcmp(segment, ".") == 0 || segment[0] == '\0') { continue; }
        if (strcmp(segment, "..") == 0)
        {
            if (count == 0U)
            {
                JS_ThrowReferenceError(context, "module path escapes Cognition Space");
                return NULL;
            }
            count--;
        }
        else
        {
            if (count >= sizeof(segments) / sizeof(segments[0]))
            {
                JS_ThrowReferenceError(context, "module path has too many segments");
                return NULL;
            }
            segments[count++] = segment;
        }
    }
    if (count == 0U)
    {
        JS_ThrowReferenceError(context, "module path is empty");
        return NULL;
    }
    size_t length = 0U;
    for (size_t index = 0U; index < count; index++) { length += strlen(segments[index]) + (index == 0U ? 0U : 1U); }
    if (length < 3U || strcmp(segments[count - 1U] + strlen(segments[count - 1U]) - 3U, ".js") != 0)
    {
        JS_ThrowReferenceError(context, "cognition module import requires an explicit .js extension");
        return NULL;
    }
    char *output = js_malloc(context, length + 1U);
    if (output == NULL)
    {
        JS_ThrowOutOfMemory(context);
        return NULL;
    }
    output[0] = '\0';
    for (size_t index = 0U; index < count; index++)
    {
        if (index != 0U) strcat(output, "/");
        strcat(output, segments[index]);
    }
    return output;
}

char *kjs_normalize_module(JSContext *context, const char *base_name, const char *name, void *opaque)
{
    (void)opaque;
    kjs_context_t *owner = JS_GetContextOpaque(context);
    if (owner == NULL)
    {
        JS_ThrowInternalError(context, "Konsupu JavaScript context is not initialized");
        return NULL;
    }
    if (is_host_module(name))
    {
        if (strncmp(base_name, "@transient/", 11U) == 0)
        {
            JS_ThrowReferenceError(context, "transient modules cannot import host modules directly");
            return NULL;
        }
        if (strcmp(name, "konsupu:input") == 0 && owner->kind != KJS_CONTEXT_RESOLVE)
        {
            JS_ThrowReferenceError(context, "konsupu:input is available only to Resolve");
            return NULL;
        }
        return versioned_host_name(context, owner, name);
    }
    if (invalid_specifier(name) || (strncmp(name, "./", 2U) != 0 && strncmp(name, "../", 3U) != 0))
    {
        JS_ThrowReferenceError(context, "unsupported module specifier %s", name == NULL ? "" : name);
        return NULL;
    }
    const char *logical_base = logical_base_name(owner, base_name);
    char *normalized = normalize_path(context, logical_base, name);
    if (normalized != NULL && strncmp(base_name, "@transient/", 11U) == 0 &&
        strncmp(normalized, "Interface/", 10U) != 0)
    {
        js_free(context, normalized);
        JS_ThrowReferenceError(context, "transient modules may import only Interface JavaScript");
        return NULL;
    }
    if (normalized == NULL) return NULL;
    char *versioned = versioned_name(context, owner, normalized);
    js_free(context, normalized);
    return versioned;
}

JSModuleDef *kjs_load_module(JSContext *context, const char *name, void *opaque)
{
    (void)opaque;
    kjs_context_t *owner = JS_GetContextOpaque(context);
    if (owner == NULL)
    {
        JS_ThrowInternalError(context, "Konsupu JavaScript context is not initialized");
        return NULL;
    }
    const char *host_name = logical_host_name(owner, name);
    if (host_name != NULL && strcmp(host_name, "konsupu:json") == 0) { return kjs_json_module(context, name); }
    if (host_name != NULL && strcmp(host_name, "konsupu:input") == 0)
    {
        if (owner->kind != KJS_CONTEXT_RESOLVE)
        {
            JS_ThrowReferenceError(context, "konsupu:input is available only to Resolve");
            return NULL;
        }
        return kjs_input_module(context, name);
    }
    const char *logical_name = logical_loaded_name(owner, name);
    if (logical_name == name)
    {
        JS_ThrowReferenceError(context, "module identity does not match the active Cognition Space version");
        return NULL;
    }
    size_t required = 0U;
    kjs_diagnostic_t *diagnostic = NULL;
    kjs_status_t status =
        owner->owner->host.load_module(owner->owner->host.userdata, owner->kind, owner->module_version, logical_name,
                                       NULL, 0U, &required, &diagnostic);
    if (status != KJS_STATUS_OK || required == 0U || required == SIZE_MAX)
    {
        if (status == KJS_STATUS_OK) status = KJS_STATUS_HOST_FAILURE;
        kjs_throw_host_diagnostic(context, status, diagnostic, "module loader failed");
        return NULL;
    }
    unsigned char *source = malloc(required + 1U);
    if (source == NULL)
    {
        JS_ThrowOutOfMemory(context);
        return NULL;
    }
    size_t written = 0U;
    diagnostic = NULL;
    status = owner->owner->host.load_module(owner->owner->host.userdata, owner->kind, owner->module_version,
                                            logical_name, source, required, &written, &diagnostic);
    if (status != KJS_STATUS_OK || written != required)
    {
        if (status == KJS_STATUS_OK) status = KJS_STATUS_HOST_FAILURE;
        kjs_throw_host_diagnostic(context, status, diagnostic, "module loader failed");
        free(source);
        return NULL;
    }
    if (!kjs_valid_utf8(source, written))
    {
        free(source);
        kjs_throw_host_diagnostic(context, KJS_STATUS_HOST_FAILURE, NULL, "module loader returned invalid UTF-8");
        return NULL;
    }
    source[written] = '\0';
    JSValue compiled =
        JS_Eval(context, (const char *)source, written, name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
    free(source);
    if (JS_IsException(compiled)) { return NULL; }
    return JS_VALUE_GET_PTR(compiled);
}
