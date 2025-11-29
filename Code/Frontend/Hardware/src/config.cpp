#include "config.h"

// Wifi Configuration

String WIFI_SSID = "";     // Name of the network used to connect to the API server
String WIFI_PASSWORD = ""; // Password of the network used to connect to the API server

// EAP Configuration 

bool IS_EAP = false;            // Are we in a EAP network? (Eduroam in our case)

String EAP_USERNAME = "";  // The username or email of the EAP user
String EAP_PASSWORD = "";  // The password of the EAP user

// Fallback Wifi

String FALLBACK_SSID = "Kaffettino";         // Name of the ESP' broadcast network
String FALLBACK_PASSWORD = "";     // Password of the ESP' broadcast network

Preferences preferences;

void initConfigs()
{
    // Start the workspace "config" in read and write
    preferences.begin("config", false);

    // Load values
    IS_EAP = preferences.getBool("IS_EAP", false);
    WIFI_SSID = preferences.getString("WIFI_SSID", "");
    WIFI_PASSWORD = preferences.getString("WIFI_PASSWORD", "");
    EAP_USERNAME = preferences.getString("EAP_USERNAME", "");
    EAP_PASSWORD = preferences.getString("EAP_PASSWORD", "");

    Serial.print("WIFI_SSID start value: ");
    Serial.println(WIFI_SSID);

    Serial.print("IS_EAP start value: ");
    Serial.println(IS_EAP);
    
    Serial.print("WIFI_PASSWORD start value: ");
    Serial.println(WIFI_PASSWORD);

    Serial.print("EAP_USERNAME start value: ");
    Serial.println(EAP_USERNAME);

    Serial.print("EAP_PASSWORD start value: ");
    Serial.println(EAP_PASSWORD);

    preferences.end();
}