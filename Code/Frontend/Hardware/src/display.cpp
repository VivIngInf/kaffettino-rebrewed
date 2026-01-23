#include "display.h"
#include "utility.h"

// Create the display object and bind it to I2C
U8G2_SSD1309_128X64_NONAME2_F_SW_I2C display (U8G2_R0, GEN_SCL, GEN_SDA, U8X8_PIN_NONE);

int dotIndex = 0;

int loadingDotsDelay = 1000;
int latestDot = 0;

bool setupDisplay()
{
    if(!probeI2C(displayI2CAddress, 5, 10))
        return false;

    display.begin();
    display.firstPage();

    display.setFont(u8g2_font_unifont_tf);    
    
    display.drawStr(ALIGN_CENTER("VIVERE"), VERTICAL_CENTER - 20, "VIVERE");
    display.drawStr(ALIGN_CENTER("KAFFETTINO"), VERTICAL_CENTER, "KAFFETTINO");
    display.drawStr(ALIGN_CENTER("INITIALIZING..."), VERTICAL_CENTER + 20, "INITIALIZING...");
    display.nextPage();

    return true;
}

void drawErrorDot(int x, int y, ERROR_LABELS error)
{
    if(hasError(error))
        display.drawFilledEllipse(x, y, 3, 3);
    else
        display.drawEllipse(x, y, 3, 3);
}

void drawWarnDot(int x, int y, WARNING_LABELS warning)
{
    if(hasWarning(warning))
        display.drawFilledEllipse(x, y, 3, 3);
    else
        display.drawEllipse(x, y, 3, 3);
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

void displayErrorsAndWarning()
{
    dotIndex = 0;

    display.clearBuffer();    

    display.drawXBM(2, 3, 32, 32, coffyMorto);

    display.setFont(u8g2_font_t0_11_tr);

    if(hasAnyError())
    {
        display.drawStr(38, 11, "ERRORE CRITICO");
    }
    else
    {
        display.drawStr(38, 11, "ERRORE WARNING");
    }

    display.drawStr(35, 24, "CHIAMA UN ADMIN");

    display.setFont(u8g2_font_4x6_tr);

    if(hasAnyError())
    {
        display.drawStr(36, 35, "CERCHI VUOTI == ERRORE");
    }
    else
    {
        display.drawStr(36, 35, "CERCHI VUOTI = WARNING");
    }

    drawErrorDot(7, 44, ERR_SERIAL);
    display.drawStr(13, 47, "SERIALE");
    
    drawWarnDot(106, 44, WARN_MP3);
    display.drawStr(112, 47, "MP3");

    drawErrorDot(106, 56, ERR_NFC);
    display.drawStr(112, 59, "NFC");

    drawErrorDot(7, 56, ERR_KEYPAD);
    display.drawStr(13, 59, "KEYPAD");

    drawErrorDot(56, 56, ERR_NETWORK);
    display.drawStr(62, 59, "NETWORK");

    drawErrorDot(56, 44, ERR_MEMORY);
    display.drawStr(62, 47, "MEMORIA");

    display.sendBuffer();
}