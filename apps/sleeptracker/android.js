// File: android.boot.js (Corrected Version)
// Purpose: Advertises Nordic UART and serves sleepdata.json on command

(function() {
  // ✅ Advertise UART service properly
  NRF.setServices(undefined, { uart: true });

  NRF.on('data', function(data) {
    let command = data.trim();

    if (command === "\x10loadsleep") {
      let file = require("Storage").read("sleepdata.json");

      if (file) {
        let chunk_size = 20;
        let current_pos = 0;

        // ✅ FIXED: Using a function expression (arrow function)
        // This is block-scoped and avoids the warning.
        const sendChunk = () => {
          if (current_pos >= file.length) {
            Bluetooth.write("\x04\n"); // EOT
            return;
          }

          let chunk = file.substring(current_pos, current_pos + chunk_size);
          current_pos += chunk_size;

          Bluetooth.write(chunk).then(sendChunk).catch(() => {});
        };

        sendChunk();

      } else {
        Bluetooth.write("ERROR: sleepdata.json not found\n\x04\n");
      }
    }
  });
})();
