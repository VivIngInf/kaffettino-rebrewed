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
#include "logger.h"
#include "menu.h"
#include "keyEvents.h"

/* ----- Functions ----- */

void setup() 
{
    // Start serial comunication
    Serial.begin(115200);        

    if(!Serial)
        setError(ERR_SERIAL);

    #ifdef DEBUG_BUILD
        logInit(true, true, true);
    #else
        logInit(true, true);
    #endif

    // Start wire for I2C connection
    Wire.begin(GEN_SDA, GEN_SCL);
    
    #ifdef DEBUG_BUILD
        initBuzzer(false);
    #else
        initBuzzer(true);
    #endif

    initLEDs();
    changeLEDStatus(LED_WAIT);
    startBlinking();

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

    // Start a web server to eventually change the WiFi network and credentials
    if(!startWebServer())
		setError(ERR_NETWORK);

    // Starts the NFC scanner, checks if version is valid, if it's not, an error occured
    if(!initNFCScanner())
        setError(ERR_NFC);

    initKeyEventBus();

    // Starts the keypad using the PCF8574-keypad lib, checks if correctly connected to I2C
    if(!initKeypad())
        setError(ERR_KEYPAD);

    // Starts the DFRobotMini MP3 player, checks if correctly connected to I2C
    if (!initMP3Player())
        setWarning(WARN_MP3);

    // Handles errors and warnings. Warnings are non blocking, meaning the ESP can proceed after showing them. Errors are blocking and the ESP will be restarted.
    handleErrors();

    initMenu();

    // If no error was found, play a joyful sound and start connecting
    bootSound();    
    startConnecting();
}

void loop() 
{    
    unsigned long now = millis();

    handleDNS(); // Processes DNS requests for the captive portal    
    
    handleBlink(now); // Handles the blink of the LEDs

    handleConnection(now); // Handles Wifi connection and errors

    // If the device isn't connected, it shouldn't proceed deeper in the code
    if(!isConnected())
        return;
        
    handleScanner(now);
    
    handleKeypad();
}