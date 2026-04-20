#pragma once

const int GREEN_LED = 25;
const int YELLOW_LED = 26;
const int RED_LED = 27;

const int blinkDelay = 1000;

enum LED_STATUS
{
    LED_IDLE = GREEN_LED,
    LED_WAIT = YELLOW_LED,
    LED_ERROR = RED_LED,
    LED_OFF = 0 // Only for init
};

extern LED_STATUS currentLEDStatus;

extern bool isBlinking;
extern bool ledState;
extern long unsigned lastBlink;

extern void initLEDs();

extern void startBlinking();
extern void stopBlinking();

extern void changeLEDStatus(LED_STATUS status);

extern void handleBlink(unsigned long now);