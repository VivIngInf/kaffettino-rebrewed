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
        delay(2000);
        // TODO: reconnect if the connection went away
        return;
    }

    digitalWrite(2, HIGH);
    delay(1000);
    digitalWrite(2, LOW);
    delay(1000);
}



