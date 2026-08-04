/**
 * Web Serial API Hardware Driver & Transport Layer
 * @module services/SerialTransport
 */

export class SerialTransport {
  constructor(onChunkReceived) {
    this.onChunk = onChunkReceived;
    this.port = null;
    this.reader = null;
    this.isConnected = false;
  }

  isSupported() {
    return 'serial' in navigator;
  }

  async connect(baudRate = 9600) {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;

      const decoder = new TextDecoderStream();
      this.port.readable.pipeTo(decoder.writable);
      this.reader = decoder.readable.getReader();

      this.startReadLoop();
      return true;
    } catch (err) {
      this.isConnected = false;
      throw err;
    }
  }

  async startReadLoop() {
    let buffer = '';
    while (this.isConnected && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) {
          this.reader.releaseLock();
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Retain incomplete chunk

          for (const line of lines) {
            const clean = line.trim();
            if (clean && this.onChunk) {
              this.onChunk(clean);
            }
          }
        }
      } catch (err) {
        console.error('Serial read stream error:', err);
        break;
      }
    }
    await this.disconnect();
  }

  async sendCommand(commandString) {
    if (!this.port || !this.port.writable) {
      return false;
    }
    const encoder = new TextEncoder();
    const writer = this.port.writable.getWriter();
    await writer.write(encoder.encode(commandString + '\n'));
    writer.releaseLock();
    return true;
  }

  async disconnect() {
    this.isConnected = false;
    if (this.reader) {
      try { await this.reader.cancel(); } catch (e) {}
      this.reader = null;
    }
    if (this.port) {
      try { await this.port.close(); } catch (e) {}
      this.port = null;
    }
  }
}
