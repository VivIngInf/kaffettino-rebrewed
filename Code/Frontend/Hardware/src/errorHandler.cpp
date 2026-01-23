#include "display.h"
#include "errorHandler.h"
#include "buzzer.h"

// 8 bit array for memorizing error flags
uint8_t errorFlags = 0;

void setError(ERROR_LABELS error)
{
    errorFlags |= error;
}

void removeError(ERROR_LABELS error)
{
    errorFlags &= ~error;
}

bool hasError(ERROR_LABELS error)
{
    return (errorFlags & error) != 0;
}

bool hasAnyError()
{
    return errorFlags != 0;   
}

void printErrors()
{
    if (errorFlags == 0) 
    {
        Serial.println("No errors");
        return;
    }

    Serial.print("Error flags: 0x");
    Serial.println(errorFlags, HEX);

    Serial.println("Errors detected:");

    if (errorFlags & ERR_SERIAL)
        Serial.println("\t- Serial error");

    if (errorFlags & ERR_MEMORY)
        Serial.println("\t- Memory error");

    if (errorFlags & ERR_MP3)
        Serial.println("\t- MP3 error");

    if (errorFlags & ERR_KEYPAD)
        Serial.println("\t- Keypad error");

    if (errorFlags & ERR_DISPLAY)
        Serial.println("\t- Display error");

    if (errorFlags & ERR_NFC)
        Serial.println("\t- NFC error");
}

void handleErrors()
{
    if(!hasAnyError())
        return;

    deathSound();

    printErrors();
    displayCriticalError();

    delay(10000);

    ESP.restart();
}