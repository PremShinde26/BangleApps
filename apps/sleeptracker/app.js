// File: app.js
// Purpose: A simple, clean UI to start/stop logging and to initiate data sending.

const SETTINGS_FILE = 'sleeptracker.settings.json';

// --- Main UI: The big Start/Stop screen ---
function drawMainUI() {
  let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
  let isLogging = settings.isLogging || false;

  g.clear();
  Bangle.loadWidgets();
  Bangle.drawWidgets();
  g.setFontAlign(0, 0); // Center alignment

  if (isLogging) {
    g.setFont("Vector", 40).setColor("#ff0000");
    g.drawString("LOGGING", g.getWidth()/2, g.getHeight()/2 - 30);
    g.setFont("6x8", 2).setColor(g.theme.fg);
    g.drawString("Press BTN1 to STOP", g.getWidth()/2, g.getHeight()/2 + 30);
  } else {
    g.setFont("Vector", 40).setColor("#00ff00");
    g.drawString("IDLE", g.getWidth()/2, g.getHeight()/2 - 30);
    g.setFont("6x8", 2).setColor(g.theme.fg);
    g.drawString("Press BTN1 to START", g.getWidth()/2, g.getHeight()/2 + 30);
  }

  g.setFont("6x8", 2).setColor(g.theme.fg);
  g.drawString("BTN3: Send | BTN2: Exit", g.getWidth()/2, g.getHeight() - 20);
}

// --- Screen 2: Send Data Mode ---
function showSendDataScreen() {
  g.clear();
  g.setFont("Vector", 20).setFontAlign(0, 0);
  g.drawString("Ready to Send", g.getWidth()/2, g.getHeight()/2 - 40);
  g.setFont("6x8", 2).setFontAlign(0,0);
  g.drawString("Open Android app and\npress 'Fetch Data'.", g.getWidth()/2, g.getHeight()/2);
  g.setFont("6x8", 1).drawString("Press any button to go back.", g.getWidth()/2, g.getHeight() - 10);

  // Make the watch discoverable
  NRF.setAdvertising({}, { showName: true, uart: true });

  // On any button press, exit this mode
  clearWatch();
  const goBack = () => {
    NRF.setAdvertising({}); // Turn off advertising
    setupMainScreen(); // Go back to the main screen
  };
  setWatch(goBack, BTN1, { edge: "falling" });
  setWatch(goBack, BTN2, { edge: "falling" });
  setWatch(goBack, BTN3, { edge: "falling" });
}

// --- Combined UI and Handler Setup ---
function setupMainScreen() {
  drawMainUI();
  // Main button (BTN1) to START/STOP
  setWatch(() => {
    let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
    if (settings.isLogging) {
      require("Storage").writeJSON(SETTINGS_FILE, { isLogging: false });
      E.showMessage("Logging Stopped", "Sleep Logger");
      setTimeout(drawMainUI, 500); 
    } else {
      require("Storage").erase('sleeplogger.data.json');
      require("Storage").writeJSON(SETTINGS_FILE, { isLogging: true });
      E.showMessage("Logging Started...", "Sleep Logger");
      setTimeout(load, 1000); 
    }
  }, BTN1, { edge: "falling", repeat: true });

  // BTN2 to Exit the app completely
  setWatch(load, BTN2, { edge: "falling", repeat: true });

  // BTN3 to enter SEND mode
  setWatch(showSendDataScreen, BTN3, { edge: "falling", repeat: true });
}

// --- Initial App Start ---
setupMainScreen();
