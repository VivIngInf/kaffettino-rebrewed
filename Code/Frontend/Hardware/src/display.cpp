#include "display.h"

// Create the display object and bind it to I2C
U8G2_SSD1309_128X64_NONAME2_F_SW_I2C display (U8G2_R0, GEN_SCL, GEN_SDA, U8X8_PIN_NONE);

int dotIndex = 0;

int loadingDotsDelay = 1000;
int latestDot = 0;

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

void displayConnecting(unsigned long now)
{
    if(now - latestDot < loadingDotsDelay)
        return;

    latestDot = now;

    switch (dotIndex)
    {
        case 1:
            display.drawFilledEllipse(79, 53, 4, 4);                               
            break;
    
        case 2:
            display.drawFilledEllipse(94, 53, 4, 4);
            break;

        case 3:
            display.drawFilledEllipse(109, 53, 4, 4);
            break;

        default:
            display.clearBuffer();            
            display.setFont(u8g2_font_t0_11_tr);
            
            display.drawStr(76, 15, "VIVERE");
            display.drawStr(64, 27, "KAFFETTINO");
            display.drawStr(61, 46, "CONNETTENDO");

            display.drawXBM(-2, 0, 64, 64, coffyNormale);

            display.drawEllipse(79, 53, 4, 4);
            display.drawEllipse(109, 53, 4, 4);
            display.drawEllipse(94, 53, 4, 4);
            
            break;
    }

    display.sendBuffer();
    dotIndex++;

    if(dotIndex > 3)
        dotIndex = 0;
}

void displayConnected()
{    
    dotIndex = 0;

    display.clearBuffer();
    display.setFont(u8g2_font_t0_11_tr);
        
    display.drawStr(76, 15, "VIVERE");
    display.drawStr(64, 27, "KAFFETTINO");
    display.drawStr(67, 46, "CONNESSO!");

    display.drawXBM(-2, 0, 64, 64, coffyFelice);

    display.sendBuffer();
}

void displayConnectionError()
{
    dotIndex = 0;

    display.clearBuffer();
    display.setFont(u8g2_font_t0_11_tr);
        
    display.drawStr(76, 15, "VIVERE");
    display.drawStr(64, 27, "KAFFETTINO");
    display.drawStr(61, 46, "CONNESSIONE");
    display.drawStr(70, 57, "FALLITA!");

    display.drawXBM(-2, 0, 64, 64, coffyTriste);

    display.sendBuffer();
}

void displayCriticalError()
{
    dotIndex = 0;

    display.clearBuffer();    

    display.drawXBM(2, 3, 32, 32, coffyMorto);

    display.setFont(u8g2_font_t0_11_tr);
    display.drawStr(38, 11, "ERRORE CRITICO");
    display.drawStr(35, 24, "CHIAMA UN ADMIN");

    display.setFont(u8g2_font_4x6_tr);
    display.drawStr(36, 35, "CERCHI VUOTI == ERRORE");

    display.drawEllipse(7, 44, 3, 3);
    display.drawStr(13, 47, "SERIALE");
    
    display.drawEllipse(106, 44, 3, 3);
    display.drawStr(112, 47, "MP3");

    display.drawEllipse(106, 56, 3, 3);
    display.drawStr(112, 59, "NFC");

    display.drawEllipse(7, 56, 3, 3);
    display.drawStr(13, 59, "KEYPAD");

    display.drawEllipse(56, 56, 3, 3);
    display.drawStr(62, 59, "DISPLAY");

    display.drawEllipse(56, 44, 3, 3);
    display.drawStr(62, 47, "MEMORIA");

    display.sendBuffer();
}