#ifndef CONFIG_H
#define CONFIG_H

/* ----- Storage libs ----- */

#include <Preferences.h>

/* ----- Variables ----- */

// Wifi Configuration

extern String WIFI_SSID;              // Name of the network used to connect to the API server
extern String WIFI_PASSWORD;          // Password of the network used to connect to the API server

// EAP Configuration 

extern bool IS_EAP;                        // Are we in a EAP network? (Eduroam in our case)

extern String EAP_USERNAME;           // The username or email of the EAP user
extern String EAP_PASSWORD;           // The password of the EAP user

// Fallback Wifi

extern String FALLBACK_SSID;         // Name of the ESP' broadcast network
extern String FALLBACK_PASSWORD;     // Password of the ESP' broadcast network

// Preferences object
extern Preferences preferences;

void initConfigs();
void saveConfigs();

#endif