#include "display.h"
#include "errorHandler.h"
#include "buzzer.h"

// 8 bit array for memorizing error flags
uint8_t errorFlags = 0; 
uint8_t warningFlags = 0;

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

void setWarning(WARNING_LABELS warning)
{
    warningFlags |= warning;
}

void removeWarning(WARNING_LABELS warning)
{
    warningFlags &= ~warning;
}

bool hasWarning(WARNING_LABELS warning)
{
    return (warningFlags & warning) != 0;
}

bool hasAnyWarning()
{
    return warningFlags != 0;   
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

    if (errorFlags & ERR_KEYPAD)
        Serial.println("\t- Keypad error");

    if (errorFlags & ERR_DISPLAY)
        Serial.println("\t- Display error");

    if (errorFlags & ERR_NFC)
        Serial.println("\t- NFC error");

    if (errorFlags & ERR_NETWORK)
        Serial.println("\t- Network error");
        
}

void printWarnings()
{
    if(warningFlags == 0)
    {
        Serial.println("No warnings");
        return;
    }

    Serial.println("Warnings detected:");

    if (warningFlags & WARN_MP3)
        Serial.println("\t- MP3 error");
}

void handleErrors()
{
    if(!hasAnyError() && !hasAnyWarning())
        return;

    deathSound();

    printErrors();
    printWarnings();

    displayErrorsAndWarning();

    delay(10000);

    if(hasAnyError())
        ESP.restart();
}