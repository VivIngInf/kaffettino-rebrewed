/* ----- Basic libs ----- */

#include <Arduino.h>

/* ----- My libs ----- */

#include "config.h"
#include "configWebServer.h"
#include "connectivity.h"
#include "nfcReader.h"

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

    tryConnectWifi();    
    
}

void loop() {    
    
    digitalWrite(2, LOW);

	
	
    // If we aren't connected, we shouldn't proceed, but at least try to reconnect.
    if(!isConnected() && !isConnecting)
    {
		tryConnectWifi();        
        delay(1000);
        return;
    }
    
    delay(1000);
    digitalWrite(2, HIGH);
	
	handleScanner();    
	

}



