#ifndef MP3PLAYER_H
#define MP3PLAYER_H

#include <DFRobotDFPlayerMini.h>
#include <SoftwareSerial.h>

const int MP3_RX = 17;
const int MP3_TX = 16;

extern HardwareSerial mp3HwSerial;
extern DFRobotDFPlayerMini mp3Player;

extern void mp3PlayerInit();

#endif