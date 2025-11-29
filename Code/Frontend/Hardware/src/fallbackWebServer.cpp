#include "fallbackWebServer.h"
#include "connectivity.h"

bool serverUp = false;
AsyncWebServer server(80);

// Returns -1 if an error occurred, 0 if successfull
int startWebServer()
{
    if(serverUp)
        return 0;

    // Configure the ESP32 as an access point
    WiFi.softAP(FALLBACK_SSID, FALLBACK_PASSWORD);

    IPAddress IP = WiFi.softAPIP();
    Serial.print("IP Address: ");
    Serial.println(IP);

    if(!SPIFFS.begin(true))
    {
        Serial.println("An error occurred while mounting SPIFFS.");
        return -1; // Internal error
    }

    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(SPIFFS, "/index.html", String(), false, processor);
    });

    server.on("/css/output.css", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(SPIFFS, "/css/output.css", "text/css");
    });
    
    server.on("/js/main.js", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(SPIFFS, "/js/main.js", "application/javascript");
    });

    server.on("/submitConfigs", HTTP_POST, [](AsyncWebServerRequest *request) {

        bool atLeastOneChange = false;

        if (request->hasParam("isEAP", true)) 
        {
            String paramIsEAP = request->getParam("isEAP", true)->value();
            Serial.println("isEAP value: " + paramIsEAP);

            IS_EAP =  true;
            atLeastOneChange = true;
        }
        else
        {
            Serial.println("isEAP value: " + false);
            IS_EAP =  false;
            atLeastOneChange = true;
        }

        if(request->hasParam("wifiSSID", true))
        {
            String paramWifiSSID = request->getParam("wifiSSID", true)->value();
            Serial.println("Wifi SSID value: " + paramWifiSSID);

            WIFI_SSID = paramWifiSSID;
            atLeastOneChange = true;
        }

        if(request->hasParam("eapUsername", true))
        {
            String paramEapUsername = request->getParam("eapUsername", true)->value();
            Serial.println("EAP username value: " + paramEapUsername);

            EAP_USERNAME = paramEapUsername;
            atLeastOneChange = true;
        }

        if(request->hasParam("eapPassword", true))
        {
            String paramEapPassword = request->getParam("eapPassword", true)->value();
            Serial.println("EAP password value: " + paramEapPassword);

            EAP_PASSWORD = paramEapPassword;
            atLeastOneChange = true;
        }

        if(request->hasParam("wifiPassword", true))
        {
            String paramWifiPassword = request->getParam("wifiPassword", true)->value();
            Serial.println("Wifi password value: " + paramWifiPassword);

            WIFI_PASSWORD = paramWifiPassword;
            atLeastOneChange = true;
        }

        request->send(SPIFFS, "/index.html", String(), false, processor);

        if(atLeastOneChange)
        {
            preferences.begin("config", false);

            // Store the new values in flash memory
            preferences.putBool("IS_EAP", IS_EAP);
            preferences.putString("WIFI_SSID", WIFI_SSID);
            preferences.putString("EAP_USERNAME", EAP_USERNAME);
            preferences.putString("EAP_PASSWORD", EAP_PASSWORD);
            preferences.putString("WIFI_PASSWORD", WIFI_PASSWORD);

            preferences.end();
            
            tryConnectWifi(); // Retries to connect to wifi
            stopWebServer();
        }

    });

    server.begin();
    Serial.println("Access Point started. You can now configure WiFi via the web interface.");    
    
    serverUp = true;

    return 0;
}

void stopWebServer()
{
    server.end();               // Terminate the server if it was initialized (no need for a status check)
    WiFi.softAPdisconnect();    // Terminate the fallback network if it was initialized (no need for a status check)
    serverUp = false;
}

bool isServerOn() { return serverUp; }

// Replaces placeholders in HTML file with relative values
String processor(const String& var){
    String processedValue = "";

    if(var == "ISEAP")
    {
        processedValue = IS_EAP ? "checked" : "";        
    }
    else if (var == "WIFI_SSID")
    {
        processedValue = WIFI_SSID;
    }

    Serial.println("Processed value in HTML " + var + ": " + processedValue);        
    
    return processedValue;    
}