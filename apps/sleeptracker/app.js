// File: sleeplog.app.js (Version: Smart Viewer/Controller)

const SETTINGS_FILE = 'sleeplog.settings.json';
const ANALYZED_FILE = 'sleepdata.analyzed.json';

// --- UI Functions for Controller ---
function showControllerUI() {
  // ... (This is the same drawUI function from before)
}

// --- UI Functions for Viewer ---
const STAGE_COLORS = { /* ... */ };
function drawHypnogram(data) { /* ... */ }
function displaySummary(summary) { /* ... */ }


// --- Re-paste the full functions from before here ---
function showControllerUI() {
  let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
  let isLogging = settings.isLogging || false;
  g.clear(); Bangle.loadWidgets(); Bangle.drawWidgets(); g.setFont("Vector", 30).setFontAlign(0, 0);
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
const STAGE_COLORS = { "Awake": "#ff0000", "Light": "#87cefa", "Deep": "#00008b", "REM": "#9370db" };
function drawHypnogram(data) {
  const chartX = 10, chartY = 30, chartW = g.getWidth() - 20, chartH = 80;
  const barWidth = chartW / data.length;
  g.setColor(0,0,0).fillRect(chartX, chartY, chartX + chartW, chartY + chartH);
  data.forEach((entry, i) => {
    let stage = entry.stage; let yPos = 0;
    if (stage === "Awake") yPos = chartY + chartH * 0.8;
    else if (stage === "REM") yPos = chartY + chartH * 0.6;
    else if (stage === "Light") yPos = chartY + chartH * 0.4;
    else if (stage === "Deep") yPos = chartY + chartH * 0.0;
    else return;
    g.setColor(STAGE_COLORS[stage]);
    g.fillRect(chartX + i * barWidth, yPos, chartX + (i + 1) * barWidth - 1, chartY + chartH);
  });
}
function displaySummary(summary) {
  g.setFont("6x8", 2).setFontAlign(-1, -1).setColor(1,1,1);
  const yStart = 120;
  g.drawString(`Total Sleep: ${summary.totalSleep}`, 10, yStart);
  g.drawString(`Time in Bed: ${summary.timeInBed}`, 10, yStart + 20);
  g.setFont("6x8", 1);
  g.drawString(`Deep: ${summary.deep} | Light: ${summary.light}`, 10, yStart + 40);
  g.drawString(`REM: ${summary.rem} | Awake: ${summary.awake}`, 10, yStart + 52);
  g.setFont("Vector", 15).setColor("#00ff00").setFontAlign(0,0);
  g.drawString(summary.recommendation, g.getWidth()/2, yStart + 75, true);
}


// --- Main App Logic ---
let analyzedData = require("Storage").readJSON(ANALYZED_FILE, true);

if (analyzedData) {
  // --- SHOW RESULTS ---
  g.clear();
  Bangle.loadWidgets();
  Bangle.drawWidgets();
  drawHypnogram(analyzedData.log);
  displaySummary(analyzedData.summary);
  
  // Allow user to clear data and return to controller
  setWatch(() => {
    E.showPrompt("Delete all sleep data?").then((v) => {
      if (v) {
        require("Storage").erase(ANALYZED_FILE);
        require("Storage").erase('sleepdata.json');
        showControllerUI();
      }
    });
  }, BTN1, { edge: "falling", repeat: true });
  
} else {
  // --- SHOW CONTROLLER ---
  showControllerUI();
  setWatch(() => {
    let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
    let isLogging = settings.isLogging || false;
    if (isLogging) {
      setLogging(false); E.showMessage("Logging Stopped", "Sleep Logger"); setTimeout(showControllerUI, 1000);
    } else {
      require("Storage").erase('sleepdata.json'); setLogging(true); E.showMessage("Logging Started...", "Sleep Logger"); setTimeout(load, 1000);
    }
  }, BTN1, { edge: "falling", repeat: true });
}

function setLogging(isLogging) {
  require("Storage").writeJSON(SETTINGS_FILE, { isLogging: isLogging });
}
