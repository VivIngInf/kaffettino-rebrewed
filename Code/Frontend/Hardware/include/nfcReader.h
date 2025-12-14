#ifndef NFCREADER_H
#define NFCREADER_H

#include <MFRC522.h>

extern MFRC522 nfcScanner;

const int SDA_PIN = 5;
const int SCK_PIN = 18;
const int MOSI_PIN = 23;
const int MISO_PIN = 19;
const int IRQ_PIN = 36;     // Interrupt Pin, must be connected to external PULLUP (3.3 V) resistor, since pin 36 doesn't have an internal resistor
const int RST_PIN = 14;

extern void initNFCScanner();
extern void handleScanner();
extern void clearInt();
extern void activateRec();
extern void readCard();
extern void dump_byte_array(byte *buffer, byte bufferSize);


#endif