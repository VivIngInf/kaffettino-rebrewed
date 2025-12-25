#include "display.h"

// Create the display object and bind it to SPI
U8G2_SSD1309_128X64_NONAME2_F_SW_I2C display (U8G2_R0, GEN_SCL, GEN_SDA, U8X8_PIN_NONE);

void setupDisplay(){
    display.begin();
    display.firstPage();

    display.setFont(u8g2_font_ncenB14_tr);
    display.drawStr(0, 15, "Hello world!");
    display.nextPage();
}