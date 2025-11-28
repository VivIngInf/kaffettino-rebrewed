#include "fallbackWebServer.h"

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

        // Store the new IS_EAP value in flash memory
        preferences.putBool("IS_EAP", IS_EAP);

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

    Serial.println("Processed value in HTML " + var + ": " + processedValue);        
    
    return processedValue;    
}