#include "config.h"
#include "logger.h"

// Wifi Configuration

String WIFI_SSID = "";      // Name of the network used to connect to the API server
String WIFI_PASSWORD = "";  // Password of the network used to connect to the API server

// EAP Configuration 

bool IS_EAP = false;        // Are we in a EAP network? (Eduroam in our case)

String EAP_USERNAME = "";   // The username or email of the EAP user
String EAP_PASSWORD = "";   // The password of the EAP user

// Fallback Wifi

String FALLBACK_SSID = "Kaffettino";    // Name of the ESP' broadcast network
String FALLBACK_PASSWORD = "";          // Password of the ESP' broadcast network

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

    logPrint(LOG_INFO, CAT_SYS, "WIFI_SSID start value: %s", WIFI_SSID.c_str());
    logPrint(LOG_INFO, CAT_SYS, "IS_EAP start value: : %s", IS_EAP ? "True" : "False");
    logPrint(LOG_INFO, CAT_SYS, "WIFI_PASSWORD start value: %s", WIFI_PASSWORD.c_str());
    logPrint(LOG_INFO, CAT_SYS, "EAP_USERNAME start value: %s", EAP_USERNAME.c_str());
    logPrint(LOG_INFO, CAT_SYS, "EAP_PASSWORD start value: %s", EAP_PASSWORD.c_str());

    preferences.end();
}

// Saves the configs in the flash memory
void saveConfigs()
{
    preferences.begin("config", false);

    preferences.putBool("IS_EAP", IS_EAP);
    preferences.putString("WIFI_SSID", WIFI_SSID);
    preferences.putString("EAP_USERNAME", EAP_USERNAME);
    preferences.putString("EAP_PASSWORD", EAP_PASSWORD);
    preferences.putString("WIFI_PASSWORD", WIFI_PASSWORD);

    preferences.end();
}