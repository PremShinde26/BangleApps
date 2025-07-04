// This script needs to know the name of the settings file to check.
(function() {
  const STORAGE_FILE = 'sleepdata.json';
  const SETTINGS_FILE = 'sleeptracker.settings.json'; // *** THIS LINE IS UPDATED ***
  const LOG_INTERVAL_MS = 60000;
  let logInterval; let dataBuffer = []; let isCurrentlyLogging = false;
  let lastMovement = { x: 0, y: 0, z: 0 }; let currentMovement = 0; let lastHR = 0;
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
        let d = require("Storage").readJSON(STORAGE_FILE, true) || []; d = d.concat(dataBuffer);
        require("Storage").writeJSON(STORAGE_FILE, d); dataBuffer = [];
      }
    }
  }
  function startLogging() {
    Bangle.setHRMPower(1, "sleeptrack"); Bangle.setCompassPower(1, "sleeptrack");
    lastMovement = Bangle.getAccel(); logInterval = setInterval(logData, LOG_INTERVAL_MS); isCurrentlyLogging = true;
  }
  function stopLogging() {
    clearInterval(logInterval); logInterval = undefined;
    if (dataBuffer.length > 0) {
      let d = require("Storage").readJSON(STORAGE_FILE, true) || []; d = d.concat(dataBuffer);
      require("Storage").writeJSON(STORAGE_FILE, d); dataBuffer = [];
    }
    Bangle.setHRMPower(0, "sleeptrack"); Bangle.setCompassPower(0, "sleeptrack"); isCurrentlyLogging = false;
  }
  function checkState() {
    let settings = require("Storage").readJSON(SETTINGS_FILE, true) || {};
    if (settings.isLogging) { if (!isCurrentlyLogging) startLogging(); }
    else { if (isCurrentlyLogging) stopLogging(); }
  }
  setInterval(checkState, 5 * 60 * 1000); checkState();
})();
