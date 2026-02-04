#ifndef CONNECTIVITY_H
#define CONNECTIVITY_H

/* ----- WIFI libs ----- */

#include <WiFi.h>
#include <esp_wpa2.h>

extern void initConnection();
extern void startConnecting();
extern void handleConnection(unsigned long now);
extern int connectWifi();
extern bool isConnected();

static long int timeBetweenConnectionTries = 15000;

extern unsigned long lastConnectionAttempt;
const unsigned long connectionRetryInterval = 5000;

extern unsigned long connectStartTime;          // Single try connection timer
const unsigned long connectTimeout = 15000;         // Single try connection timeout

extern int currentConnectionRetry;
const int maxConnectionRetries = 3;


enum ConnectionState 
{
    CONNECTION_IDLE,
    CONNECTION_CONNECTING,
    CONNECTION_CONNECTED,
    CONNECTION_NO_WIFI,
    CONNECTION_FAILED,
    CONNECTION_WRONG_PASSWORD
};

extern ConnectionState connectionState;

#endif