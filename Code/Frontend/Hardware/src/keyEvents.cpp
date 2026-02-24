#include "keyEvents.h"

#define MAX_KEY_HANDLERS 6

static KeyEventHandler handlers[MAX_KEY_HANDLERS];
static uint8_t handlerCount = 0;

void initKeyEventBus()
{
    handlerCount = 0;
}

bool registerKeyHandler(KeyEventHandler handler)
{
    if (handlerCount >= MAX_KEY_HANDLERS)
        return false;

    handlers[handlerCount++] = handler;
    return true;
}

void dispatchKeyEvent(const KeyEvent& evt)
{
    for (uint8_t i = 0; i < handlerCount; i++)
    {
        if (handlers[i](evt))
            break;  // Evento consumato
    }
}
