/**
 * Physics-Engine Telemetry Flight Simulator
 * @module services/FlightSimulator
 */

import { SYSTEM_CONFIG, FLIGHT_PHASES } from '../config.js';

export class FlightSimulator {
  constructor(onPacketEmitted) {
    this.onPacket = onPacketEmitted;
    this.isActive = false;
    this.intervalId = null;
    this.profile = 'nominal';
    this.reset();
  }

  reset() {
    this.stop();
    this.packetCount = 0;
    this.elapsedSeconds = 0;
    this.containerAlt = 0.0;
    this.payloadAlt = 0.0;
    this.pressure = 1013.25;
    this.temp = 24.5;
    this.voltage = 8.4;
    this.descentRate = 0.0;
    this.state = FLIGHT_PHASES.PRE_LAUNCH;
    this.lat = SYSTEM_CONFIG.GROUND_STATION.LATITUDE;
    this.lng = SYSTEM_CONFIG.GROUND_STATION.LONGITUDE;
    this.pitch = 0.0;
    this.roll = 0.0;
    this.yaw = 0.0;
  }

  setProfile(profileName) {
    this.profile = profileName;
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.intervalId = setInterval(() => this.step(), 1000 / SYSTEM_CONFIG.TELEMETRY_HZ);
  }

  stop() {
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  step() {
    this.packetCount++;
    this.elapsedSeconds++;

    // Discharge 2S LiPo battery gradually
    this.voltage = Math.max(6.4, this.voltage - 0.0015);

    // State machine calculation
    if (this.elapsedSeconds < 5) {
      this.state = FLIGHT_PHASES.PRE_LAUNCH;
      this.containerAlt = 0.0;
      this.payloadAlt = 0.0;
      this.descentRate = 0.0;
    } else if (this.elapsedSeconds >= 5 && this.elapsedSeconds < 25) {
      this.state = FLIGHT_PHASES.ASCENT;
      this.containerAlt += 35.0 + (Math.random() * 2 - 1);
      this.payloadAlt = this.containerAlt;
      this.descentRate = -35.0;
      this.pitch = 85.0 + (Math.random() * 4 - 2);
      this.roll += Math.random() * 4;
    } else if (this.elapsedSeconds >= 25 && this.elapsedSeconds < 28) {
      this.state = FLIGHT_PHASES.SEPARATION;
      this.containerAlt = 700.0;
      this.payloadAlt = 698.0;
      this.descentRate = 0.0;
      this.pitch = 12.0;
      this.roll = 20.0;
    } else if (this.containerAlt > 0) {
      this.state = FLIGHT_PHASES.DESCENT;
      
      let rate = 8.8 + (Math.random() * 0.4 - 0.2); // Safe descent rate
      if (this.profile === 'high-descent') {
        rate = 16.2 + Math.random(); // High descent rate fault
      }

      this.descentRate = rate;
      this.containerAlt = Math.max(0, this.containerAlt - this.descentRate);
      this.payloadAlt = Math.max(0, this.containerAlt - 2.0);

      // Gyroscopic attitude dynamics
      this.pitch = Math.sin(this.elapsedSeconds * 0.4) * 18.0;
      this.roll = Math.cos(this.elapsedSeconds * 0.5) * 30.0;
      this.yaw = (this.yaw + 2.5) % 360;

      // Simulated wind drift GPS delta
      this.lat += 0.00007;
      this.lng += 0.00004;

      if (this.containerAlt <= 0) {
        this.state = FLIGHT_PHASES.LANDED;
        this.containerAlt = 0;
        this.payloadAlt = 0;
        this.descentRate = 0;
      }
    }

    // Barometric Equation & Temperature Lapse Rate
    this.pressure = 1013.25 * Math.exp(-this.containerAlt / 8400.0);
    this.temp = 24.5 - (this.containerAlt / 1000.0) * 6.5;

    // Time formatting
    const timeStr = new Date(this.elapsedSeconds * 1000).toISOString().substr(11, 8);

    let sats = 9;
    let latOut = this.lat;
    let lngOut = this.lng;
    if (this.profile === 'gps-loss') {
      sats = 2;
      latOut = 0.0;
      lngOut = 0.0;
    }

    const csvPacket = `${SYSTEM_CONFIG.TEAM_ID},${this.packetCount},${timeStr},${this.containerAlt.toFixed(1)},${this.payloadAlt.toFixed(1)},${this.pressure.toFixed(1)},${this.temp.toFixed(1)},${this.voltage.toFixed(2)},${this.descentRate.toFixed(1)},${latOut.toFixed(6)},${lngOut.toFixed(6)},${sats},${this.pitch.toFixed(1)},${this.roll.toFixed(1)},${this.yaw.toFixed(1)},0000,${this.state}`;

    if (this.onPacket) {
      this.onPacket(csvPacket);
    }
  }
}
