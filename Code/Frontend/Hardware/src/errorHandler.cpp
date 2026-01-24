#include "display.h"
#include "errorHandler.h"
#include "buzzer.h"
#include "logger.h"

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
        logPrint(LOG_INFO, CAT_SYS, "No errors at boot.");
        return;
    }

    logPrint(LOG_ERROR, CAT_SYS, "Errors detected.");
    logPrint(LOG_ERROR, CAT_SYS, "Error flags: 0x%02X", errorFlags);

    if (errorFlags & ERR_SERIAL)
        logPrint(LOG_ERROR, CAT_SYS, "\t- Serial error");

    if (errorFlags & ERR_MEMORY)
        logPrint(LOG_ERROR, CAT_SYS, "\t- Memory error");

    if (errorFlags & ERR_KEYPAD)
        logPrint(LOG_ERROR, CAT_KEYPAD, "\t- Keypad error");

    if (errorFlags & ERR_DISPLAY)
        logPrint(LOG_ERROR, CAT_DISPLAY, "\t- Display error");

    if (errorFlags & ERR_NFC)
        logPrint(LOG_ERROR, CAT_NFC, "\t- NFC error");

    if (errorFlags & ERR_NETWORK)
        logPrint(LOG_ERROR, CAT_WIFI, "\t- Network error");
        
}

void printWarnings()
{
    if(warningFlags == 0)
    {
        logPrint(LOG_INFO, CAT_WIFI, "No warnings at boot.");
        return;
    }

    logPrint(LOG_WARN, CAT_SYS, "Warnings detected.");
    logPrint(LOG_WARN, CAT_SYS, "Warning flags: 0x%02X", warningFlags);

    if (warningFlags & WARN_MP3)
        logPrint(LOG_WARN, CAT_MP3, "\t- Mp3 warning");
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