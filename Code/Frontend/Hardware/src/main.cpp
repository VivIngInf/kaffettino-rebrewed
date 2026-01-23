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
#include "utility.h"

/* ----- Variables ----- */

void setup() 
{
    // Start serial comunication
    Serial.begin(115200);        

    if(!Serial)
        setError(ERR_SERIAL);

    // Start wire for I2C connection
    Wire.begin(GEN_SDA, GEN_SCL);

    // Scan I2C network, outputs avaiable devices, mostly for debugging, expected 0x20 (keyboard), 0x3C (display) and ??? (Mp3)
    if(!hasError(ERR_SERIAL))
        scanI2CBus();

    // Setup the display first so we can communicate errors effectively
    if(!setupDisplay())
        setError(ERR_DISPLAY);   

    // Set the ESP as both a gateway and a client
    WiFi.mode(WIFI_AP_STA);

    // Load the WiFi credentials and general configs stored in memory
    initConfigs();

    // Restart the ESP if the server returns an internal server error
    if(!startWebServer())
		setError(ERR_NETWORK);

    // Starts the NFC scanner, checks if version is valid, if not valid an error occured
    if(!initNFCScanner())
        setError(ERR_NFC);

    if(!initKeypad())
        setError(ERR_KEYPAD);    

    if (!initMP3Player())
        setWarning(WARN_MP3);
    
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