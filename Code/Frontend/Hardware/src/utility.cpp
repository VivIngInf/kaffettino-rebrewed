#include "utility.h"
#include "logger.h"

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
    logPrint(LOG_DEBUG, CAT_I2C, "Scanning I2C bus...");

    uint8_t count = 0;

    for(uint8_t addr = 1; addr < 127; addr++)
    {
        Wire.beginTransmission(addr);
        if(Wire.endTransmission() == 0)
        {
            logPrint(LOG_DEBUG, CAT_I2C, "Device found at 0x%02X", addr);            
            count++;
        }
    }

    if(count == 0)
        logPrint(LOG_ERROR, CAT_I2C, "No I2C device was found!");
    else
        logPrint(LOG_DEBUG, CAT_I2C, "%d I2C device(s) found...", count);        
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
