#include "nfcReader.h"

MFRC522 nfcScanner(SDA_PIN, RST_PIN);

bool newInterrupt = false; 

void initNFCScanner()
{
    SPI.begin();
    nfcScanner.PCD_Init();
    nfcScanner.PCD_DumpVersionToSerial();
    pinMode(IRQ_PIN, INPUT); // Set this to PULLUP if using a pin with an internal resistor

    nfcScanner.PCD_WriteRegister(nfcScanner.ComIEnReg, 0xA0);
    attachInterrupt(digitalPinToInterrupt(IRQ_PIN), readCard, FALLING);  // Triggers when IRQ goes LOW
}

void handleScanner()
{

    if(newInterrupt)
    {
        if(!nfcScanner.PICC_IsNewCardPresent())
            return;

        if(!nfcScanner.PICC_ReadCardSerial())
            return;

        Serial.print("SCANNER! DigitalValue: ");
        Serial.println(digitalRead(IRQ_PIN));


        Serial.print(F("Card UID:"));
        dump_byte_array(nfcScanner.uid.uidByte, nfcScanner.uid.size);
        Serial.println();

        clearInt();
        nfcScanner.PICC_HaltA();
        newInterrupt = false;
    }

    activateRec();
    delay(100);
}

/**
 * Helper routine to dump a byte array as hex values to Serial.
 */
void dump_byte_array(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], HEX);
  }
}

/**
 * MFRC522 interrupt serving routine
 */
void readCard() {
    newInterrupt = true;
}

/*
 * The function sending to the MFRC522 the needed commands to activate the reception
 */
void activateRec() {
    nfcScanner.PCD_WriteRegister(nfcScanner.FIFODataReg, nfcScanner.PICC_CMD_REQA);
    nfcScanner.PCD_WriteRegister(nfcScanner.CommandReg, nfcScanner.PCD_Transceive);
    nfcScanner.PCD_WriteRegister(nfcScanner.BitFramingReg, 0x87);
}

/*
 * The function to clear the pending interrupt bits after interrupt serving routine
 */
void clearInt() {
    nfcScanner.PCD_WriteRegister(nfcScanner.ComIrqReg, 0x7F);
}