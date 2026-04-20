#pragma once

#include <Wire.h>
#include <I2CKeyPad.h>
#include "keyEvents.h"

// ─── Pin & I2C ───────────────────────────────────────────────────
const int     IRQ_KEYPAD        = 36;
const uint8_t KEYPAD_ADDRESS    = 0x20;

// ─── Timing ──────────────────────────────────────────────────────
const unsigned long DEBOUNCE_DELAY_KEYPAD  = 100;   // ISR-level debounce (ms)
const unsigned long HOLD_THRESHOLD_MS      = 800;  // Time before KEY_HELD fires (ms)
const unsigned long RELEASE_TIMEOUT_MS     = 5000; // Safety timeout if release is missed (ms)
const uint8_t       KEYPAD_LIB_DEBOUNCE_MS = 50;   // Library-level debounce passed to I2CKeyPad

// ─── Shared state ────────────────────────────────────────────────
extern volatile bool  keypadInterrupt;
extern unsigned long  lastInterruptTimeKeypad;

// ─── API ─────────────────────────────────────────────────────────
bool initKeypad();
void IRAM_ATTR readKeypad();
void handleKeypad();
void measurePolling();