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
#include "errorHandler.h"

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

    // TODO: CHECK FOR ERRORS IN OTHER FUNCTIONS!!!!
    handleErrors();

    bootSound();    
    startConnecting();
}

void loop() 
{    
    unsigned long now = millis();

    handleDNS(); // Processes DNS requests for the captive portal    

    handleConnection(now); // Handles Wifi connection and errors

    // If the device isn't connected, it shouldn't proceed deeper in the code
    if(!isConnected())
        return;
        
    handleScanner(now);
    
    handleKeypad();

    handleBlink(now);    
}