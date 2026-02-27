#ifndef BUZZER_H
#define BUZZER_H

const int BUZZER = 33;

extern void initBuzzer();
extern void happySound();
extern void bootSound();
extern void connectedSound();
extern void disconnectedSound();
extern void deathSound();

#endif