#include "utility.h"

bool probeI2C(uint8_t address, uint8_t retries, uint32_t timeoutMs)
{
    for(uint8_t i = 0; i < retries; i++)
    {
        Wire.beginTransmission(address);
        uint8_t err = Wire.endTransmission();

        if(err == 0)
            return true;

        delay(timeoutMs);
    }

    return false;
}

void scanI2CBus()
{ 
    Serial.println("\n[I2C] Scanning bus...");
    uint8_t count = 0;

    for(uint8_t addr = 1; addr < 127; addr++)
    {
        Wire.beginTransmission(addr);
        if(Wire.endTransmission() == 0)
        {
            Serial.printf("[I2C] Device found at 0x%02X\n", addr);
            count++;
        }
    }

    if(count == 0)
        Serial.println("[I2C] No devices found");
    else
        Serial.printf("[I2C] %d device(s) found\n", count);
}

bool probeSPI(spiProbeFn_t testFn, uint8_t retries)
{
    if(!testFn)
        return false;

    for(uint8_t i = 0; i < retries; i++)
        if(testFn())
            return true;

    return false;
}
