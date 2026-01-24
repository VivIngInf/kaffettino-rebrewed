#include "connectivity.h"
#include "config.h"
#include "configWebServer.h"
#include "display.h"
#include "buzzer.h"
#include "logger.h"

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

    logPrint(LOG_INFO, CAT_WIFI, "Starting WiFi connection...");                    

    
    currentConnectionRetry = 0;
    connectionState = CONNECTION_CONNECTING;
}

// Tries to connect to wifi and handles all errors
void handleConnection(unsigned long now)
{

    if (WiFi.status() != WL_CONNECTED && connectionState == CONNECTION_CONNECTED)
    {
        disconnectedSound();        
        logPrint(LOG_INFO, CAT_WIFI, "The device was connected, but the connection dropped. Trying to reconnect.");                    

        connectionState = CONNECTION_CONNECTING;        
    }

    if (connectionState == CONNECTION_FAILED && now - lastConnectionAttempt >= timeBetweenConnectionTries)
    {        
        logPrint(LOG_INFO, CAT_WIFI, "Retrying connecting after the device was unable to.");                    

        connectionState = CONNECTION_CONNECTING;
        currentConnectionRetry = 0;
    }

    // If the device isn't supposed to connect, return
    if (connectionState != CONNECTION_CONNECTING)
        return;

    // If the device is connected, change the state and return
    if (WiFi.status() == WL_CONNECTED) 
    {
        logPrint(LOG_INFO, CAT_WIFI, "Connected successfully!");                    

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
        logPrint(LOG_INFO, CAT_WIFI, "Maximum retries reached. Retrying in 15s...");                    
        connectionState = CONNECTION_FAILED;

        displayConnectionError();        
        disconnectedSound();
        return;
    }

    currentConnectionRetry++;
    
    logPrint(LOG_INFO, CAT_WIFI, "Trying to connect. Try number: %d", currentConnectionRetry);                        

    int status = connectWifi();

    switch (status)
    {
        case -2:  // Config error
            logPrint(LOG_ERROR, CAT_WIFI, "Could not connect becouse the credentials were not set, plesae change credentials.");                    
            
            connectionState = CONNECTION_FAILED;            
            break;
        case -1:  // Network error
            logPrint(LOG_INFO, CAT_WIFI, "A network error happened, retrying connecting...");                             
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
            logPrint(LOG_ERROR, CAT_WIFI, "Although EAP is selected, there are no configs for it.");                    

            wifiError = true;
        }
    }
    else
    {
        if(WIFI_SSID.length() == 0 || WIFI_PASSWORD.length() == 0)
        {            
            logPrint(LOG_ERROR, CAT_WIFI, "Although WiFi is selected, there are no configs for it.");                    
            wifiError = true;
        }
    }    

    logPrint(LOG_DEBUG, CAT_WIFI, "Wifi EAP Username: %s", EAP_USERNAME);
    logPrint(LOG_DEBUG, CAT_WIFI, "Wifi EAP_PASSWORD: %s", EAP_PASSWORD);
    logPrint(LOG_DEBUG, CAT_WIFI, "Wifi SSID: %s", WIFI_SSID);
    logPrint(LOG_DEBUG, CAT_WIFI, "Wifi PASSWORD: %s", WIFI_PASSWORD);

    // If credentials are not set
    if(wifiError)
    {        
        return -2;  // Config error
    }
    
    logPrint(LOG_INFO, CAT_WIFI, "Network configuration is all good, trying to connect...");

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

