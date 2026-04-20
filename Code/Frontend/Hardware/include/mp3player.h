#pragma once

#include <DFRobotDFPlayerMini.h>
#include <SoftwareSerial.h>

const int MP3_RX = 17;
const int MP3_TX = 16;

extern HardwareSerial mp3HwSerial;
extern DFRobotDFPlayerMini mp3Player;

extern bool initMP3Player();