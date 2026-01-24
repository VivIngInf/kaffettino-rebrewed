#pragma once
#include <Arduino.h>

enum LogLevel {
    LOG_DEBUG,
    LOG_INFO,
    LOG_WARN,
    LOG_ERROR
};

enum LogCategory {
    CAT_SYS,
    CAT_I2C,
    CAT_SPI,
    CAT_WIFI,
    CAT_NFC,
    CAT_MP3,
    CAT_DISPLAY,
    CAT_KEYPAD,
    CAT_APP
};

static const char *levelStr[] = {
    "DEBUG", "INFO", "WARN", "ERROR"
};

static const char *categoryStr[] = {
    "SYS",
    "I2C",
    "SPI",
    "WIFI",
    "NFC",
    "MP3",
    "DISPLAY",
    "KEYPAD",
    "APP"
};

// The colors are encoded as ANSI color codes https://gist.github.com/JBlond/2fea43a3049b38287e5e9cefc87b2124
static const char *levelColor[] = {
    "\033[0;36m", // DEBUG
    "\033[0;32m", // INFO
    "\033[1;33m", // WARN
    "\033[1;31m"  // ERROR
};

extern bool debugMode; // Debug mode is used to see more info in the serial monitor

void logInit(bool enableColors = true, bool enableTimestamp = true, bool enableDebugMode = true);
void logPrint(LogLevel level, LogCategory category, const char *fmt, ...);

#define LOGD(cat, ...) logPrint(LOG_DEBUG, cat, __VA_ARGS__)
#define LOGI(cat, ...) logPrint(LOG_INFO,  cat, __VA_ARGS__)
#define LOGW(cat, ...) logPrint(LOG_WARN,  cat, __VA_ARGS__)
#define LOGE(cat, ...) logPrint(LOG_ERROR, cat, __VA_ARGS__)
