# ☕ Kaffettino Rebrewed (v2.0)

![Project's banner](./Resources/Banners/KaffettinoRebrewed-Banner.png)

> Sistema embedded NFC per la gestione automatizzata delle consumazioni, progettato per ambienti reali e scalabilità.

![GitHub License](https://img.shields.io/github/license/VivIngInf/kaffettino-rebrewed)
![GitHub repo size](https://img.shields.io/github/repo-size/VivIngInf/kaffettino-rebrewed)

## ☀️ "Buongiornissimo... Arrikaffè!?!?!"

Kaffettino Rebrewed è la **nuova generazione del [progetto Kaffettino](https://github.com/VivIngInf/VivereKaffettino)**: non un semplice aggiornamento, ma una **riscrittura completa** pensata per essere più efficiente, robusta e pronta al futuro.

Se la prima versione era un prototipo brillante, questa è la sua evoluzione:
**hardware custom**, software **modulare** e una filosofia più **industriale**.

## ☕ Cos'è Kaffettino?

Vivere Kaffettino è una **suite** che permette agli utenti dell’Università di Palermo, appartenenti a Vivere Ingegneria, di **segnare le proprie consumazioni** (non solo di caffè) in modo semplice e veloce.

Il sistema è basato su un **ESP32 con lettore NFC**:

- L’utente avvicina la propria card
- Viene verificato il saldo
- Il costo del caffè viene scalato automaticamente

La ricarica viene poi gestita da un amministratore.

## 🤔 Cos’è cambiato con Rebrewed?

Kaffettino Rebrewed nasce come una **reingegnerizzazione completa** del [progetto originale](https://github.com/VivIngInf/VivereKaffettino), mantenendo lo spirito ma **rivoluzionando l’architettura**.

🔧 **Hardware & firmware**:

- PCB custom progettata ad hoc tramite KiCAD
- Firmware completamente riscritto e modularizzato
- Espandibilità grazie a morsettiere per device I2C e SPI
- Pensato per essere replicabile e manutenibile
- Aggiornamenti OTA

🖥️ **Backend**:

- Riscritto tutto il backend in TypeScript
- Integrato con il resto della suite Vivere
- Aggiunto Sito Web allo stack
- Continuazione del bot Telegram già presente nella versione 1

📡 **Connettività intelligente**:

- Riconnessione automatica
- Captive portal per configurazione WiFi
- Antenna esterna per maggiore copertura

🧯 **Gestione errori**:

- Sistema strutturato di gestione errori
- Debug più semplice
- Distinzione tra errori (bloccanti) e warning

## 🧱 Architettura

Kaffettino Rebrewed è composto da:

- ESP32 → legge NFC e comunica con backend
- Backend → gestisce utenti, saldo e logiche
- Web App → interfaccia admin ed utente per statistiche e gestione
- Bot Telegram → interazioni rapide

Tutti i **componenti** comunicano tramite **API REST**.

## 📚 Documentazione

La **documentazione** (utente e amministrativa) è disponibile nella **cartella Docs**.

## 📁 Struttura REPO

> WIP! 🚧

## 🖼️ Image Gallery

> WIP! 🚧

## ♥️ Credits

Realizzato **con amore**, debug e decisamente **troppa caffeina** dai ragazzi di Vivere Ingegneria Dev Hub

<table>
  <tr>
      <th>Daniele Susino</th>
      <th>Antonio Murabito</th>      
  </tr>
  <tr>
      <td><img src="./Resources/Foto/Daniele Orazio Susino.jpg" alt="Daniele Orazio Susino" width="150"></td>
      <td><img src="./Resources/Foto/Antonio Murabito.webp" alt="Antonio Murabito" width="150"></td>
  </tr>
  <tr>
      <td>Embedded</td>
      <td>Full Stack</td>
  </tr>
  <tr>
      <td>
         <a href="https://www.instagram.com/_antonio.jar/">Instagram 📸</a><br>
         <a href="https://www.linkedin.com/in/susinodaniele/">LinkedIn 👔</a><br>         
         <a href="https://www.susino.dev">Sito 🌐</a>
      </td>
      <td>
         <a href="https://www.instagram.com/_antonio.jar/">Instagram 📸</a><br>
         <a href="https://www.linkedin.com/in/z3ros4n/">LinkedIn 👔</a><br>         
         <a href="https://www.msworks.it">Sito 🌐</a>
       </td>
  </tr>
</table>

---

Si ringrazia, per l'aiuto dato, Nicolas Bruno di [Objex Labs](https://objexlabs.com/)
Basato su: [Vivere Kaffettino](https://github.com/VivIngInf/VivereKaffettino)
