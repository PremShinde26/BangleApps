// The settings file this app reads/writes must match the name in metadata.json
const SETTINGS_FILE = 'sleeptracker.settings.json';

function setLogging(isLogging) {
  require("Storage").writeJSON(SETTINGS_FILE, { isLogging: isLogging });
}

function drawUI() {
  let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
  let isLogging = settings.isLogging || false;

  g.clear();
  Bangle.loadWidgets();
  Bangle.drawWidgets();
  g.setFont("Vector", 30).setFontAlign(0, 0);

  if (isLogging) {
    g.setColor("#ff0000"); g.drawString("LOGGING", g.getWidth()/2, g.getHeight()/2 - 30);
    g.setFont("6x8", 2).setColor(g.theme.fg); g.drawString("Press BTN1 to", g.getWidth()/2, g.getHeight()/2 + 20);
    g.setFont("Vector", 25).setColor("#ff0000"); g.drawString("STOP", g.getWidth()/2, g.getHeight()/2 + 50);
  } else {
    g.setColor("#00ff00"); g.drawString("IDLE", g.getWidth()/2, g.getHeight()/2 - 30);
    g.setFont("6x8", 2).setColor(g.theme.fg); g.drawString("Press BTN1 to", g.getWidth()/2, g.getHeight()/2 + 20);
    g.setFont("Vector", 25).setColor("#00ff00"); g.drawString("START", g.getWidth()/2, g.getHeight()/2 + 50);
  }
}

setWatch(() => {
  let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
  let isLogging = settings.isLogging || false;

  if (isLogging) {
    setLogging(false);
    E.showMessage("Logging Stopped", "Sleep Tracker");
    setTimeout(drawUI, 1000);
  } else {
    // We still write to a generic 'sleepdata.json', this is fine.
    require("Storage").erase('sleepdata.json');
    setLogging(true);
    E.showMessage("Logging Started...", "Sleep Tracker");
    setTimeout(load, 1000);
  }
}, BTN1, { edge: "falling", repeat: true });

drawUI();
