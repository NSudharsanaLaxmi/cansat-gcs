/**
 * Utility functions for numeric formatting, time strings, and telemetry validation.
 * @module utils/formatters
 */

/**
 * Formats seconds integer into HH:MM:SS string.
 * @param {number} totalSeconds 
 * @returns {string}
 */
export function formatMET(totalSeconds) {
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

/**
 * Clamps a numeric value within min and max boundaries.
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Calculates barometric altitude from sea-level pressure and measured pressure.
 * @param {number} pressurehPa 
 * @param {number} seaLevelhPa 
 * @returns {number}
 */
export function calculateBaroAltitude(pressurehPa, seaLevelhPa = 1013.25) {
  return 44330.0 * (1.0 - Math.pow(pressurehPa / seaLevelhPa, 0.1903));
}
