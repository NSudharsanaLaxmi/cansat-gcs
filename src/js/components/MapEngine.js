/**
 * Leaflet GPS Live Tracking & Vector Trajectory Engine
 * @module components/MapEngine
 */

import { SYSTEM_CONFIG } from '../config.js';

export class MapEngine {
  constructor() {
    this.map = null;
    this.payloadMarker = null;
    this.trajectoryPolyline = null;
    this.path = [];
  }

  init() {
    const lat = SYSTEM_CONFIG.GROUND_STATION.LATITUDE;
    const lng = SYSTEM_CONFIG.GROUND_STATION.LONGITUDE;

    this.map = L.map('leaflet-map').setView([lat, lng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(this.map);

    const icon = L.divIcon({
      className: 'cansat-marker',
      html: `<div style="background:#00f0ff; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #00f0ff;"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7]
    });

    this.payloadMarker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(`<b>${SYSTEM_CONFIG.TEAM_ID}</b><br>Telemetry active`);

    this.trajectoryPolyline = L.polyline([], {
      color: '#00f0ff',
      weight: 3,
      opacity: 0.8,
      dashArray: '4, 6'
    }).addTo(this.map);
  }

  update(packet) {
    if (!this.map || packet.gpsLat === 0 || packet.gpsLng === 0) return;

    const coords = [packet.gpsLat, packet.gpsLng];
    this.payloadMarker.setLatLng(coords);
    this.payloadMarker.getPopup().setContent(`
      <b>Payload Vector</b><br>
      Alt: ${packet.payloadAlt.toFixed(1)} m<br>
      Sats: ${packet.gpsSats}<br>
      State: ${packet.flightState}
    `);

    this.path.push(coords);
    this.trajectoryPolyline.setLatLngs(this.path);
    this.map.panTo(coords, { animate: true, duration: 0.4 });
  }

  reset() {
    this.path = [];
    if (this.trajectoryPolyline) {
      this.trajectoryPolyline.setLatLngs([]);
    }
  }
}
