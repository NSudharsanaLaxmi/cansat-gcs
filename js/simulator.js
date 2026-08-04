/* ==========================================================================
   Real-Time CanSat Telemetry Flight Simulator
   ========================================================================== */

class TelemetrySimulator {
  constructor(onPacketCallback) {
    this.onPacket = onPacketCallback;
    this.isRunning = false;
    this.intervalId = null;
    
    // Flight State Tracking
    this.packetCount = 0;
    this.timeSeconds = 0;
    this.alt = 0.0;
    this.payloadAlt = 0.0;
    this.pressure = 1013.25;
    this.temp = 24.5;
    this.voltage = 8.4; // 2S LiPo battery starting at 8.4V
    this.descentRate = 0.0;
    this.state = 'PRE_LAUNCH'; // PRE_LAUNCH, ASCENT, SEPARATION, DESCENT, LANDED
    
    // GPS Starting Coordinates (New Delhi / ISL Ground Station base)
    this.lat = 28.6139;
    this.lng = 77.2090;
    
    // Gyro
    this.pitch = 0.0;
    this.roll = 0.0;
    this.yaw = 0.0;
    
    // Profiles
    this.selectedProfile = 'nominal';
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000); // 1 Hz telemetry loop
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.packetCount = 0;
    this.timeSeconds = 0;
    this.alt = 0.0;
    this.payloadAlt = 0.0;
    this.pressure = 1013.25;
    this.temp = 24.5;
    this.voltage = 8.4;
    this.descentRate = 0.0;
    this.state = 'PRE_LAUNCH';
    this.pitch = 0.0;
    this.roll = 0.0;
    this.yaw = 0.0;
  }

  tick() {
    this.packetCount++;
    this.timeSeconds++;
    
    // Battery Drain
    this.voltage = Math.max(6.4, this.voltage - 0.002);
    
    // Flight Profile State Machine
    if (this.timeSeconds < 5) {
      this.state = 'PRE_LAUNCH';
      this.alt = 0.0;
      this.payloadAlt = 0.0;
      this.descentRate = 0.0;
    } else if (this.timeSeconds >= 5 && this.timeSeconds < 25) {
      this.state = 'ASCENT';
      this.alt += 35.0 + (Math.random() * 2 - 1);
      this.payloadAlt = this.alt;
      this.descentRate = -35.0;
      this.pitch = 85.0 + (Math.random() * 4 - 2);
      this.roll += Math.random() * 5;
    } else if (this.timeSeconds >= 25 && this.timeSeconds < 28) {
      this.state = 'SEPARATION';
      this.alt = 700.0;
      this.payloadAlt = 698.0;
      this.descentRate = 0.0;
      this.pitch = 10.0;
      this.roll = 25.0;
    } else if (this.alt > 0) {
      this.state = 'DESCENT';
      
      // Calculate descent rate based on profile / fault overrides
      let baseRate = 8.8 + (Math.random() * 0.6 - 0.3); // Safe rate 8-10 m/s
      if (window.telemetryProcessor.highDescentRate || this.selectedProfile === 'high-descent') {
        baseRate = 16.5 + (Math.random() * 2.0); // Fault rate >10 m/s
      }
      if (window.telemetryProcessor.emergencyParachute) {
        baseRate = 4.2 + (Math.random() * 0.4); // Parachute deployed -> slow rate ~4 m/s
      }
      
      this.descentRate = baseRate;
      this.alt = Math.max(0, this.alt - this.descentRate);
      
      // Container vs Payload altitude separation
      if (window.telemetryProcessor.manualSeparated || this.state === 'DESCENT') {
        this.payloadAlt = Math.max(0, this.alt - (Math.random() * 3));
      } else {
        this.payloadAlt = this.alt;
      }

      // Gyro tumbling during descent
      this.pitch = Math.sin(this.timeSeconds * 0.5) * 20.0;
      this.roll = Math.cos(this.timeSeconds * 0.6) * 35.0;
      this.yaw = (this.yaw + 3.0) % 360;

      // Simulated Drift GPS Movement
      this.lat += 0.00008;
      this.lng += 0.00005;

      if (this.alt <= 0) {
        this.state = 'LANDED';
        this.alt = 0;
        this.payloadAlt = 0;
        this.descentRate = 0;
        this.pitch = 0;
        this.roll = 0;
      }
    }

    // Barometric Pressure Equation: P = P0 * exp(-h / 8400)
    this.pressure = 1013.25 * Math.exp(-this.alt / 8400.0);
    
    // Temperature lapse rate (approx -6.5°C per 1000m)
    this.temp = 24.5 - (this.alt / 1000.0) * 6.5 + (Math.random() * 0.2 - 0.1);

    // Format Time string
    const hrs = String(Math.floor(this.timeSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((this.timeSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(this.timeSeconds % 60).padStart(2, '0');
    const timeStr = `${hrs}:${mins}:${secs}`;

    // GPS Sats override check
    let sats = 9;
    let currentLat = this.lat;
    let currentLng = this.lng;
    if (window.telemetryProcessor.gpsFailed || this.selectedProfile === 'gps-loss') {
      sats = 2; // Lost GPS fix
      currentLat = 0.0;
      currentLng = 0.0;
    }

    // Build Telemetry CSV String
    const packetStr = `ISL-CANSAT-1024,${this.packetCount},${timeStr},${this.alt.toFixed(1)},${this.payloadAlt.toFixed(1)},${this.pressure.toFixed(1)},${this.temp.toFixed(1)},${this.voltage.toFixed(2)},${this.descentRate.toFixed(1)},${currentLat.toFixed(6)},${currentLng.toFixed(6)},${sats},${this.pitch.toFixed(1)},${this.roll.toFixed(1)},${this.yaw.toFixed(1)},0000,${this.state}`;

    if (this.onPacket) {
      this.onPacket(packetStr);
    }
  }
}

window.TelemetrySimulator = TelemetrySimulator;
