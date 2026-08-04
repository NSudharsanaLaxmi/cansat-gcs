/* ==========================================================================
   Telemetry CSV Exporter & Canvas Graph PNG Capture Utilities
   ========================================================================== */

class Exporter {
  exportCSV() {
    const logs = window.telemetryProcessor ? window.telemetryProcessor.logs : [];
    if (!logs || logs.length === 0) {
      alert("No telemetry logs available to export.");
      return;
    }

    const headers = [
      'Team_ID',
      'Packet_Count',
      'Mission_Time',
      'Container_Alt_m',
      'Payload_Alt_m',
      'Pressure_hPa',
      'Temp_C',
      'Voltage_V',
      'Descent_Rate_ms',
      'GPS_Lat',
      'GPS_Lng',
      'GPS_Sats',
      'Pitch_deg',
      'Roll_deg',
      'Yaw_deg',
      'Error_Code',
      'Flight_State'
    ];

    const csvRows = [headers.join(',')];

    logs.forEach(pkt => {
      const row = [
        pkt.teamId,
        pkt.packetCount,
        pkt.time,
        pkt.containerAlt,
        pkt.payloadAlt,
        pkt.pressure,
        pkt.temp,
        pkt.voltage,
        pkt.descentRate,
        pkt.gpsLat,
        pkt.gpsLng,
        pkt.gpsSats,
        pkt.pitch,
        pkt.roll,
        pkt.yaw,
        pkt.errorCode,
        pkt.flightState
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `CanSat_Telemetry_Log_${timestamp}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportGraph() {
    const graphCard = document.getElementById('card-graphs');
    if (!graphCard) return;

    // Get the first canvas element from chart panel
    const canvas = document.getElementById('chart-altitude');
    if (!canvas) {
      alert("No chart available to export.");
      return;
    }

    const imageURI = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageURI;
    link.download = `CanSat_Telemetry_Graph_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.exporter = new Exporter();
