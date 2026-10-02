#if !defined(_WIN32)
#define _POSIX_C_SOURCE 200809L
#endif

#include "runtime.h"
#include "module.h"

#include <stdlib.h>
#include <time.h>

#if defined(_WIN32)
#include <windows.h>
#endif

static const JSClassDef input_error_class = {
    .class_name = "KonsupuInputObjectInvalidError",
};

static uint64_t monotonic_milliseconds(void)
{
#if defined(_WIN32)
    return (uint64_t)GetTickCount64();
#else
    struct timespec now;
    if (clock_gettime(CLOCK_MONOTONIC, &now) != 0) { return 0U; }
    return (uint64_t)now.tv_sec * 1000U + (uint64_t)now.tv_nsec / 1000000U;
#endif
}

void kjs_guard_init(kjs_execution_guard_t *guard, const kjs_limits_t *limits)
{
    guard->limits = *limits;
    guard->should_interrupt = NULL;
    guard->interrupt_userdata = 0U;
    atomic_init(&guard->interrupts, 0U);
    atomic_init(&guard->deadline_milliseconds, 0U);
    atomic_init(&guard->execution_active, false);
    atomic_init(&guard->limit_exceeded, false);
}

void kjs_guard_begin(kjs_execution_guard_t *guard)
{
    uint64_t now = monotonic_milliseconds();
    uint64_t timeout = guard->limits.timeout_milliseconds;
    uint64_t deadline = now > UINT64_MAX - timeout ? UINT64_MAX : now + timeout;
    atomic_store_explicit(&guard->interrupts, 0U, memory_order_relaxed);
    atomic_store_explicit(&guard->deadline_milliseconds, deadline, memory_order_relaxed);
    atomic_store_explicit(&guard->limit_exceeded, false, memory_order_relaxed);
    atomic_store_explicit(&guard->execution_active, true, memory_order_release);
}

void kjs_guard_end(kjs_execution_guard_t *guard)
{ atomic_store_explicit(&guard->execution_active, false, memory_order_release); }

bool kjs_guard_exceeded(const kjs_execution_guard_t *guard)
{ return atomic_load_explicit(&guard->limit_exceeded, memory_order_relaxed); }

bool kjs_guard_should_interrupt(kjs_execution_guard_t *guard)
{
    uint64_t count = atomic_fetch_add_explicit(&guard->interrupts, 1U, memory_order_relaxed) + 1U;
    if (guard->limits.interrupt_budget > 0U && count > guard->limits.interrupt_budget)
    {
        atomic_store_explicit(&guard->limit_exceeded, true, memory_order_relaxed);
        return true;
    }
    if (atomic_load_explicit(&guard->execution_active, memory_order_acquire) &&
        monotonic_milliseconds() >= atomic_load_explicit(&guard->deadline_milliseconds, memory_order_relaxed))
    {
        atomic_store_explicit(&guard->limit_exceeded, true, memory_order_relaxed);
        return true;
    }
    if (guard->should_interrupt != NULL && guard->should_interrupt(guard->interrupt_userdata))
    {
        atomic_store_explicit(&guard->limit_exceeded, true, memory_order_relaxed);
        return true;
    }
    return false;
}

void kjs_execution_begin(kjs_runtime_t *runtime)
{
    if (runtime == NULL) return;
    kjs_guard_begin(&runtime->guard);
}

void kjs_execution_end(kjs_runtime_t *runtime)
{
    if (runtime == NULL) return;
    kjs_guard_end(&runtime->guard);
}

bool kjs_execution_exceeded(const kjs_runtime_t *runtime)
{ return runtime != NULL && kjs_guard_exceeded(&runtime->guard); }

int kjs_interrupt_handler(JSRuntime *runtime, void *opaque)
{
    (void)runtime;
    return kjs_guard_should_interrupt(opaque) ? 1 : 0;
}

kjs_status_t kjs_runtime_create(const kjs_limits_t *limits, const kjs_host_t *host, kjs_runtime_t **runtime,
                                kjs_diagnostic_t **diagnostic)
{
    if (runtime == NULL || limits == NULL || host == NULL || limits->memory_limit_bytes == 0U ||
        limits->stack_limit_bytes == 0U || limits->interrupt_budget == 0U || limits->timeout_milliseconds == 0U ||
        host->load_module == NULL || host->read_json == NULL || host->write_json == NULL || host->create_json == NULL ||
        host->remove_json == NULL || host->move_json == NULL)
    {
        return KJS_STATUS_INVALID_ARGUMENT;
    }
    *runtime = NULL;
    kjs_runtime_t *owner = calloc(1U, sizeof(*owner));
    if (owner == NULL) { return KJS_STATUS_INTERNAL_FAILURE; }
    owner->host = *host;
    kjs_guard_init(&owner->guard, limits);
    owner->guard.should_interrupt = host->should_interrupt;
    owner->guard.interrupt_userdata = host->userdata;
    atomic_init(&owner->context_sequence, 0U);
    owner->runtime = JS_NewRuntime();
    if (owner->runtime == NULL)
    {
        free(owner);
        if (diagnostic != NULL)
        {
            *diagnostic =
                kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, "runtime_create", "cannot create QuickJS runtime");
        }
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    JS_SetMemoryLimit(owner->runtime, limits->memory_limit_bytes);
    JS_SetMaxStackSize(owner->runtime, limits->stack_limit_bytes);
    JS_SetInterruptHandler(owner->runtime, kjs_interrupt_handler, &owner->guard);
    JS_NewClassID(owner->runtime, &owner->input_error_class);
    if (owner->input_error_class == JS_INVALID_CLASS_ID ||
        JS_NewClass(owner->runtime, owner->input_error_class, &input_error_class) < 0)
    {
        JS_FreeRuntime(owner->runtime);
        owner->runtime = NULL;
        free(owner);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, "runtime_create",
                                                "cannot register InputObjectInvalidError");
        }
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    owner->preview_context = JS_NewContext(owner->runtime);
    if (owner->preview_context == NULL)
    {
        JS_FreeRuntime(owner->runtime);
        owner->runtime = NULL;
        free(owner);
        if (diagnostic != NULL)
        {
            *diagnostic = kjs_diagnostic_create(KJS_STATUS_INTERNAL_FAILURE, "runtime_create",
                                                "cannot create value preview context");
        }
        return KJS_STATUS_INTERNAL_FAILURE;
    }
    JSValue plain_object = JS_NewObject(owner->preview_context);
    JSValue array = JS_NewArray(owner->preview_context);
    owner->plain_object_class = JS_GetClassID(plain_object);
    owner->array_class = JS_GetClassID(array);
    JS_FreeValue(owner->preview_context, array);
    JS_FreeValue(owner->preview_context, plain_object);
    JS_SetModuleLoaderFunc(owner->runtime, kjs_normalize_module, kjs_load_module, owner);
    *runtime = owner;
    return KJS_STATUS_OK;
}

void kjs_runtime_destroy(kjs_runtime_t **runtime_pointer)
{
    if (runtime_pointer == NULL || *runtime_pointer == NULL) { return; }
    kjs_runtime_t *runtime = *runtime_pointer;
    *runtime_pointer = NULL;
    if (runtime->preview_context != NULL)
    {
        JS_FreeContext(runtime->preview_context);
        runtime->preview_context = NULL;
    }
    if (runtime->runtime != NULL)
    {
        JS_FreeRuntime(runtime->runtime);
        runtime->runtime = NULL;
    }
    free(runtime);
}
