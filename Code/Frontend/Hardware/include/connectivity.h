#ifndef CONNECTIVITY_H
#define CONNECTIVITY_H

/* ----- WIFI libs ----- */

#include <WiFi.h>
#include <esp_wpa2.h>

void tryConnectWifi();
int connectWifi();
bool isConnected();

extern bool isConnecting;

#endif