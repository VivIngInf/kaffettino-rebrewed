#pragma once

#include <WiFi.h>
#include <esp_wpa2.h>

// ─── Timing constants ────────────────────────────────────────────
const unsigned long timeBetweenConnectionTries = 15000; // Wait after all retries exhausted (ms)
const unsigned long connectionRetryInterval    = 5000;  // Wait between individual retries (ms)
const unsigned long connectTimeout             = 15000; // Single attempt timeout (ms)
const int           maxConnectionRetries       = 3;

// ─── State ───────────────────────────────────────────────────────
extern unsigned long lastConnectionAttempt;
extern unsigned long connectStartTime;
extern int           currentConnectionRetry;

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

// ─── API ─────────────────────────────────────────────────────────
extern void initConnection();
extern void startConnecting();
extern void handleConnection(unsigned long now);
extern int  connectWifi();
extern bool isConnected();