#include <Arduino.h>
#include "buzzer.h"

bool isBuzzerActivated = true;

void initBuzzer(bool buzzerActivated)
{
    isBuzzerActivated = buzzerActivated;

    if(!isBuzzerActivated)
        return;

    pinMode(BUZZER, OUTPUT);
    tone(BUZZER, BUZZER_FREQ_MID, BUZZER_DUR_LONG);
}

void bootSound()
{
    if(!isBuzzerActivated)
        return;
    
    tone(BUZZER, BUZZER_FREQ_MID, BUZZER_DUR_LONG);
    tone(BUZZER, BUZZER_FREQ_HI,  BUZZER_DUR_SHORT);
}

void connectedSound()
{
    if(!isBuzzerActivated)
        return;

    tone(BUZZER, BUZZER_FREQ_HI,  BUZZER_DUR_LONG);
    tone(BUZZER, BUZZER_FREQ_MAX, BUZZER_DUR_SHORT);
}

void disconnectedSound()
{
    if(!isBuzzerActivated)
        return;
        
    tone(BUZZER, BUZZER_FREQ_HI,  BUZZER_DUR_LONG);
    tone(BUZZER, BUZZER_FREQ_MID, BUZZER_DUR_SHORT);
}

void errorSound()
{
    if(!isBuzzerActivated)
        return;
        
    tone(BUZZER, BUZZER_FREQ_HI,  BUZZER_DUR_LONG);
    tone(BUZZER, BUZZER_FREQ_LO, BUZZER_DUR_SHORT);
    tone(BUZZER, BUZZER_FREQ_LO, BUZZER_DUR_LONG);
}

void deathSound()
{
    if(!isBuzzerActivated)
        return;
        
    tone(BUZZER, BUZZER_FREQ_MID,    BUZZER_DUR_LONG);
    tone(BUZZER, BUZZER_FREQ_MID_LO, BUZZER_DUR_LONG);
    tone(BUZZER, BUZZER_FREQ_LO,     BUZZER_DUR_LONG);
}