/**
 * Telemetry Packet Parser & Dynamic 4-Digit Error Diagnostic System
 * @module services/TelemetryParser
 */

export class TelemetryParser {
  constructor() {
    this.logs = [];
    this.overrides = {
      descentRateFault: false,
      gpsFault: false,
      separationFault: false,
      parachuteActive: false,
      manualSeparated: false
    };
  }

  setOverride(key, value) {
    if (key in this.overrides) {
      this.overrides[key] = Boolean(value);
    }
  }

  parse(rawCsvString) {
    if (typeof rawCsvString !== 'string' || !rawCsvString.trim()) {
      return null;
    }

    const tokens = rawCsvString.trim().split(',');
    if (tokens.length < 10) {
      return null;
    }

    const packet = {
      teamId: tokens[0] || 'ISL-CANSAT-1024',
      packetCount: parseInt(tokens[1], 10) || (this.logs.length + 1),
      timeStr: tokens[2] || new Date().toLocaleTimeString('en-US', { hour12: false }),
      containerAlt: parseFloat(tokens[3]) || 0.0,
      payloadAlt: parseFloat(tokens[4]) || 0.0,
      pressure: parseFloat(tokens[5]) || 1013.25,
      temp: parseFloat(tokens[6]) || 24.5,
      voltage: parseFloat(tokens[7]) || 7.4,
      descentRate: parseFloat(tokens[8]) || 0.0,
      gpsLat: parseFloat(tokens[9]) || 0.0,
      gpsLng: parseFloat(tokens[10]) || 0.0,
      gpsSats: parseInt(tokens[11], 10) || 0,
      pitch: parseFloat(tokens[12]) || 0.0,
      roll: parseFloat(tokens[13]) || 0.0,
      yaw: parseFloat(tokens[14]) || 0.0,
      errorCode: tokens[15] || '0000',
      flightState: tokens[16] || 'DESCENT'
    };

    packet.errorCode = this.computeErrorCode(packet);
    
    this.logs.push(packet);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    return packet;
  }

  /**
   * Computes the 4-digit error string based on sensor bounds and fault flags.
   * Digit 1: Descent Rate (0 = 8–10 m/s safe, 1 = Fault)
   * Digit 2: GPS Lock (0 = OK, 1 = Lost)
   * Digit 3: Separation (0 = OK, 1 = Fail)
   * Digit 4: Parachute (0 = Inactive, 1 = Active)
   * @param {Object} packet 
   * @returns {string} 4-digit binary string e.g. "0000"
   */
  computeErrorCode(packet) {
    let d1 = '0';
    if (this.overrides.descentRateFault || (packet.flightState === 'DESCENT' && packet.payloadAlt > 15 && (packet.descentRate < 7.0 || packet.descentRate > 11.0))) {
      d1 = '1';
    }

    let d2 = '0';
    if (this.overrides.gpsFault || packet.gpsSats < 4 || (packet.gpsLat === 0 && packet.gpsLng === 0)) {
      d2 = '1';
    }

    let d3 = '0';
    if (this.overrides.separationFault) {
      d3 = '1';
    }

    let d4 = '0';
    if (this.overrides.parachuteActive) {
      d4 = '1';
    }

    return `${d1}${d2}${d3}${d4}`;
  }

  clear() {
    this.logs = [];
  }
}
