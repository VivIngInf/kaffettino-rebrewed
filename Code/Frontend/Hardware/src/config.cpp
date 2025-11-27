#include "config.h"

// Wifi Configuration

const char* WIFI_SSID = "";     // Name of the network used to connect to the API server
const char* WIFI_PASSWORD = ""; // Password of the network used to connect to the API server

// EAP Configuration 

bool IS_EAP = false;            // Are we in a EAP network? (Eduroam in our case)

const char* EAP_USERNAME = "";  // The username or email of the EAP user
const char* EAP_PASSWORD = "";  // The password of the EAP user

// Fallback Wifi

const char* FALLBACK_SSID = "Kaffettino";         // Name of the ESP' broadcast network
const char* FALLBACK_PASSWORD = "";     // Password of the ESP' broadcast network

