#include "display.h"

// Create the display object and bind it to I2C
U8G2_SSD1309_128X64_NONAME2_F_SW_I2C display (U8G2_R0, GEN_SCL, GEN_SDA, U8X8_PIN_NONE);

void setupDisplay()
{
    display.begin();
    display.firstPage();

    display.setFont(u8g2_font_unifont_tf);    
    
    display.drawStr(ALIGN_CENTER("VIVERE"), VERTICAL_CENTER - 20, "VIVERE");
    display.drawStr(ALIGN_CENTER("KAFFETTINO"), VERTICAL_CENTER, "KAFFETTINO");
    display.drawStr(ALIGN_CENTER("INITIALIZING..."), VERTICAL_CENTER + 20, "INITIALIZING...");
    display.nextPage();
}

extern void kaffettinoDisplay()
{
    display.firstPage();
    display.setBitmapMode(true);

    do
    {
        display.drawXBMP(0, 0, 64, 64, kaffettinoLogo);
        display.drawStr(68, 10, "Vivere");
        display.drawStr(ALIGN_RIGHT("Kaffettino"), 30, "Kaffettino");
        display.drawStr(ALIGN_RIGHT("Loading..."), 60, "Loading...");
    } while (display.nextPage());

}
