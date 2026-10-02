#ifndef KJS_DIAGNOSTIC_H
#define KJS_DIAGNOSTIC_H

#include "konsupujs.h"

struct kjs_diagnostic
{
    kjs_status_t status;
    char *code;
    char *message;
    char *exception_type;
    char *stack;
};

char *kjs_copy_string(const char *value);
bool kjs_valid_utf8(const unsigned char *value, size_t length);
void kjs_set_exception_details(kjs_diagnostic_t *diagnostic, const char *exception_type, const char *stack);

#endif
