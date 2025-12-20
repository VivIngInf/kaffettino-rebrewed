#ifndef KEYPAD_H
#define KEYPAD_H

#include <Wire.h>
//#include <PCF8574.h>
#include <I2CKeyPad.h>

//extern PCF8574 gpioExtender;
const int IRQ_KEYPAD = 36;

extern void initKeypad();
extern void readKeypad();
extern void handleKeypad();
extern void measurePolling();

extern volatile bool keypadInterrupt; 

extern unsigned long lastInterruptTimeKeypad;      // Timestamp for debounce mechanism
const unsigned long debounceDelayKeypad = 20;    // 200ms debounce delay

#endif