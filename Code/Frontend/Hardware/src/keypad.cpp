#include "keypad.h"
#include "logger.h"
#include "keyEvents.h"

// ─── Interrupt state ─────────────────────────────────────────────
volatile bool keypadInterrupt         = false;
unsigned long lastInterruptTimeKeypad = 0;

// ─── I2C / keys ──────────────────────────────────────────────────
I2CKeyPad keyPad(KEYPAD_ADDRESS);
char keyMap[19] = "123A456B789C*0#DNF"; // N = NoKey, F = Fail

static unsigned long lastRead = 0;

// ─── State machine ───────────────────────────────────────────────
enum class KeypadState { Idle, Pressed, Held };
static KeypadState   kpState     = KeypadState::Idle;
static char          lastKey     = 0;
static unsigned long pressTime   = 0;

// ─── Debug subscriber ────────────────────────────────────────────
static bool keypadDebugHandler(const KeyEvent& evt)
{
    const char* typeStr = "?";
    switch (evt.type)
    {
        case KEY_PRESSED:  typeStr = "PRESSED";  break;
        case KEY_RELEASED: typeStr = "RELEASED"; break;
        case KEY_HELD:     typeStr = "HELD";     break;
    }
    LOGD(CAT_KEYPAD, "Key '%c' %s", evt.key, typeStr);
    return false; // non consumare: lascia propagare ai subscriber successivi
}

static inline void emitKeyEvent(char key, KeyEventType type)
{
    KeyEvent evt { key, type };
    dispatchKeyEvent(evt);
}

// ─────────────────────────────────────────────────────────────────
bool initKeypad()
{
    pinMode(IRQ_KEYPAD, INPUT);
    attachInterrupt(digitalPinToInterrupt(IRQ_KEYPAD), readKeypad, FALLING);
    keypadInterrupt = false;

    if (!keyPad.begin() || !keyPad.isConnected())
    {
        logPrint(LOG_ERROR, CAT_KEYPAD, "Cannot comunicate to keypad!");
        return false;
    }

    keyPad.setDebounceThreshold(KEYPAD_LIB_DEBOUNCE_MS);
    measurePolling();
    Wire.setClock(400000);

    keyPad.setKeyPadMode(I2C_KEYPAD_4x4);
    keyPad.loadKeyMap(keyMap);

    registerKeyHandler(keypadDebugHandler);

    return true;
}

// ─────────────────────────────────────────────────────────────────
void IRAM_ATTR readKeypad()
{
    keypadInterrupt = true;
}

// ─────────────────────────────────────────────────────────────────
void handleKeypad()
{
    unsigned long now = millis();

    // Evita di interrogare l'I2C se non c'è un edge pendente e non stiamo
    // già seguendo un tasto (per HELD/RELEASED serve il polling).
    bool mustPoll = keypadInterrupt || (kpState != KeypadState::Idle);
    if (!mustPoll) return;

    // Throttle delle letture: abbatte rimbalzi e glitch spurî.
    if (now - lastRead < DEBOUNCE_DELAY_KEYPAD) return;
    lastRead = now;
    keypadInterrupt = false;

    uint8_t index = keyPad.getKey();
    LOGD(CAT_KEYPAD, "raw index: %u", index);
    bool    valid = (index != I2C_KEYPAD_THRESHOLD) && (index < 16);
    char    currentKey = valid ? keyMap[index] : 0;

    switch (kpState)
    {
        case KeypadState::Idle:
            if (currentKey)
            {
                lastKey   = currentKey;
                pressTime = now;
                kpState   = KeypadState::Pressed;
                emitKeyEvent(lastKey, KEY_PRESSED);
            }
            break;

        case KeypadState::Pressed:
        case KeypadState::Held:
            if (!currentKey)
            {
                emitKeyEvent(lastKey, KEY_RELEASED);
                lastKey = 0;
                kpState = KeypadState::Idle;
            }
            else if (currentKey != lastKey)
            {
                // Cambio di tasto senza release intermedio: chiudiamo il vecchio
                // e apriamo il nuovo, così i subscriber restano coerenti.
                emitKeyEvent(lastKey, KEY_RELEASED);
                lastKey   = currentKey;
                pressTime = now;
                kpState   = KeypadState::Pressed;
                emitKeyEvent(lastKey, KEY_PRESSED);
            }
            else if (kpState == KeypadState::Pressed && (now - pressTime) >= HOLD_THRESHOLD_MS)
            {
                kpState = KeypadState::Held;
                emitKeyEvent(lastKey, KEY_HELD);
            }
            else if ((now - pressTime) >= RELEASE_TIMEOUT_MS)
            {
                // Safety net: se abbiamo perso l'edge di rilascio, forziamo il reset.
                LOGW(CAT_KEYPAD, "Release timeout on '%c', forcing RELEASED", lastKey);
                emitKeyEvent(lastKey, KEY_RELEASED);
                lastKey = 0;
                kpState = KeypadState::Idle;
            }
            break;
    }
}

// ─────────────────────────────────────────────────────────────────
void measurePolling()
{
    //  CLOCK      TIME (us)
    //  ---------------------
    //  100K       472
    //  200K       268
    //  300K       200
    //  400K       168
    //  500K       152
    //  600K       136
    //  700K       124
    //  800K       error  ← escluso
    for (uint32_t clock = 100000; clock <= 700000; clock += 100000)
    {
        Wire.setClock(clock);
        uint32_t start = micros();
        uint8_t  index = keyPad.isPressed();
        uint32_t stop  = micros();
        logPrint(LOG_DEBUG, CAT_KEYPAD, "%lu Hz | idx: %u | key: %c | %lu us",
                 clock, index, keyMap[index], (stop - start));
        delay(10);
    }
}