#ifndef NFCREADER_H
#define NFCREADER_H

#include <MFRC522.h>

extern MFRC522 nfcScanner;

const int SDA_PIN = 5;
const int SCK_PIN = 18;
const int MOSI_PIN = 23;
const int MISO_PIN = 19;
const int RST_PIN = 14;

// const int IRQ_PIN = 39;  The RFID-RC522 module doesn't support interrupts to see when cards are hovering, so it is not useful for the project

extern bool initNFCScanner();
extern void handleScanner(unsigned long now);
extern void dump_byte_array(byte *buffer, byte bufferSize);

const unsigned long NFCScanInterval = 200;   // scan delay
extern unsigned long lastScanTime;

#endif