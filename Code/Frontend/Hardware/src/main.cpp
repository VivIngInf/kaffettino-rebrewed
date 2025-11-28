/* ----- Basic libs ----- */

#include <Arduino.h>

/* ----- WIFI libs ----- */

#include <WiFi.h>
#include <esp_wpa2.h>

/* ----- My libs ----- */

#include "config.h"
#include "fallbackWebServer.h"

/* ----- Variables ----- */

int connectWifi();

void setup() {
    
    // Start serial comunication
    Serial.begin(115200);

    pinMode(2, OUTPUT);

    initConfigs();

    // Todo: If the configs are changed in the HTML page, the connectWifi() method should be called
}

void loop() {
    
    // If the module isn't connected, or the connection went away, we should try to reconnect
    while (WiFi.status() != WL_CONNECTED)
    {
        int status = connectWifi();

        switch (status)
        {
            case -2:  // Config error
                Serial.println("Config error, fallback to AP mode.");
                delay(2000);
                break;
            case -1:  // Network error
                Serial.println("Network error, retrying...");
                delay(2000);
                break;
            default:
                Serial.println("Connected successfully!");
                break;
        }
    }

    digitalWrite(2, HIGH);
    delay(1000);
    digitalWrite(2, LOW);
    delay(1000);
}

// Returns -3 in case of internal error, -2 in case of config error, -1 in case of network error, 0 in case of success
int connectWifi()
{
    bool wifiError = false;

    if(IS_EAP)
    {
        if(EAP_USERNAME == "" || EAP_PASSWORD == "")
        {
            // Todo: Error Handling
            wifiError = true;
        }
    }
    else
    {
        if(WIFI_SSID == "" || WIFI_PASSWORD == "")
        {
            // Todo: Error Handling
            wifiError = true;
        }
    }    

    // If credentials are not set
    if(wifiError)
    {        
        if (startWebServer() != 0)     
            return -3; // Internal error       

        return -2;  // Config error
    }

    stopWebServer();

    // Connect to WIFI 

    if(IS_EAP)
    {
        WiFi.begin(WIFI_SSID, WPA2_AUTH_PEAP, EAP_USERNAME, EAP_USERNAME, EAP_PASSWORD);
    }
    else
    {
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);        
    }

    // Wait a sec before checking if it has connected to the network
    delay(1000);

    if (WiFi.status() != WL_CONNECTED)
    {
        delay(5000); // Wait a bit before rechecking        

        // If we haven't connected yet, the most likely cause is wrong credentials. Go back
        if(WiFi.status() != WL_CONNECTED)
            return -1; // Network error
    }
    
    Serial.println("The connection was successfull");
    return 0;
}

