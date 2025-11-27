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
        request->send(SPIFFS, "/index.html", String(), false);
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