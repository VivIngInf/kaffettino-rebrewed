#ifndef ERRORHANDLER_H
#define ERRORHANDLER_H

#include <stdint.h>

// 8 bit array for memorizing error flags
extern uint8_t errorFlags;

// Define the bitmask bit meaning, got room for other 2 errors if needed.
// Eventually, if the bits run out, change type of errorFlags to uint16_t
// For example, something like 00001010 means MP3 and memory error
enum ERROR_LABELS {
    ERR_SERIAL = 1 << 0,    // Translates to 00000001
    ERR_MEMORY = 1 << 1,    // Translates to 00000010
    ERR_MP3 = 1 << 2,       // Translates to 00000100
    ERR_KEYPAD = 1 << 3,    // Translates to 00001000
    ERR_DISPLAY = 1 << 4,   // Translates to 00010000
    ERR_NFC = 1 << 5,       // Translates to 00100000
};

extern void setError(ERROR_LABELS error);
extern void removeError(ERROR_LABELS error);

bool hasError(ERROR_LABELS error);
bool hasAnyError();

extern void printErrors();
extern void handleErrors();

#endif