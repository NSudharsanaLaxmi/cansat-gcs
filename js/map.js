/* ==========================================================================
   Leaflet.js Live GPS Map Tracking & Trajectory Path
   ========================================================================== */

class MapManager {
  constructor() {
    this.map = null;
    this.marker = null;
    this.groundStationMarker = null;
    this.trajectoryPolyline = null;
    this.pathCoordinates = [];
  }

  init() {
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;

    // Initialize Map with dark tiles
    this.map = L.map('leaflet-map').setView([defaultLat, defaultLng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    // Custom Icon for CanSat Payload
    const cansatIcon = L.divIcon({
      className: 'cansat-leaflet-marker',
      html: `<div style="background-color:#00f0ff; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #00f0ff; animation: pulse-dot 1.5s infinite;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    // Custom Icon for Ground Station
    const gsIcon = L.divIcon({
      className: 'gs-leaflet-marker',
      html: `<div style="background-color:#3b82f6; width:12px; height:12px; border-radius:2px; border:2px solid #fff; box-shadow:0 0 8px #3b82f6;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    // Add Ground Station Marker
    this.groundStationMarker = L.marker([defaultLat, defaultLng], { icon: gsIcon })
      .addTo(this.map)
      .bindPopup('<b>ISL Ground Control Station</b><br>Launch Reference Point');

    // Add Payload Marker
    this.marker = L.marker([defaultLat, defaultLng], { icon: cansatIcon })
      .addTo(this.map)
      .bindPopup('<b>CanSat Payload</b><br>Telemetry active');

    // Initialize Trajectory Line
    this.trajectoryPolyline = L.polyline([], {
      color: '#00f0ff',
      weight: 3,
      opacity: 0.8,
      dashArray: '4, 6'
    }).addTo(this.map);
  }

  update(packet) {
    if (!this.map || packet.gpsLat === 0 || packet.gpsLng === 0) return;

    const newPos = [packet.gpsLat, packet.gpsLng];
    this.marker.setLatLng(newPos);
    this.marker.getPopup().setContent(`
      <b>CanSat Payload</b><br>
      Alt: ${packet.payloadAlt.toFixed(1)} m<br>
      State: ${packet.flightState}<br>
      Sats: ${packet.gpsSats}
    `);

    // Append to trajectory path
    this.pathCoordinates.push(newPos);
    this.trajectoryPolyline.setLatLngs(this.pathCoordinates);

    // Pan map smoothly to follow payload
    this.map.panTo(newPos, { animate: true, duration: 0.5 });

    // Update Coordinate HUD text
    const coordsEl = document.getElementById('map-coords');
    if (coordsEl) {
      coordsEl.innerText = `Lat: ${packet.gpsLat.toFixed(4)}°, Lng: ${packet.gpsLng.toFixed(4)}°`;
    }
  }

  clear() {
    this.pathCoordinates = [];
    if (this.trajectoryPolyline) {
      this.trajectoryPolyline.setLatLngs([]);
    }
  }
}

window.mapManager = new MapManager();
