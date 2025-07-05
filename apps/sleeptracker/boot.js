// File: sleeptracker.boot.js (Final Production Version)
// Purpose: Handles all background tasks: logging and communication.

(function() {
  const STORAGE_FILE = 'sleeptracker.data.json';
  const SETTINGS_FILE = 'sleeptracker.settings.json';
  const LOG_INTERVAL_MS = 60000;

  let logInterval, dataBuffer = [], isCurrentlyLogging = false;
  let lastMovement = {x:0,y:0,z:0}, currentMovement = 0, lastHR = 0;
  Bangle.on('HRM', hrm => { if (hrm.confidence > 80) lastHR = hrm.bpm; });
  Bangle.on('accel', acc => {
    let m=Math.abs(acc.x-lastMovement.x)+Math.abs(acc.y-lastMovement.y)+Math.abs(acc.z-lastMovement.z);
    currentMovement += m; lastMovement = acc;
  });

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
    Bangle.setHRMPower(1, "sleeptracker"); Bangle.setCompassPower(1, "sleeptracker");
    lastMovement = Bangle.getAccel(); logInterval = setInterval(logData, LOG_INTERVAL_MS);
    isCurrentlyLogging = true;
  }
  function stopLogging() {
    clearInterval(logInterval); logInterval = undefined;
    if (dataBuffer.length > 0) {
      let d = require("Storage").readJSON(STORAGE_FILE, true) || [];
      d = d.concat(dataBuffer); require("Storage").writeJSON(STORAGE_FILE, d); dataBuffer = [];
    }
    Bangle.setHRMPower(0, "sleeptracker"); Bangle.setCompassPower(0, "sleeptracker");
    isCurrentlyLogging = false;
  }
  function checkState() {
    let s = require("Storage").readJSON(SETTINGS_FILE, true) || {};
    if (s.isLogging) { if (!isCurrentlyLogging) startLogging(); }
    else { if (isCurrentlyLogging) stopLogging(); }
  }
  setInterval(checkState, 300000); checkState();

  // Android Communication Listener
  let receiveBuffer = "";
  NRF.on('data', function(data) {
    receiveBuffer += data;
    let EOT = '\x04', newlineIndex = receiveBuffer.indexOf('\n');
    while (newlineIndex >= 0) {
      let command = receiveBuffer.substring(0, newlineIndex).trim();
      receiveBuffer = receiveBuffer.substring(newlineIndex + 1);
      if (command.includes("loadsleep")) {
        let file = require("Storage").read(STORAGE_FILE);
        if (file) {
          let pos=0, chunkSize=20;
          let sender = () => {
            if (pos >= file.length) { Bluetooth.write(EOT); return; }
            let chunk = file.substring(pos, pos + chunkSize); pos += chunkSize;
            Bluetooth.write(chunk).then(sender).catch(() => {});
          };
          sender();
        } else { Bluetooth.write("ERROR: No sleep data" + EOT); }
      }
      newlineIndex = receiveBuffer.indexOf('\n');
    }
  });
})();
