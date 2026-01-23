#include <Arduino.h>
#include "buzzer.h"

void initBuzzer()
{
    pinMode(BUZZER, OUTPUT);
    tone(BUZZER, 1000, 500);
}

void bootSound()
{
    tone(BUZZER, 1000, 500);
    tone(BUZZER, 1500, 300);
}

void connectedSound()
{
    tone(BUZZER, 1500, 500);
    tone(BUZZER, 2000, 300);
}

void disconnectedSound()
{
    tone(BUZZER, 1500, 500);
    tone(BUZZER, 1000, 300);
}