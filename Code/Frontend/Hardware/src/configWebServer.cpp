#include "configWebServer.h"
#include "connectivity.h"

bool serverUp = false;

AsyncWebServer server(80);
DNSServer dnsServer;

bool hasNewConfigs = false;

// Returns -1 if an error occurred, 0 if successfull
int startWebServer()
{
    if(serverUp)
        return 0;

    // Configure the ESP32 as an access point
    WiFi.softAP(FALLBACK_SSID, FALLBACK_PASSWORD);

    WiFi.softAPConfig(
        IPAddress(192,168,4,1),
        IPAddress(192,168,4,1),
        IPAddress(255,255,255,0)
    );
    
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

    server.onNotFound([](AsyncWebServerRequest *request){
        request->redirect("/");
    });

    // ANDROID
    server.on("/generate_204", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(200, "text/html", "<html><meta http-equiv=\"refresh\" content=\"0; url=/\" /></html>");
    });

    server.on("/gen_204", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(200, "text/html", "<html><meta http-equiv=\"refresh\" content=\"0; url=/\" /></html>");
    });

    // APPLE
    server.on("/hotspot-detect.html", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(200, "text/html", "<html><meta http-equiv=\"refresh\" content=\"0; url=/\" /></html>");
    });

    server.on("/captive.apple.com", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(200, "text/html", "<html><meta http-equiv=\"refresh\" content=\"0; url=/\" /></html>");
    });

    // WINDOWS
    server.on("/ncsi.txt", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(200, "text/plain", "NO INTERNET");  // Windows si aspetta "Microsoft NCSI"
    });

    server.on("/connecttest.txt", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(200, "text/plain", "NO INTERNET");
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

    startCaptiveDNS();

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
        
        if(connectionState != CONNECTION_CONNECTING)
            startConnecting();
    }

    hasNewConfigs = false; 
}

void handleDNS()
{
    if(serverUp)
        dnsServer.processNextRequest();
}

void startCaptiveDNS() 
{
    dnsServer.start(53, "*", WiFi.softAPIP()); 
    Serial.println("Started DNS server!"); 
}