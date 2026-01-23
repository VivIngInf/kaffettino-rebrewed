#include "nfcReader.h"

MFRC522 nfcScanner(SDA_PIN, RST_PIN);

unsigned long lastScanTime = 0; // Last time the sensor was polled

bool initNFCScanner()
{
    SPI.begin();    

    // Init the NFC reader
    nfcScanner.PCD_Init();
    
    
    byte version = nfcScanner.PCD_ReadRegister(MFRC522::VersionReg);

    if(version == 0x00 || version == 0xFF)
    {
        Serial.println("[NFC] Reader not detected");        
        return false;
    }

    Serial.printf("[NFC] Reader OK (0x%02X)\n", version);
    return true;

}

void handleScanner(unsigned long now)
{    
    // Verify if enough time has passed 
    if (now - lastScanTime >= NFCScanInterval) 
    {
        lastScanTime = now;

        // Check if there's a new card
        if (!nfcScanner.PICC_IsNewCardPresent()) 
            return;

        // If the card is present, read the UID
        if (!nfcScanner.PICC_ReadCardSerial()) 
        {
            Serial.println("Failed to read card serial.");
            return;
        }

        Serial.print("Card UID: ");
        dump_byte_array(nfcScanner.uid.uidByte, nfcScanner.uid.size);
        Serial.println();

        // Terminate reading the card
        nfcScanner.PICC_HaltA();  
    }    
}

// Utility function to print the card's bytes in hex format
void dump_byte_array(byte *buffer, byte bufferSize) 
{
  for (byte i = 0; i < bufferSize; i++) 
  {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], HEX);
  }
}

