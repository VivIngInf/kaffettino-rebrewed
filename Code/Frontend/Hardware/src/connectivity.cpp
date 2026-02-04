#include "connectivity.h"
#include "config.h"
#include "configWebServer.h"
#include "display.h"
#include "buzzer.h"
#include "logger.h"

unsigned long lastConnection = timeBetweenConnectionTries; // At start is equal to timeBetweenConnectionTries, so the connections starts right away
unsigned long lastConnectionAttempt = 0;
unsigned long connectStartTime = 0;
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
    int WiFiStatus = WiFi.status();
    wl_status_t WiFiStatusEnum = (wl_status_t)WiFiStatus;

    if (WiFiStatus != WL_CONNECTED && connectionState == CONNECTION_CONNECTED)
    {
        disconnectedSound();        
        logPrint(LOG_INFO, CAT_WIFI, "The device was connected, but the connection dropped. Trying to reconnect.");                    

        connectionState = CONNECTION_CONNECTING;        
    }

    if ((connectionState == CONNECTION_FAILED || connectionState == CONNECTION_NO_WIFI || connectionState == CONNECTION_WRONG_PASSWORD) && now - lastConnectionAttempt >= timeBetweenConnectionTries)
    {        
        logPrint(LOG_INFO, CAT_WIFI, "Retrying connecting after failure...");                    

        connectionState = CONNECTION_CONNECTING;
        currentConnectionRetry = 0;
    }

    // If the device isn't supposed to connect, return
    if (connectionState != CONNECTION_CONNECTING)
        return;

    if (WiFiStatus == WL_CONNECTED)
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

    // If the ESP is negotiating with the AP, do not proceed (this way the device won't spam the access point with connection requests)
    if (WiFiStatus == WL_IDLE_STATUS && now - connectStartTime > connectTimeout)
    {
        logPrint(LOG_ERROR, CAT_WIFI, "Connection timeout — restarting WiFi stack");
        WiFi.disconnect(true);
        return;
    }

    // If not enough time has passed between the last connection, do not proceed (this way the device won't spam the access point with connection requests)
    if (now - lastConnectionAttempt < connectionRetryInterval) return;

    lastConnectionAttempt = now;

    switch (WiFiStatusEnum)
    {
        case WL_NO_SSID_AVAIL:
            logPrint(LOG_ERROR, CAT_WIFI, "Connection failed: No SSID found with name: %s", WIFI_SSID);
            break;

        case WL_CONNECT_FAILED: case WL_DISCONNECTED:
            logPrint(LOG_ERROR, CAT_WIFI, "Connection failed: Unable to connect to WiFi, likely because the password wasn't right");            
            break;
     
        default:
            logPrint(LOG_INFO, CAT_WIFI, "Connection failed, official WiFi status: %d",  WiFiStatus);
            break;
    }

    // If the max retries limit is exceeded, return and wait some time
    if (currentConnectionRetry++ >= maxConnectionRetries) 
    {
        logPrint(LOG_INFO, CAT_WIFI, "Maximum retries reached. Retrying in 15s...");        
                    

        switch (WiFiStatusEnum)
        {
            case WL_NO_SSID_AVAIL:
                displayWiFiNotFound();
                connectionState = CONNECTION_NO_WIFI;
            break;
        
            case WL_CONNECT_FAILED: case WL_DISCONNECTED:
                displayWrongPassword();
                connectionState = CONNECTION_WRONG_PASSWORD;
        
            break;            

            default:
                displayConnectionError();     
                connectionState = CONNECTION_FAILED;

            break;
            
        } 
           
        disconnectedSound();
        return;
    }    
    
    logPrint(LOG_INFO, CAT_WIFI, "Trying to connect. Try number: %d", currentConnectionRetry);                        
    
    int status = connectWifi();
    
    switch (status)
    {
        case -2:  // Config error
            logPrint(LOG_ERROR, CAT_WIFI, "Could not connect because the credentials were not set, plesae change credentials.");                      
            connectionState = CONNECTION_FAILED;            
            break;
        case -1:  // Network error
            logPrint(LOG_INFO, CAT_WIFI, "A network error happened, retrying connecting...");                             
            connectionState = CONNECTION_FAILED;            
            break;
        default:            
            break;
    }
}

// Returns -2 in case of config error, -1 in case of network error, 0 in case of success
int connectWifi()
{
    bool wifiError = false;
    connectStartTime = millis();

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

