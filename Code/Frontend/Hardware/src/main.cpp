/* ----- Basic libs ----- */

#include <Arduino.h>

/* ----- Custom libs ----- */

#include "config.h"
#include "configWebServer.h"
#include "connectivity.h"
#include "nfcReader.h"
#include "display.h"
#include "mp3player.h"
#include "statusIndicator.h"
#include "buzzer.h"
#include "keypad.h"

/* ----- Variables ----- */



void setup() 
{
    
    // Start serial comunication
    Serial.begin(115200);        

    // Setup the display first so we can communicate errors effectively
    setupDisplay();

    // Set the ESP as both a gateway and a client
    WiFi.mode(WIFI_AP_STA);

    // Load the WiFi credentials and general configs stored in memory
    initConfigs();

    // Restart the ESP if the server returns an internal server error
    if(startWebServer() != 0)
		ESP.restart();    

    initNFCScanner();

    initKeypad();    

    mp3PlayerInit();

    initLEDs();
    changeStatus(WAIT);
    startBlinking();

    kaffettinoDisplay();
    happySound();    
}

void loop() 
{    
    // Process DNS requests
    if(serverUp)
    {
        dnsServer.processNextRequest();
    }

    unsigned long now = millis();

    // If the device isn't connected, it shouldn't proceed deeper in the code
    if(!isConnected())
    {
        // But if enough time has passed from the last connection, the device should try to reconnect.
        if(!isConnecting && now - lastConnection >= timeBetweenConnectionTries)
        {
            tryConnectWifi();        
            
            // If the device isn't still connected, do not proceed
            if(!isConnected())
                return;
        }
        else
        {
            return;
        }
    }
  
    handleScanner(now);
    
    handleKeypad();

    handleBlink(now);    
}