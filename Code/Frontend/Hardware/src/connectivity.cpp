#include "connectivity.h"
#include "config.h"
#include "configWebServer.h"

bool isConnecting = false;
unsigned long lastConnection = 0;


// Tries to connect to wifi and handles all errors
void tryConnectWifi()
{
    int maxRetries = 3;
    int currentRetry = 1;    

    isConnecting = true;

    // If the module isn't connected, or the connection went away, we should try to reconnect
    while (WiFi.status() != WL_CONNECTED && currentRetry <= maxRetries)
    {
        int status = connectWifi();

        Serial.print("Trying to connect, try number: ");
        Serial.println(currentRetry);

        switch (status)
        {
            case -2:  // Config error
                Serial.println("Config error, retrying...");
                delay(1000);
                break;
            case -1:  // Network error
                Serial.println("Network error, retrying...");
                delay(1000);
                break;
            default:
                Serial.println("Connected successfully!");
                break;
        }

        currentRetry++;
    }

    
    // If we reach the max retries, start the fallback server and await for user input
    if (currentRetry >= maxRetries)
    {
        Serial.println("Maximum connection retries reached. Please change credentials.");
        // TODO: Write to screen something for the end user
    }

    if(isConnected())
    {
        Serial.println("No more in connecting status, entering the main loop");
    }
    
    isConnecting = false;
    lastConnection = millis();
}

// Returns -2 in case of config error, -1 in case of network error, 0 in case of success
int connectWifi()
{
    bool wifiError = false;

    if(IS_EAP)
    {
        if(WIFI_SSID.length() == 0 || EAP_USERNAME.length() == 0 || EAP_PASSWORD.length() == 0)
        {
            Serial.println("Although EAP is selected, there are no configs for it");
            wifiError = true;
        }
    }
    else
    {
        if(WIFI_SSID.length() == 0 || WIFI_PASSWORD.length() == 0)
        {
            Serial.println("Although wifi is selected, there are no configs for it");
            wifiError = true;
        }
    }    

    Serial.print("Wifi EAP Username: ");
    Serial.println(EAP_USERNAME);

    Serial.print("Wifi EAP_PASSWORD: ");
    Serial.println(EAP_PASSWORD);

    Serial.print("Wifi SSID: ");
    Serial.println(WIFI_SSID);

    Serial.print("Wifi PASSWORD: ");
    Serial.println(WIFI_PASSWORD);

    // If credentials are not set
    if(wifiError)
    {        
        return -2;  // Config error
    }

    Serial.println("Network configuration is all good, initializing connection");    

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
    if(WiFi.status() != WL_CONNECTED){
        delay(1000);
    }
    
    if (WiFi.status() != WL_CONNECTED)
    {
        delay(3000); // Wait a bit before rechecking        
    }
    
    // If we haven't connected yet, the most likely cause is wrong credentials. Go back
    if(WiFi.status() != WL_CONNECTED)
        return -1; // Network error

    Serial.println("The connection was successfull");
    return 0;
}

bool isConnected()
{
    return WiFi.status() == WL_CONNECTED;
}

