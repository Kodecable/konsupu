#ifndef KJS_RUNTIME_H
#define KJS_RUNTIME_H

#include "konsupujs.h"
#include <quickjs.h>
#include <stdatomic.h>

// Bounds one synchronous JavaScript execution. The interrupt handler reads this
// state, so a guard must stay alive for as long as its runtime runs JavaScript.
typedef struct kjs_execution_guard
{
    kjs_limits_t limits;
    // Optional external cancellation request. The formatter installs none.
    kjs_should_interrupt_fn should_interrupt;
    uintptr_t interrupt_userdata;
    atomic_uint_fast64_t interrupts;
    atomic_uint_fast64_t deadline_milliseconds;
    atomic_bool execution_active;
    atomic_bool limit_exceeded;
} kjs_execution_guard_t;

struct kjs_runtime
{
    JSRuntime *runtime;
    JSContext *preview_context;
    kjs_execution_guard_t guard;
    kjs_host_t host;
    JSClassID input_error_class;
    JSClassID plain_object_class;
    JSClassID array_class;
    atomic_uint_fast64_t context_sequence;
};

void kjs_guard_init(kjs_execution_guard_t *guard, const kjs_limits_t *limits);
void kjs_guard_begin(kjs_execution_guard_t *guard);
void kjs_guard_end(kjs_execution_guard_t *guard);
bool kjs_guard_exceeded(const kjs_execution_guard_t *guard);

// Reports whether an in-flight execution must be interrupted, setting the
// exceeded flag before it returns true.
bool kjs_guard_should_interrupt(kjs_execution_guard_t *guard);

int kjs_interrupt_handler(JSRuntime *runtime, void *opaque);
void kjs_execution_begin(kjs_runtime_t *runtime);
void kjs_execution_end(kjs_runtime_t *runtime);
bool kjs_execution_exceeded(const kjs_runtime_t *runtime);

#endif
