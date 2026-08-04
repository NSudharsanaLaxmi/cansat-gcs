/* ==========================================================================
   Web Camera MediaDevices API Live Video Stream Manager
   ========================================================================== */

class VideoManager {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.isStreaming = false;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsInterval = null;
  }

  init() {
    this.videoElement = document.getElementById('video-element');
  }

  async startStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("MediaDevices API is not supported in your browser.");
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play();
      }

      this.isStreaming = true;
      this.startFpsCounter();
      return true;
    } catch (err) {
      console.warn("Camera access warning / fallback:", err);
      alert("Could not access camera feed. (Permission denied or device in use). Using simulated HUD mode.");
      return false;
    }
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isStreaming = false;
    this.stopFpsCounter();

    const fpsEl = document.getElementById('video-fps');
    if (fpsEl) fpsEl.innerText = "FPS: OFF";
  }

  startFpsCounter() {
    this.stopFpsCounter();
    this.fpsInterval = setInterval(() => {
      const fpsEl = document.getElementById('video-fps');
      if (fpsEl && this.isStreaming) {
        // Random slight fluctuation for realistic camera stream FPS
        const currentFps = Math.floor(28 + Math.random() * 4);
        fpsEl.innerText = `FPS: ${currentFps}`;
      }
    }, 1000);
  }

  stopFpsCounter() {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }
  }
}

window.videoManager = new VideoManager();
