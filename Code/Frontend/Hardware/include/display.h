#ifndef DISPLAY_H
#define DISPLAY_H

#include <U8g2lib.h>
#include <Wire.h>

extern U8G2_SSD1309_128X64_NONAME2_F_SW_I2C display;

const int DISPLAY_SCL = 22;
const int DISPLAY_SDA = 21;

extern void setupDisplay();

#endif