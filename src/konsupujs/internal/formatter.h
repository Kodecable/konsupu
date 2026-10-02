#ifndef KJS_FORMATTER_H
#define KJS_FORMATTER_H

#include "runtime.h"

// A formatter owns an isolated QuickJS runtime. It never shares a runtime with
// cognition execution, so it may drain its own job queue to await the
// formatter bundle's asynchronous result.
//
// The bundle text is retained so a runtime can be discarded and rebuilt: an
// execution limit can interrupt a job, leaving the queue with jobs that must
// not run under the expired limit, and the only way to drop those jobs is to
// drop the runtime that owns them.
struct kjs_formatter
{
    JSRuntime *runtime;
    JSContext *context;
    JSValue format;
    kjs_execution_guard_t guard;
    char *bundle;
    size_t bundle_length;
};

#endif
