#include "keypad.h"
#include "logger.h"

volatile bool keypadInterrupt = false; 

unsigned long lastInterruptTimeKeypad = 0;     

const uint8_t KEYPAD_ADDRESS = 0x20;
I2CKeyPad keyPad(KEYPAD_ADDRESS);
char keys[] = "123A456B789C*0#DNF";  //  N = NoKey, F = Fail (e.g. > 1 keys pressed)

bool initKeypad()
{
    pinMode(IRQ_KEYPAD, INPUT); // Set this to PULLUP if using a pin with an internal resistor
       
    attachInterrupt(digitalPinToInterrupt(IRQ_KEYPAD), readKeypad, FALLING);  // Triggers when IRQ goes LOW

    keypadInterrupt = false;

    if(!keyPad.begin())
    {
        logPrint(LOG_ERROR, CAT_KEYPAD, "Cannot comunicate to keypad!");
        return false;        
    }

    keyPad.setDebounceThreshold(50);
    measurePolling();

    return true;
}

// IRAM_ATTR forces the code to be run in RAM and not flash memory
void IRAM_ATTR readKeypad() 
{
    // Check the time since the last interrupt to debounce
    unsigned long currentMillis = millis();

    if (currentMillis - lastInterruptTimeKeypad > debounceDelayKeypad) 
    {       
        keypadInterrupt = true;  // Set the interrupt flag to true   
        lastInterruptTimeKeypad = currentMillis;  // Update the last interrupt time
    }        
}

void handleKeypad()
{

    if(keypadInterrupt)
    {     
        uint8_t index = keyPad.getKey();
        
        //  ignore key bounces
        if (index == I2C_KEYPAD_THRESHOLD)
            return;

        //  only after keyChange is handled it is time reset the flag
        keypadInterrupt = false;

        if (index != 16)
        {
            logPrint(LOG_DEBUG, CAT_KEYPAD, "Pressed: %c", keys[index]);       
        }
        else
        {
            logPrint(LOG_DEBUG, CAT_KEYPAD, "Released");
        }

    }
}

void measurePolling()
{
  //  measure time to check isPressed() by polling.

  //  CLOCK      TIME (us)
  //  ---------------------
  //  100K       472
  //  200K       268
  //  300K       200
  //  400K       168
  //  500K       152
  //  600K       136
  //  700K       124
  //  800K       error
  for (uint32_t clock = 100000; clock <= 800000; clock += 100000)
  {
    Wire.setClock(clock);
    for (int i = 0; i < 1; i++)
    {
      //  reference time for keyPressed check UNO ~
      uint32_t start = micros();
      uint8_t index = keyPad.isPressed();
      uint32_t stop = micros();

      logPrint(LOG_DEBUG, CAT_KEYPAD, "Pressed: %lu\t%u\t%c\t%lu", clock, index, keys[index], (stop - start));

      delay(10);
    }
  }
}
