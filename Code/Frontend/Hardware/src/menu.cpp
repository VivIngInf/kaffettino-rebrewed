#include "menu.h"
#include "keyEvents.h"
#include "display.h"
#include "logger.h"

bool menuKeyHandler(const KeyEvent& evt)
{
    if (evt.type != KEY_PRESSED)
        return false;

    switch (evt.key)
    {
        case '2': menuUp(); return true;
        case '8': menuDown(); return true;
        case '#': menuSelect(); return true;
        case '*': menuBack(); return true;
    }
    return false; // Non consumato
}

void menuUp()
{
    logPrint(LOG_DEBUG, CAT_KEYPAD, "Menu Up");
}

void menuDown()
{
    logPrint(LOG_DEBUG, CAT_KEYPAD, "Menu Down");
}

void menuSelect()
{
    logPrint(LOG_DEBUG, CAT_KEYPAD, "Menu Select");
}

void menuBack()
{
    logPrint(LOG_DEBUG, CAT_KEYPAD, "Menu Back");
}

void initMenu()
{
    registerKeyHandler(menuKeyHandler);
}
