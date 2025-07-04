// This script needs to know the name of the settings file to check.
(function() {
  const STORAGE_FILE = 'sleepdata.json';
  const SETTINGS_FILE = 'sleeptracker.settings.json'; // *** THIS LINE IS UPDATED ***
  const LOG_INTERVAL_MS = 20000;
// File: boot.js
// Purpose: Handles all background tasks: logging and communication.


  let logInterval, dataBuffer = [], isCurrentlyLogging = false;
  let lastMovement = {x:0,y:0,z:0}, currentMovement = 0, lastHR = 0;
  Bangle.on('HRM', hrm => { if (hrm.confidence > 80) lastHR = hrm.bpm; });
  Bangle.on('accel', acc => {
    let m = Math.abs(acc.x - lastMovement.x) + Math.abs(acc.y - lastMovement.y) + Math.abs(acc.z - lastMovement.z);
    currentMovement += m; lastMovement = acc;
  });

  function logData() { /* Omitted for brevity, code is correct */ }
  function startLogging() { /* Omitted for brevity, code is correct */ }
  function stopLogging() { /* Omitted for brevity, code is correct */ }
  // Pasted full functions for clarity
  function logData() {
    if (lastHR > 0) {
      dataBuffer.push({ "time": new Date().toISOString(), "hr": lastHR, "movement": parseFloat(currentMovement.toFixed(2)) });
      currentMovement = 0; lastHR = 0;
      if (dataBuffer.length >= 10) {
        let d = require("Storage").readJSON(STORAGE_FILE, true) || [];
        d = d.concat(dataBuffer); require("Storage").writeJSON(STORAGE_FILE, d); dataBuffer = [];
      }
    }
  }
  function startLogging() {
    Bangle.setHRMPower(1, "sleeplogger"); Bangle.setCompassPower(1, "sleeplogger");
    lastMovement = Bangle.getAccel(); logInterval = setInterval(logData, LOG_INTERVAL_MS);
    isCurrentlyLogging = true;
  }
  function stopLogging() {
    clearInterval(logInterval); logInterval = undefined;
    if (dataBuffer.length > 0) {
      let d = require("Storage").readJSON(STORAGE_FILE, true) || [];
      d = d.concat(dataBuffer); require("Storage").writeJSON(STORAGE_FILE, d); dataBuffer = [];
    }
    Bangle.setHRMPower(0, "sleeplogger"); Bangle.setCompassPower(0, "sleeplogger");
    isCurrentlyLogging = false;
  }
  function checkState() {
    let s = require("Storage").readJSON(SETTINGS_FILE, true) || {};
    if (s.isLogging) { if (!isCurrentlyLogging) startLogging(); }
    else { if (isCurrentlyLogging) stopLogging(); }
  }
  setInterval(checkState, 300000); checkState();

  // Android Communication Listener
  NRF.on('data', function(data) {
    if (data.trim() === "\x10loadsleep") {
      let file = require("Storage").read(STORAGE_FILE);
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
