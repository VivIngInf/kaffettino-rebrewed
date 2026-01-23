#include "connectivity.h"
#include "config.h"
#include "configWebServer.h"
#include "display.h"
#include "buzzer.h"

unsigned long lastConnection = timeBetweenConnectionTries; // At start is equal to timeBetweenConnectionTries, so the connections starts right away
unsigned long lastConnectionAttempt = 0;
int currentConnectionRetry = 0;
ConnectionState connectionState = CONNECTION_IDLE;

void initConnection()
{
    lastConnectionAttempt = 0;
    connectionState = CONNECTION_IDLE;
    currentConnectionRetry = 0;
}

void startConnecting()
{
    if (connectionState == CONNECTION_CONNECTING)
        return;

    Serial.println("Starting WiFi connection...");
    
    currentConnectionRetry = 0;
    connectionState = CONNECTION_CONNECTING;
}

// Tries to connect to wifi and handles all errors
void handleConnection(unsigned long now)
{

    if (WiFi.status() != WL_CONNECTED && connectionState == CONNECTION_CONNECTED)
    {
        disconnectedSound();
        Serial.println("The device was connected, but the connection dropped. Trying to reconnect.");
        connectionState = CONNECTION_CONNECTING;        
    }

    if (connectionState == CONNECTION_FAILED && now - lastConnectionAttempt >= timeBetweenConnectionTries)
    {
        Serial.println("Retrying connecting after the device was unable to.");
        connectionState = CONNECTION_CONNECTING;
        currentConnectionRetry = 0;
    }

    // If the device isn't supposed to connect, return
    if (connectionState != CONNECTION_CONNECTING)
        return;

    // If the device is connected, change the state and return
    if (WiFi.status() == WL_CONNECTED) 
    {
        Serial.println("Connected successfully!");
        connectionState = CONNECTION_CONNECTED;        
        lastConnection = now;
        currentConnectionRetry = 0;
        displayConnected();
        connectedSound();
        return;
    }

    displayConnecting(now);

    // If not enough time has passed between the last connection, do not proceed (this way the device won't spam the access point with connection requests)
    if (now - lastConnectionAttempt < connectionRetryInterval) return;

    lastConnectionAttempt = now;

    // If the max retries limit is exceeded, return and wait some time
    if (currentConnectionRetry >= maxConnectionRetries) 
    {
        Serial.println("Maximum retries reached. Retrying in 15sec...");
        connectionState = CONNECTION_FAILED;
        displayConnectionError();
        disconnectedSound();
        return;
    }

    currentConnectionRetry++;
    
    Serial.print("Trying to connect, try number: ");
    Serial.println(currentConnectionRetry);

    int status = connectWifi();

    switch (status)
    {
        case -2:  // Config error
            Serial.println("Config error, retrying...");
            connectionState = CONNECTION_FAILED;            
            break;
        case -1:  // Network error
            Serial.println("Network error, retrying...");            
            break;
        default:            
            break;
    }
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

    return 0;
}

bool isConnected()
{
    return WiFi.status() == WL_CONNECTED;
}

