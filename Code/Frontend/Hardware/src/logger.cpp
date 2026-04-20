#include "logger.h"
#include <stdarg.h>

bool colorsEnabled    = true;
bool timestampEnabled = true;
bool debugMode        = false; // Enabled by logInit only in DEBUG_BUILD

void logInit(bool enableColors, bool enableTimestamp, bool enableDebugMode)
{
    colorsEnabled = enableColors;
    timestampEnabled = enableTimestamp;
    debugMode = enableDebugMode;
}

void logPrint(LogLevel level, LogCategory category, const char *fmt, ...)
{
    if(level == LOG_DEBUG && debugMode == false)
        return;

    char msg[128];

    va_list args;
    va_start(args, fmt);
    vsnprintf(msg, sizeof(msg), fmt, args);
    va_end(args);

    if(colorsEnabled)
        Serial.print(levelColor[level]);

    Serial.printf("[%s][%s]", levelStr[level], categoryStr[category]);

    if(timestampEnabled)
        Serial.printf("[%lu]", millis());

    Serial.print(" ");
    Serial.print(msg);

    if(colorsEnabled)
        Serial.print("\033[0m");

    Serial.println();
}
