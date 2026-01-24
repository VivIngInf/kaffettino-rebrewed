#include "configWebServer.h"
#include "connectivity.h"
#include "logger.h"

bool serverUp = false;

AsyncWebServer server(80);
DNSServer dnsServer;

bool hasNewConfigs = false;

// Returns 0 if an error occurred, 1 if successfull
int startWebServer()
{
    if(serverUp)
        return 1;

    // Configure the ESP32 as an access point
    WiFi.softAP(FALLBACK_SSID, FALLBACK_PASSWORD);

    WiFi.softAPConfig(
        IPAddress(192,168,4,1),
        IPAddress(192,168,4,1),
        IPAddress(255,255,255,0)
    );
    
    IPAddress IP = WiFi.softAPIP();

    logPrint(LOG_INFO, CAT_WIFI, "Gateway IP address: %s", IP.toString());

    if(!SPIFFS.begin(true))
    {
        logPrint(LOG_ERROR, CAT_SYS, "An error occurred while mounting SPIFFS.");             
        logPrint(LOG_ERROR, CAT_SYS, "SPIFFS Total Bytes: %lu", SPIFFS.totalBytes());        
        logPrint(LOG_ERROR, CAT_SYS, "SPIFFS Used Bytes: %lu", SPIFFS.usedBytes());                

        return 0; // Internal error
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
            IS_EAP =  true;
        }
        else
        {
            IS_EAP =  false;
        }
        
        logPrint(LOG_DEBUG, CAT_WIFI, "isEAP value: %s", IS_EAP ? "True" : "False");                

        handleNewConfigs(request);
        
        request->send(SPIFFS, "/index.html", String(), false, processor);
    });

    server.begin();
    logPrint(LOG_INFO, CAT_WIFI, "Access Point started. You can now configure WiFi via the web interface.");                    
    
    serverUp = true;

    startCaptiveDNS();

    return 1;
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

    logPrint(LOG_DEBUG, CAT_WIFI, "Processed value in HTML %s: %s", var, processedValue);    
    
    return processedValue;    
}

void handleNewConfigs(AsyncWebServerRequest *request)
{
    logPrint(LOG_INFO, CAT_WIFI, "Checking new configs...");

    if (request == nullptr)
    {
        logPrint(LOG_INFO, CAT_WIFI, "No new config to process");
        hasNewConfigs = false;
        return;
    }

    logPrint(LOG_INFO, CAT_WIFI, "Found new config, parsing...");

    bool atLeastOneChange = false;

    if (request->hasParam("isEAP", true)) 
    {
        IS_EAP =  true;
        logPrint(LOG_DEBUG, CAT_WIFI, "isEAP value: %s", IS_EAP ? "True" : "False");    

        atLeastOneChange = true;
    }
    else
    {
        IS_EAP =  false;
        logPrint(LOG_DEBUG, CAT_WIFI, "isEAP value: %s", IS_EAP ? "True" : "False");    

        atLeastOneChange = true;
    }

    if(request->hasParam("wifiSSID", true))
    {
        WIFI_SSID = request->getParam("wifiSSID", true)->value();
        logPrint(LOG_DEBUG, CAT_WIFI, "WiFi SSID value: %s", WIFI_SSID);    


        atLeastOneChange = true;
    }

    if(request->hasParam("eapUsername", true))
    {
        EAP_USERNAME = request->getParam("eapUsername", true)->value();
        logPrint(LOG_DEBUG, CAT_WIFI, "EAP username value: %s", EAP_USERNAME);            

        atLeastOneChange = true;
    }

    if(request->hasParam("eapPassword", true))
    {
        EAP_PASSWORD = request->getParam("eapPassword", true)->value();        
        logPrint(LOG_DEBUG, CAT_WIFI, "EAP password value: %s", EAP_PASSWORD);            

        atLeastOneChange = true;
    }

    if(request->hasParam("wifiPassword", true))
    {
        WIFI_PASSWORD = request->getParam("wifiPassword", true)->value();
        logPrint(LOG_DEBUG, CAT_WIFI, "Wifi password value: %s", WIFI_PASSWORD);                    

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
    logPrint(LOG_INFO, CAT_WIFI, "Started DNS server!");                    
}