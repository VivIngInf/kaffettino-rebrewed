#include "statusIndicator.h"
#include "Arduino.h"

LED_STATUS currentStatus = LED_OFF;

bool isBlinking = false;
bool ledState = false;
long unsigned lastBlink = 0;

void initLEDs()
{
    pinMode(GREEN_LED, OUTPUT);
    pinMode(YELLOW_LED, OUTPUT);
    pinMode(RED_LED, OUTPUT);

    changeStatus(LED_OFF);
}

void startBlinking()
{
    isBlinking = true;
}

void stopBlinking()
{
    isBlinking = false;
    changeStatus(currentStatus);
}

void changeStatus(LED_STATUS status)
{

    switch (status)
    {
        case LED_IDLE:
            digitalWrite(GREEN_LED, true);
            digitalWrite(YELLOW_LED, false);
            digitalWrite(RED_LED, false);
            break;
    
        case LED_WAIT:
            digitalWrite(GREEN_LED, false);
            digitalWrite(YELLOW_LED, true);
            digitalWrite(RED_LED, false);
            break;

        case LED_ERROR:
            digitalWrite(GREEN_LED, false);
            digitalWrite(YELLOW_LED, false);
            digitalWrite(RED_LED, true);
            break;

        case LED_OFF:    
            digitalWrite(GREEN_LED, false);
            digitalWrite(YELLOW_LED, false);
            digitalWrite(RED_LED, false);
            break;

        default:
            break;
    }

    currentStatus = status;

}

void handleBlink(unsigned long now)
{
    if(!isBlinking || currentStatus == LED_OFF)
        return;

    if (now - lastBlink >= blinkDelay)
    {
        ledState = !ledState;

        digitalWrite(currentStatus, ledState ? HIGH : LOW);

        lastBlink = now;
    }

}