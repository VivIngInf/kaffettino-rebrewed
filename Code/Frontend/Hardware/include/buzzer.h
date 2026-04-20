#pragma once

const int BUZZER = 33;

// Frequencies (Hz)
const unsigned int BUZZER_FREQ_LO     = 3500;
const unsigned int BUZZER_FREQ_MID_LO = 3700;
const unsigned int BUZZER_FREQ_MID    = 4000;
const unsigned int BUZZER_FREQ_HI     = 4500;
const unsigned int BUZZER_FREQ_MAX    = 5000;

// Durations (ms)
const unsigned int BUZZER_DUR_SHORT = 300;
const unsigned int BUZZER_DUR_LONG  = 500;

extern bool isBuzzerActivated;

extern void initBuzzer(bool isBuzzerActivated);
extern void happySound();
extern void bootSound();
extern void connectedSound();
extern void disconnectedSound();
extern void deathSound();
extern void errorSound();