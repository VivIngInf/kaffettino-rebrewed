#pragma once
#include <Arduino.h>

enum KeyEventType
{
    KEY_PRESSED,
    KEY_RELEASED,
    KEY_HELD
};

struct KeyEvent
{
    char key;
    KeyEventType type;
};

typedef bool (*KeyEventHandler)(const KeyEvent& evt);

void initKeyEventBus();
bool registerKeyHandler(KeyEventHandler handler);
void dispatchKeyEvent(const KeyEvent& evt);
