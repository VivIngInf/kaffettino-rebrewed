/* ----- Basic libs ----- */

#include <Arduino.h>

/* ----- My libs ----- */

#include "config.h"
#include "fallbackWebServer.h"
#include "connectivity.h"

/* ----- Variables ----- */

void setup() {
    
    // Start serial comunication
    Serial.begin(115200);

    // Integrated LED pin
    pinMode(2, OUTPUT);

    initConfigs();

    tryConnectWifi();    
}

void loop() {

    if(!isConnected())
    {
        if(!serverUp)
            tryConnectWifi();

        delay(1000);
    }

    // If we aren't connected we should try to reconnect
    if(!isConnected())
    {
        delay(2000);
        
        /*// But only if we aren't already tryign to reconnect
        if(!isConnecting)
            tryConnectWifi();*/

        return;
    }

    digitalWrite(2, HIGH);
    delay(1000);
    digitalWrite(2, LOW);
    delay(1000);
}



