// File: sleeplog.app.js (Version: With "Send to Phone" button)

const SETTINGS_FILE = 'sleeplog.settings.json';
const RAW_DATA_FILE = 'sleepdata.json';

// --- UI for the Controller (Start/Stop) ---
function showControllerUI() {
  g.clear(); Bangle.loadWidgets(); Bangle.drawWidgets();
  g.setFont("Vector", 30).setFontAlign(0, 0);

  let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
  if (settings.isLogging) {
    g.setColor("#ff0000"); g.drawString("LOGGING", g.getWidth()/2, g.getHeight()/2 - 30);
    g.setFont("6x8", 2).setColor(g.theme.fg); g.drawString("Press BTN1 to", g.getWidth()/2, g.getHeight()/2 + 20);
    g.setFont("Vector", 25).setColor("#ff0000"); g.drawString("STOP", g.getWidth()/2, g.getHeight()/2 + 50);
  } else {
    g.setColor("#00ff00"); g.drawString("IDLE", g.getWidth()/2, g.getHeight()/2 - 30);
    g.setFont("6x8", 2).setColor(g.theme.fg); g.drawString("Press BTN1 to", g.getWidth()/2, g.getHeight()/2 + 20);
    g.setFont("Vector", 25).setColor("#00ff00"); g.drawString("START", g.getWidth()/2, g.getHeight()/2 + 50);
  }
}

// --- Logic for Sending Data ---
function sendDataToPhone() {
  E.showPrompt("Send data to phone?").then(isYes => {
    if (!isYes) return;
    
    let file = require("Storage").read(RAW_DATA_FILE);
    if (!file) {
      E.showAlert("No data file found!");
      return;
    }

    E.showMessage("Sending data...", "Bluetooth");
    
    // The data is sent via the Bluetooth object, which handles the connection
    Bluetooth.println(JSON.stringify({t:"sleepdata", d:file}));
    Bluetooth.println("\x04"); // End-of-Transmission
  });
}

// --- Main App Logic ---
let hasRawData = require("Storage").read(RAW_DATA_FILE) !== undefined;

if (hasRawData) {
  // If data exists, show the "Send to Phone" UI
  g.clear(); Bangle.loadWidgets(); Bangle.drawWidgets();
  g.setFont("Vector", 30).setFontAlign(0, 0);
  g.setColor("#00aaff"); g.drawString("DATA READY", g.getWidth()/2, g.getHeight()/2 - 30);
  g.setFont("6x8", 2).setColor(g.theme.fg); g.drawString("Press BTN1 to", g.getWidth()/2, g.getHeight()/2 + 20);
  g.setFont("Vector", 25).setColor("#00aaff"); g.drawString("SEND", g.getWidth()/2, g.getHeight()/2 + 50);

  setWatch(sendDataToPhone, BTN1, { edge: "falling", repeat: true });
  
} else {
  // Otherwise, show the Start/Stop controller UI
  showControllerUI();
  setWatch(() => {
    let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
    let isLogging = !settings.isLogging;
    require("Storage").writeJSON(SETTINGS_FILE, { isLogging: isLogging });
    if (isLogging) {
      require("Storage").erase(RAW_DATA_FILE);
      E.showMessage("Logging Started...", "Sleep Logger");
      setTimeout(load, 1000); // Exit to clock
    } else {
      E.showMessage("Logging Stopped", "Sleep Logger");
      setTimeout(showControllerUI, 1000);
    }
  }, BTN1, { edge: "falling", repeat: true });
}
