/**
 * MediaDevices WebCam API Live Video Stream & HUD Component
 * @module components/StreamEngine
 */

export class StreamEngine {
  constructor() {
    this.stream = null;
    this.videoEl = null;
    this.isStreaming = false;
  }

  init() {
    this.videoEl = document.getElementById('video-element');
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
        this.videoEl.play();
      }
      this.isStreaming = true;
      return true;
    } catch (err) {
      console.warn('Camera stream warning:', err);
      return false;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
    this.isStreaming = false;
  }
}
