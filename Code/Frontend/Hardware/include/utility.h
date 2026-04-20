#pragma once

#include "stdint.h"
#include "Wire.h"
#include "Arduino.h"

// I2C Utils

extern bool probeI2C(uint8_t address, uint8_t retries = 3, uint32_t delayMs = 10);
extern void scanI2CBus();

// SPI Utils

typedef bool (*spiProbeFn_t)();
bool probeSPI(spiProbeFn_t testFn, uint8_t retries = 3);
