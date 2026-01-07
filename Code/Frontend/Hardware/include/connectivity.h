#ifndef CONNECTIVITY_H
#define CONNECTIVITY_H

/* ----- WIFI libs ----- */

#include <WiFi.h>
#include <esp_wpa2.h>

extern void tryConnectWifi();
extern int connectWifi();
extern bool isConnected();

static long int timeBetweenConnectionTries = 15000;

extern bool isConnecting;

extern unsigned long lastConnection;

#endif