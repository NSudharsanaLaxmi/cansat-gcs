/**
 * CanSat Ground Control Software - System Configuration & Constants
 * @module config
 */

export const SYSTEM_CONFIG = {
  TEAM_ID: 'ISL-CANSAT-1024',
  DEFAULT_BAUD_RATE: 9600,
  TELEMETRY_HZ: 1.0,
  BUFFER_MAX_PACKETS: 1000,
  GRAPH_ROLLING_WINDOW: 40,
  GROUND_STATION: {
    LATITUDE: 28.6139,
    LONGITUDE: 77.2090,
    ALTITUDE: 216.0, // meters MSL
    NAME: 'ISL Ground Station New Delhi'
  }
};

export const FLIGHT_PHASES = Object.freeze({
  PRE_LAUNCH: 'PRE_LAUNCH',
  ASCENT: 'ASCENT',
  SEPARATION: 'SEPARATION',
  DESCENT: 'DESCENT',
  LANDED: 'LANDED'
});

export const FAULT_MASK = Object.freeze({
  DESCENT_RATE: 0b1000,
  GPS_LOSS:     0b0100,
  SEPARATION:   0b0010,
  PARACHUTE:    0b0001
});
