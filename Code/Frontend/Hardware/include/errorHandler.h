#pragma once

#include <stdint.h>

const unsigned long ERROR_RESTART_DELAY_MS  = 10000;
const unsigned long WARNING_DISPLAY_DELAY_MS = 10000;

// 8 bit array for memorizing error and flags
extern uint8_t errorFlags;      // If even a single bit is set, the ESP will try to restart after displaying the error screen
extern uint8_t warningFlags;    // If only warning bits are set, the ESP will continue the normal operations after displaying the error screen

// Define the bitmask bit meaning, got room for other 2 errors if needed.
// Eventually, if the bits run out, change type of errorFlags to uint16_t
// For example, something like 00001010 means MP3 and memory error
enum ERROR_LABELS {
    ERR_SERIAL = 1 << 0,    // Translates to 00000001
    ERR_MEMORY = 1 << 1,    // Translates to 00000010
    ERR_NETWORK = 1 << 2,   // Translates to 00000100
    ERR_KEYPAD = 1 << 3,    // Translates to 00001000
    ERR_DISPLAY = 1 << 4,   // Translates to 00010000
    ERR_NFC = 1 << 5,       // Translates to 00100000    
};

enum WARNING_LABELS {
    WARN_MP3 = 1 << 0
};

// Errors

extern void setError(ERROR_LABELS error);
extern void removeError(ERROR_LABELS error);

extern void setWarning(WARNING_LABELS warning);
extern void removeWarning(WARNING_LABELS warning);

extern bool hasError(ERROR_LABELS error);
extern bool hasAnyError();

extern bool hasWarning(WARNING_LABELS warning);
extern bool hasAnyWarning();

extern void printErrors();
extern void handleErrors();