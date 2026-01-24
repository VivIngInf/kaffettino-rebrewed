#include "nfcReader.h"
#include "logger.h"

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
        logPrint(LOG_ERROR, CAT_NFC, "The connection to the NFC Reader failed!");
        return false;
    }

    logPrint(LOG_INFO, CAT_NFC, "The connection to the NFC Reader was successfull! Version in use: 0x%02X", version);

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
            logPrint(LOG_WARN, CAT_NFC, "Failed to read card serial!");
            return;
        }
                     
        dump_byte_array(nfcScanner.uid.uidByte, nfcScanner.uid.size);        

        // Terminate reading the card
        nfcScanner.PICC_HaltA();  
    }    
}

// Utility function to print the card's bytes in hex format
void dump_byte_array(byte *buffer, byte bufferSize) 
{
    char str[64];
    char *ptr = str;

    for (byte i = 0; i < bufferSize; i++)
    {
        ptr += sprintf(ptr, "%02X ", buffer[i]);
    }

    // Termina la stringa
    *ptr = '\0';

    logPrint(LOG_DEBUG, CAT_NFC, "Card UID: %s", str);
}

