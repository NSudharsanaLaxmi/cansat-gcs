/* ==========================================================================
   Web Serial API Manager (Microcontroller USB Connectivity)
   ========================================================================== */

class SerialManager {
  constructor(onDataCallback) {
    this.onData = onDataCallback;
    this.port = null;
    this.reader = null;
    this.isConnected = false;
  }

  isSupported() {
    return 'serial' in navigator;
  }

  async connect(baudRate = 9600) {
    if (!this.isSupported()) {
      alert("Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return false;
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      this.reader = reader;

      this.readLoop(reader);
      return true;
    } catch (err) {
      console.error("Serial Connection Error:", err);
      this.isConnected = false;
      return false;
    }
  }

  async readLoop(reader) {
    let buffer = '';
    while (true) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep last partial line in buffer

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine && this.onData) {
              this.onData(cleanLine);
            }
          }
        }
      } catch (err) {
        console.error("Error reading serial stream:", err);
        break;
      }
    }
    this.disconnect();
  }

  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    this.isConnected = false;
  }
}

window.SerialManager = SerialManager;
