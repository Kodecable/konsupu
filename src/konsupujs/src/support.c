#include "diagnostic.h"

#include <stdlib.h>
#include <string.h>

bool kjs_valid_utf8(const unsigned char *value, size_t length)
{
    if (value == NULL) return length == 0U;
    size_t index = 0U;
    while (index < length)
    {
        unsigned char first = value[index++];
        if (first <= 0x7fU) continue;
        size_t continuation;
        uint32_t codepoint;
        uint32_t minimum;
        if (first >= 0xc2U && first <= 0xdfU)
        {
            continuation = 1U;
            codepoint = first & 0x1fU;
            minimum = 0x80U;
        }
        else if (first >= 0xe0U && first <= 0xefU)
        {
            continuation = 2U;
            codepoint = first & 0x0fU;
            minimum = 0x800U;
        }
        else if (first >= 0xf0U && first <= 0xf4U)
        {
            continuation = 3U;
            codepoint = first & 0x07U;
            minimum = 0x10000U;
        }
        else
        {
            return false;
        }
        if (continuation > length - index) return false;
        for (size_t offset = 0U; offset < continuation; offset++)
        {
            unsigned char byte = value[index++];
            if ((byte & 0xc0U) != 0x80U) return false;
            codepoint = (codepoint << 6U) | (byte & 0x3fU);
        }
        if (codepoint < minimum || codepoint > 0x10ffffU || (codepoint >= 0xd800U && codepoint <= 0xdfffU))
        {
            return false;
        }
    }
    return true;
}

char *kjs_copy_string(const char *value)
{
    if (value == NULL) { return NULL; }
    size_t length = strlen(value);
    if (length == SIZE_MAX) { return NULL; }
    char *copy = malloc(length + 1U);
    if (copy == NULL) { return NULL; }
    memcpy(copy, value, length + 1U);
    return copy;
}

void kjs_buffer_free(void *buffer) { free(buffer); }
