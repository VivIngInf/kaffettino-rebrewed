#include "fallbackWebServer.h"
#include "connectivity.h"

bool serverUp = false;
AsyncWebServer server(80);

bool hasNewConfigs = false;

// Returns -1 if an error occurred, 0 if successfull
int startWebServer()
{
    if(serverUp)
        return 0;

    Serial.println("Disconnecting from other sources...");

    bool disconnected = WiFi.disconnect(true);
    Serial.print("Disconnected: ");
    Serial.println(disconnected);

    Serial.println("Activating fallback server Access Point...");

    // Configure the ESP32 as an access point
    WiFi.softAP(FALLBACK_SSID, FALLBACK_PASSWORD);

    IPAddress IP = WiFi.softAPIP();
    Serial.print("IP Address: ");
    Serial.println(IP);

    if(!SPIFFS.begin(true))
    {
        Serial.println("An error occurred while mounting SPIFFS.");        
        
        Serial.print("Total bytes: ");
        Serial.println(SPIFFS.totalBytes());

        Serial.print("Used bytes: ");
        Serial.println(SPIFFS.usedBytes());
        
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
        
        if (request->hasParam("isEAP", true)) 
        {
            String paramIsEAP = request->getParam("isEAP", true)->value();
            Serial.println("isEAP value: " + paramIsEAP);

            IS_EAP =  true;
        }
        else
        {
            Serial.println("isEAP value: " + false);
            IS_EAP =  false;
        }

        handleNewConfigs(request);
        
        request->send(SPIFFS, "/index.html", String(), false, processor);
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

void handleNewConfigs(AsyncWebServerRequest *request)
{
    Serial.println("Checking for new configs...");

    if (request == nullptr)
    {
        Serial.println("No new configs to process.");
        hasNewConfigs = false;
        return;
    }

    Serial.println("Found new configs, parsing...");

    bool atLeastOneChange = false;

    if (request->hasParam("isEAP", true)) 
    {
        IS_EAP =  true;
        Serial.print("isEAP value: ");
        Serial.println(IS_EAP);

        atLeastOneChange = true;
    }
    else
    {
        IS_EAP =  false;
        Serial.println("isEAP value: " + IS_EAP);

        atLeastOneChange = true;
    }

    if(request->hasParam("wifiSSID", true))
    {
        WIFI_SSID = request->getParam("wifiSSID", true)->value();
        Serial.println("Wifi SSID value: " + WIFI_SSID);

        atLeastOneChange = true;
    }

    if(request->hasParam("eapUsername", true))
    {
        EAP_USERNAME = request->getParam("eapUsername", true)->value();
        Serial.println("EAP username value: " + EAP_USERNAME);

        atLeastOneChange = true;
    }

    if(request->hasParam("eapPassword", true))
    {
        EAP_PASSWORD = request->getParam("eapPassword", true)->value();
        Serial.println("EAP password value: " + EAP_PASSWORD);

        atLeastOneChange = true;
    }

    if(request->hasParam("wifiPassword", true))
    {
        WIFI_PASSWORD = request->getParam("wifiPassword", true)->value();
        Serial.println("Wifi password value: " + WIFI_PASSWORD);

        atLeastOneChange = true;
    }

    if(atLeastOneChange)
    {
        saveConfigs();       
        stopWebServer();
    }

    hasNewConfigs = false; 
}