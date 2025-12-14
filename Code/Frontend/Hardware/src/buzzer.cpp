#include <Arduino.h>
#include "buzzer.h"

void initBuzzer()
{
    pinMode(BUZZER, OUTPUT);
}

void happySound()
{
    tone(BUZZER, 1000, 800);
    tone(BUZZER, 1500, 200);
}