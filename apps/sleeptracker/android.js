// File: android.boot.js (Version 3 - Can send AND receive files)
 /*
(function() {
  NRF.setAdvertising({}, { showName: true, uart: true });

  let receiveBuffer = ""; // Buffer to store incoming file data
  let isReceivingFile = false;

  NRF.on('data', function(data) {
    // Check for a command if we are not in the middle of receiving a file
    if (!isReceivingFile) {
      let command = data.trim();
      
      if (command === "\x10loadsleep") {
        // --- SENDING LOGIC (unchanged) ---
        let file = require("Storage").read("sleepdata.json");
        if (file) {
          let chunk_size = 20;
          let current_pos = 0;
          function sendChunk() {
            if (current_pos >= file.length) {
              Bluetooth.write("\x04\n"); return;
            }
            let chunk = file.substring(current_pos, current_pos + chunk_size);
            current_pos += chunk_size;
            Bluetooth.write(chunk).then(sendChunk).catch(() => {});
          }
          sendChunk();
        } else {
          Bluetooth.write("ERROR: sleepdata.json not found\n\x04\n");
        }
        
      } else if (command === "\x10receivesleep") {
        // --- NEW RECEIVING LOGIC ---
        // Acknowledges the command and prepares to receive data
        isReceivingFile = true;
        receiveBuffer = "";
        Bluetooth.write("OK_READY\n"); // Tell the app we are ready
      }
      
    } else {
      // We are in file-receiving mode, so append all data
      receiveBuffer += data;
      
      // Check if the End-of-Transmission character is in the buffer
      let eotIndex = receiveBuffer.indexOf("\x04");
      if (eotIndex !== -1) {
        // We found the end of the file
        let finalJson = receiveBuffer.substring(0, eotIndex);
        
        // Write the received data to the analyzed file
        require("Storage").write('sleepdata.analyzed.json', finalJson);
        
        // Reset state
        isReceivingFile = false;
        receiveBuffer = "";
        
        // Optional: Send a confirmation back to the app
        Bluetooth.write("OK_SAVED\n");
      }
    }
  });
})();
*/ 
