#ifndef FALLBACKWEBSERVER_H
#define FALLBACKWEBSERVER_H

#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <config.h>

extern int startWebServer();
extern void stopWebServer();
extern bool isWebServerOn();

extern bool serverUp;

// Create the server object and use HTTP's default port 
extern AsyncWebServer server;

#endif 