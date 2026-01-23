
#include "mp3player.h"

HardwareSerial mp3HwSerial(1); // Use UART channel 1 (Default TX: 17 and RX: 18)
DFRobotDFPlayerMini mp3Player;

/*
    NOTE: The SD card must be formatted as FAT32
*/

bool initMP3Player()
{
    // Start hardware serial to communicate with the mp3 player
    mp3HwSerial.begin(9600, SERIAL_8N1, MP3_RX, MP3_TX);

    if(!mp3Player.begin(mp3HwSerial))
    {
        Serial.println("The connection to the MP3 player failed!");
        return false;
    }

    Serial.println("MP3 player found!");
        
    mp3Player.volume(30);   // Set volume to maximum (0 to 30).
    mp3Player.play(1);      // Play the sound that is named 001.mp3 in the microSD

    return true;
}