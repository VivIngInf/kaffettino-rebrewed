#ifndef CONFIGWEBSERVER_H
#define CONFIGWEBSERVER_H

#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <Preferences.h>
#include "config.h"
#include <DNSServer.h>

extern int startWebServer();
extern void stopWebServer();
extern bool isWebServerOn();
extern String processor(const String& var);
extern void handleNewConfigs(AsyncWebServerRequest *request);


extern bool serverUp;
extern bool hasNewConfigs;

// Create the server object and use HTTP's default port 
extern AsyncWebServer server;

// Create the DNS server object
extern DNSServer dnsServer;

extern void startCaptiveDNS();


#endif 