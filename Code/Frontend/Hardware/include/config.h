#ifndef CONFIG_H
#define CONFIG_H

// Wifi Configuration

extern const char* WIFI_SSID;              // Name of the network used to connect to the API server
extern const char* WIFI_PASSWORD;          // Password of the network used to connect to the API server

// EAP Configuration 

extern bool IS_EAP;                        // Are we in a EAP network? (Eduroam in our case)

extern const char* EAP_USERNAME;           // The username or email of the EAP user
extern const char* EAP_PASSWORD;           // The password of the EAP user

// Fallback Wifi

extern const char* FALLBACK_SSID;         // Name of the ESP' broadcast network
extern const char* FALLBACK_PASSWORD;     // Password of the ESP' broadcast network

#endif