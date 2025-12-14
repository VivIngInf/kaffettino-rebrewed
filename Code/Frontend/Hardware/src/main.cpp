/* ----- Basic libs ----- */

#include <Arduino.h>

/* ----- My libs ----- */

#include "config.h"
#include "configWebServer.h"
#include "connectivity.h"
#include "nfcReader.h"
#include "display.h"
#include "mp3player.h"
#include "statusIndicator.h"
#include "buzzer.h"

/* ----- Variables ----- */

void setup() {
    
    // Start serial comunication
    Serial.begin(115200);    

    // Integrated LED pin
    pinMode(2, OUTPUT);

    // Set the ESP as both a gateway and a client
    WiFi.mode(WIFI_AP_STA);

    // Load the WiFi credentials and general configs stored in memory
    initConfigs();

    // We should restart the ESP if we get an internal server error
    if(startWebServer() != 0)
		ESP.restart();

    initNFCScanner();

    digitalWrite(2, LOW);

    setupDisplay();

    mp3PlayerInit();

    initLEDs();
    changeStatus(WAIT);
    startBlinking();

    happySound();
}

void loop() {    

    // Process dns requests
    if(serverUp)
    {
        dnsServer.processNextRequest();
    }

    unsigned long now = millis();

    // If we aren't connected, we shouldn't proceed, but at least try to reconnect.
    if(!isConnected() && !isConnecting && now - lastConnection >= 15000)
    {
        tryConnectWifi();        
        return;
    }
  
    handleScanner();
    handleBlink(now);

}



