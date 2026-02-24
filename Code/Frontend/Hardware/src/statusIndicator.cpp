#include "statusIndicator.h"
#include "Arduino.h"

LED_STATUS currentLEDStatus = LED_OFF;

bool isBlinking = false;
bool ledState = false;
long unsigned lastBlink = 0;

void initLEDs()
{
    pinMode(GREEN_LED, OUTPUT);
    pinMode(YELLOW_LED, OUTPUT);
    pinMode(RED_LED, OUTPUT);

    changeLEDStatus(LED_OFF);
}

void startBlinking()
{
    isBlinking = true;
}

void stopBlinking()
{
    isBlinking = false;
    changeLEDStatus(currentLEDStatus);
}

void changeLEDStatus(LED_STATUS status)
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

    currentLEDStatus = status;

}

void handleBlink(unsigned long now)
{
    if(currentLEDStatus == LED_OFF)
    {
        ledState = false;
        digitalWrite(currentLEDStatus, ledState);
        return;
    }

    if(!isBlinking)
    {
        ledState = true;
        digitalWrite(currentLEDStatus, ledState);

        return;
    } 
        
    if (now - lastBlink >= blinkDelay && currentLEDStatus == LED_WAIT)
    {
        ledState = !ledState;

        digitalWrite(currentLEDStatus, ledState ? HIGH : LOW);

        lastBlink = now;
    }

}