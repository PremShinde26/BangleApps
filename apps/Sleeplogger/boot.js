// File: sleeplog.boot.js (Final Production Version)
// Purpose: Handles all background tasks: logging and communication.

(function() {
  // Part 1: Sleep Logging Logic
  const STORAGE_FILE = 'sleepdata.json';
  const SETTINGS_FILE = 'sleeplog.settings.json';
  const LOG_INTERVAL_MS = 60000;

  let logInterval, dataBuffer = [], isCurrentlyLogging = false;
  let lastMovement = {x:0,y:0,z:0}, currentMovement = 0, lastHR = 0;
  Bangle.on('HRM', hrm => { if (hrm.confidence > 80) lastHR = hrm.bpm; });
  Bangle.on('accel', acc => {
    let m = Math.abs(acc.x - lastMovement.x) + Math.abs(acc.y - lastMovement.y) + Math.abs(acc.z - lastMovement.z);
    currentMovement += m; lastMovement = acc;
  });

  function logData() {
    if (lastHR > 0) {
      dataBuffer.push({ "time": new Date().toISOString(), "hr": lastHR, "movement": parseFloat(currentMovement.toFixed(2)) });
      currentMovement = 0; lastHR = 0;
      if (dataBuffer.length >= 10) {
        let d = require("Storage").readJSON(STORAGE_FILE, true) || [];
        d = d.concat(dataBuffer);
        require("Storage").writeJSON(STORAGE_FILE, d);
        dataBuffer = [];
      }
    }
  }
  function startLogging() {
    Bangle.setHRMPower(1, "sleeplog"); Bangle.setCompassPower(1, "sleeplog");
    lastMovement = Bangle.getAccel(); logInterval = setInterval(logData, LOG_INTERVAL_MS);
    isCurrentlyLogging = true;
  }
  function stopLogging() {
    clearInterval(logInterval); logInterval = undefined;
    if (dataBuffer.length > 0) {
      let d = require("Storage").readJSON(STORAGE_FILE, true) || [];
      d = d.concat(dataBuffer); require("Storage").writeJSON(STORAGE_FILE, d);
      dataBuffer = [];
    }
    Bangle.setHRMPower(0, "sleeplog"); Bangle.setCompassPower(0, "sleeplog");
    isCurrentlyLogging = false;
  }
  function checkState() {
    let s = require("Storage").readJSON(SETTINGS_FILE, true) || {};
    if (s.isLogging) { if (!isCurrentlyLogging) startLogging(); }
    else { if (isCurrentlyLogging) stopLogging(); }
  }
  setInterval(checkState, 300000); // Check every 5 minutes
  checkState();

  // Part 2: Android Communication Listener
  NRF.on('data', function(data) {
    if (data.trim() === "\x10loadsleep") {
      let file = require("Storage").read("sleepdata.json");
      if (file) {
        let pos = 0, chunkSize = 20;
        let sender = () => {
          if (pos >= file.length) { Bluetooth.write("\x04\n"); return; }
          let chunk = file.substring(pos, pos + chunkSize); pos += chunkSize;
          Bluetooth.write(chunk).then(sender).catch(()=>{});
        };
        sender();
      } else { Bluetooth.write("ERROR: No sleep data\n\x04\n"); }
    }
  });
})();
