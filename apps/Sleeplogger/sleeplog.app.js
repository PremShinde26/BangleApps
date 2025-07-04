// File: sleeplog.app.js (Version: Multi-screen UI)

const SETTINGS_FILE = 'slee", 40).setColor(color).setFontAlign(0, 0);
  g.drawString(label, g.getWidth() / 2, g.getHeight() / 2);
}

// --- SCREEN 1: The Idle/Start Screen ---
function showStartScreen() {
  g.clear();
  Bangle.loadWidgets();
  Bangle.drawWidgets();
  drawButton("START", "#00ff00");
  setWatch(startLogging, BTN1, { edge: "falling" });
}

// --- SCREEN 2: The Logging/Stop Screen ---
function showStopScreen() {
  g.clear();
  Bangle.loadWidgets();
  Bangle.drawWidgets();
  drawButton("STOP", "#ff0000");
  setWatch(stopLogging, BTN1, { edge: "falling" });
}

// --- SCREEN 3: The Data Ready/Send Screen ---
function showSendScreen() {
  g.clear();
  Bplog.settings.json';
const RAW_DATA_FILE = 'sleepdata.json';

// --- Screen 1: The Main Menu ---
function showMainMenu() {
  const menu = {
    "": { "title": "Sleep Tracker" },
    "Start Logging": () => {
      let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
      if (settings.isLogging) {
        E.showAlertangle.loadWidgets();
  Bangle.drawWidgets();

  // Draw "SEND DATA" button in the top half
  g.setFont("Vector", 30).setColor("#00aaff").setFontAlign(0, 0);
  g.drawString("SEND DATA", g.getWidth() / 2, g.getHeight() * 0.3);

  // Draw "DELETE" button in the bottom half
  g.setFont("Vector", 30).setColor("#ff0000").setFontAlign(0, 0);
  g.drawString("DELETE", g.getWidth() / 2, g.getHeight() * 0.7);

  // Set watches for touch areas
  Bangle.on("touch", (button, xy) => {
("Already logging!");
      } else {
        E.showPrompt("Start new session?\n(Deletes old data)").then(isYes => {
          if (isYes) {
            require("Storage").erase(RAW_DATA_FILE);
            require("Storage").writeJSON(SETTINGS_FILE, { isLogging: true });
            E.showMessage("Logging Started...", "Sleep Logger");
            setTimeout(load, 1500); // Exit to clock
          }
        });
      }
    },
    "Stop Logging": () => {
      let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
      if (!settings.isLogging) {
        E.showAlert("Not currently logging.");
      } else {
        require("Storage").writeJSON(SETTINGS_FILE, { isLogging: false });
        E.showMessage("Logging Stopped", "Sleep Logger");
      }
    },
    "Send Data": () => {
      sendDataToPhone();
    },
    "Exit": () => {
      load(); // Exit to clock face
    },
  };

  E.showMenu(menu);
}

// --- Logic for Sending Data to the Phone ---
function sendDataToPhone    if (xy.y < g.getHeight() / 2) {
      // Top half touched
      sendDataToPhone();
    } else {
      // Bottom half touched
      deleteData();
    }
  });
  
  // Also allow BTN1 to send
  setWatch(sendDataToPhone, BTN1, { edge: "falling" });
}

// --- ACTIONS ---
function startLogging() {
  require("Storage").erase() {
  let file = require("Storage").read(RAW_DATA_FILE);
  if (!file) {
    E.showAlert("No data file found to send!");
    return;
  }
  
  E.showPrompt("Send data to phone?").then(isYes => {
    if (!isYes) return;
    
    // Check if Bluetooth is connected
    if (!NRF.getSecurityStatus().connected) {
      E.showAlert("Phone not connected. Open the Android app first.");
      return;
    }

    E.showMessage("Sending data...", "Bluetooth");
    
    // The Bangle.js 'ble_simple_uart' library handles chunking automatically
    // when we send a large string with Bluetooth.println
    Bluetooth.println(JSON.stringify({t:"sleepdata", d:file}));
    
    // It(RAW_DATA_FILE); // Erase old data
  require("Storage").writeJSON(SETTINGS_FILE, { isLogging: true });
  E.showMessage("Logging Started...", "Sleep Logger");
  load(); // Exit to clock face
}

function stopLogging() {
  require("Storage").writeJSON(SETTINGS_FILE, { isLogging: false });
  // The boot job will flush the data buffer and stop logging
  E.showMessage("Logging Stopped", "Sleep Logger");
  // Give the boot job a moment to save the file, then redraw the UI
  setTimeout(main, 500);
}

function sendDataToPhone() {
  let file = require("Storage").read(RAW_DATA_FILE);
  if (!file) {
    E.showAlert("No data to send!");
    return;
  }
  E.showMessage("Sending to Phone...", "Bluetooth");
  // Wrap the raw data in a JSON object so the phone knows what it is
  Bluetooth.println(JSON.stringify({ t: "sleepdata", d: file }));
  Bluetooth.println("\x04"); // End-of-Transmission character
}

function deleteData() {
  E.showPrompt("Delete all sleep data?").then((isYes) => {
    if (isYes) {
      require("Storage").erase(RAW_DATA_FILE);
      main(); // Redraw the UI, which will now go to the start screen
    }
  });
}'s good practice to send an End-of-Transmission character
    // The Bangle might disconnect before the last bit of data is sent otherwise
    setTimeout(() => {
      Bluetooth.println("\x04");
    }, 500);
  });
}

// --- App Start ---
showMainMenu();
