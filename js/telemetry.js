/* ==========================================================================
   Telemetry Processing & 4-Digit Error Code Logic
   ========================================================================== */

class TelemetryProcessor {
  constructor() {
    this.packetCount = 0;
    this.logs = [];
    this.manualSeparated = false;
    this.emergencyParachute = false;
    this.separationFailed = false;
    this.gpsFailed = false;
    this.highDescentRate = false;
  }

  resetCounter() {
    this.packetCount = 0;
    this.logs = [];
  }

  parsePacket(rawString) {
    // Expected CSV format:
    // TEAM_ID,PACKET_COUNT,TIME,CONT_ALT,PAY_ALT,PRESS,TEMP,VOLT,DESCENT_RATE,LAT,LNG,SATS,PITCH,ROLL,YAW,ERROR_CODE
    if (!rawString || typeof rawString !== 'string') return null;

    const parts = rawString.trim().split(',');
    if (parts.length < 10) return null;

    const packet = {
      teamId: parts[0] || 'ISL-CANSAT-1024',
      packetCount: parseInt(parts[1], 10) || ++this.packetCount,
      time: parts[2] || new Date().toLocaleTimeString(),
      containerAlt: parseFloat(parts[3]) || 0.0,
      payloadAlt: parseFloat(parts[4]) || 0.0,
      pressure: parseFloat(parts[5]) || 1013.25,
      temp: parseFloat(parts[6]) || 24.5,
      voltage: parseFloat(parts[7]) || 7.4,
      descentRate: parseFloat(parts[8]) || 0.0,
      gpsLat: parseFloat(parts[9]) || 28.6139,
      gpsLng: parseFloat(parts[10]) || 77.2090,
      gpsSats: parseInt(parts[11], 10) || 8,
      pitch: parseFloat(parts[12]) || 0.0,
      roll: parseFloat(parts[13]) || 0.0,
      yaw: parseFloat(parts[14]) || 0.0,
      errorCode: parts[15] || '0000',
      flightState: parts[16] || 'DESCENT'
    };

    // Calculate dynamic 4-Digit Error Code based on telemetry & override flags
    packet.errorCode = this.computeErrorCode(packet);

    this.logs.push(packet);
    if (this.logs.length > 500) this.logs.shift(); // Keep last 500 packets in buffer

    return packet;
  }

  computeErrorCode(packet) {
    // Digit 1: Descent Rate (0 = Safe 8–10 m/s, 1 = Outside safe range)
    let d1 = '0';
    if (this.highDescentRate || packet.descentRate < 7.0 || packet.descentRate > 11.0) {
      if (packet.payloadAlt > 20 && packet.flightState === 'DESCENT') {
        d1 = '1';
      }
    }

    // Digit 2: GPS Availability (0 = Available, 1 = Unavailable)
    let d2 = '0';
    if (this.gpsFailed || packet.gpsSats < 4 || (packet.gpsLat === 0 && packet.gpsLng === 0)) {
      d2 = '1';
    }

    // Digit 3: Payload Separation (0 = Separated successfully, 1 = Failure)
    let d3 = '0';
    if (this.separationFailed) {
      d3 = '1';
    }

    // Digit 4: Emergency Parachute (0 = Inactive, 1 = Activated)
    let d4 = '0';
    if (this.emergencyParachute) {
      d4 = '1';
    }

    return `${d1}${d2}${d3}${d4}`;
  }
}

window.telemetryProcessor = new TelemetryProcessor();
