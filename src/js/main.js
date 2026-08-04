/**
 * Main Application Orchestrator & Dependency Injection Entry Point
 * @module main
 */

import { SYSTEM_CONFIG } from './config.js';
import { TelemetryParser } from './services/TelemetryParser.js';
import { SerialTransport } from './services/SerialTransport.js';
import { FlightSimulator } from './services/FlightSimulator.js';
import { ChartEngine } from './components/ChartEngine.js';
import { MapEngine } from './components/MapEngine.js';
import { OrientationEngine } from './components/OrientationEngine.js';
import { StreamEngine } from './components/StreamEngine.js';

class GroundControlApplication {
  constructor() {
    this.parser = new TelemetryParser();
    this.chartEngine = new ChartEngine();
    this.mapEngine = new MapEngine();
    this.orientationEngine = new OrientationEngine();
    this.streamEngine = new StreamEngine();

    this.simulator = new FlightSimulator((pkt) => this.onTelemetryReceived(pkt));
    this.serial = new SerialTransport((pkt) => this.onTelemetryReceived(pkt));

    this.pendingModalCommand = null;
  }

  init() {
    console.log('[GCS] Initializing India Space Lab Ground Control Software Engine...');

    this.chartEngine.init();
    this.mapEngine.init();
    this.orientationEngine.init();
    this.streamEngine.init();

    this.bindUI();

    // Auto-start simulation for continuous telemetry stream
    setTimeout(() => {
      this.simulator.start();
      document.getElementById('btn-start-telemetry').disabled = true;
      document.getElementById('btn-stop-telemetry').disabled = false;
      this.setLinkStatus('SIMULATOR ACTIVE', 'ok');
    }, 500);
  }

  bindUI() {
    // Start / Stop Stream
    const btnStart = document.getElementById('btn-start-telemetry');
    const btnStop = document.getElementById('btn-stop-telemetry');
    const btnSerial = document.getElementById('btn-connect-serial');
    const btnVideo = document.getElementById('btn-toggle-video');

    btnStart.addEventListener('click', () => {
      this.simulator.start();
      btnStart.disabled = true;
      btnStop.disabled = false;
      this.setLinkStatus('SIMULATOR ACTIVE', 'ok');
      this.logCommand('TELEMETRY STREAM: Flight simulator started.', 'success');
    });

    btnStop.addEventListener('click', () => {
      this.simulator.stop();
      btnStart.disabled = false;
      btnStop.disabled = true;
      this.setLinkStatus('STREAM STOPPED', 'warning');
      this.logCommand('TELEMETRY STREAM: Stopped by operator.', 'info');
    });

    btnSerial.addEventListener('click', async () => {
      try {
        await this.serial.connect(SYSTEM_CONFIG.DEFAULT_BAUD_RATE);
        this.simulator.stop();
        btnStart.disabled = true;
        btnStop.disabled = false;
        this.setLinkStatus('SERIAL HARDWARE CONNECTED', 'ok');
        this.logCommand(`HARDWARE SERIAL: USB COM Port Connected @ ${SYSTEM_CONFIG.DEFAULT_BAUD_RATE} Baud.`, 'success');
      } catch (err) {
        alert(err.message || 'Could not connect serial port.');
      }
    });

    btnVideo.addEventListener('click', async () => {
      if (!this.streamEngine.isStreaming) {
        const ok = await this.streamEngine.start();
        if (ok) btnVideo.innerHTML = '<i data-lucide="video-off"></i> Stop Cam';
      } else {
        this.streamEngine.stop();
        btnVideo.innerHTML = '<i data-lucide="camera"></i> Start Cam';
      }
      lucide.createIcons();
    });

    // Profile Select
    const profileSel = document.getElementById('sim-profile-select');
    if (profileSel) {
      profileSel.addEventListener('change', (e) => {
        this.simulator.setProfile(e.target.value);
        this.logCommand(`FLIGHT SIMULATOR: Switched profile to [${e.target.value}]`, 'info');
      });
    }

    // Commands
    document.getElementById('cmd-separation').addEventListener('click', () => {
      this.parser.setOverride('manualSeparated', true);
      this.logCommand('CMD DISPATCH: MANUAL SEPARATION -> EXECUTED', 'success');
      alert('CMD EXECUTION: Container & Payload Manual Separation Triggered!');
    });

    document.getElementById('cmd-parachute').addEventListener('click', () => {
      this.pendingModalCommand = 'PARACHUTE';
      document.getElementById('safety-modal').classList.add('active');
    });

    document.getElementById('cmd-redundant').addEventListener('click', () => {
      this.logCommand('CMD DISPATCH: REDUNDANT ACTIVATION -> ACK RECEIVED', 'info');
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
      document.getElementById('safety-modal').classList.remove('active');
    });

    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (this.pendingModalCommand === 'PARACHUTE') {
        this.parser.setOverride('parachuteActive', true);
        this.logCommand('CRITICAL CMD EXECUTION: EMERGENCY PARACHUTE DEPLOYED!', 'alert');
      }
      document.getElementById('safety-modal').classList.remove('active');
    });

    // Export & System Buttons
    document.getElementById('btn-export-csv').addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-export-graph').addEventListener('click', () => this.exportGraph());
    document.getElementById('btn-sync-time').addEventListener('click', () => {
      this.logCommand(`GCS TIME SYNC: Synchronized with PC Clock -> ${new Date().toLocaleTimeString()}`, 'info');
    });
    document.getElementById('btn-reset-packet').addEventListener('click', () => {
      this.parser.clear();
      this.chartEngine.reset();
      this.mapEngine.reset();
      document.getElementById('telemetry-table-body').innerHTML = '';
      document.getElementById('hud-packets').innerText = '0';
      this.logCommand('SYSTEM RESET: Telemetry packet counter & buffers reset.', 'info');
    });

    // Fault Injection Checkboxes
    document.getElementById('fault-descent').addEventListener('change', (e) => {
      this.parser.setOverride('descentRateFault', e.target.checked);
      this.logCommand(`FAULT INJECTION: High Descent Rate override set to ${e.target.checked}`, 'alert');
    });
    document.getElementById('fault-gps').addEventListener('change', (e) => {
      this.parser.setOverride('gpsFault', e.target.checked);
      this.logCommand(`FAULT INJECTION: GPS Failure override set to ${e.target.checked}`, 'alert');
    });
    document.getElementById('fault-separation').addEventListener('change', (e) => {
      this.parser.setOverride('separationFault', e.target.checked);
      this.logCommand(`FAULT INJECTION: Separation Fail override set to ${e.target.checked}`, 'alert');
    });
  }

  onTelemetryReceived(rawPacketStr) {
    const packet = this.parser.parse(rawPacketStr);
    if (!packet) return;

    // HUD Header Updates
    document.getElementById('hud-met').innerText = packet.timeStr;
    document.getElementById('hud-packets').innerText = packet.packetCount;
    document.getElementById('hud-error-code').innerText = packet.errorCode;
    document.getElementById('summary-flight-state').innerText = packet.flightState;

    // Numerical Telemetry Cards
    document.getElementById('val-container-alt').innerText = packet.containerAlt.toFixed(1);
    document.getElementById('val-payload-alt').innerText = packet.payloadAlt.toFixed(1);
    document.getElementById('val-pressure').innerText = packet.pressure.toFixed(1);
    document.getElementById('val-temp').innerText = packet.temp.toFixed(1);
    document.getElementById('val-voltage').innerText = packet.voltage.toFixed(2);
    document.getElementById('val-descent-rate').innerText = packet.descentRate.toFixed(1);
    document.getElementById('val-gps-sats').innerText = packet.gpsSats;
    document.getElementById('val-gyro-pry').innerText = `${packet.pitch.toFixed(0)}°/${packet.roll.toFixed(0)}°/${packet.yaw.toFixed(0)}°`;

    // Error Code Diagnostics
    this.updateErrorBanner(packet.errorCode);

    // Visualizations
    this.chartEngine.update(packet);
    this.mapEngine.update(packet);
    this.orientationEngine.update(packet.pitch, packet.roll, packet.yaw);

    // Append to Table
    this.appendTableRecord(packet);
  }

  setLinkStatus(text, statusType) {
    const textEl = document.getElementById('link-text');
    const dotEl = document.getElementById('status-dot');
    if (textEl) textEl.innerText = text;
    if (dotEl) {
      dotEl.className = 'status-dot';
      if (statusType === 'danger') dotEl.classList.add('danger');
      if (statusType === 'warning') dotEl.classList.add('warning');
    }
  }

  updateErrorBanner(codeStr) {
    const d1 = codeStr[0] || '0';
    const d2 = codeStr[1] || '0';
    const d3 = codeStr[2] || '0';
    const d4 = codeStr[3] || '0';

    this.setDigitBox('1', d1, d1 === '1' ? 'Descent Rate FAULT' : '0 (8–10 m/s Safe)');
    this.setDigitBox('2', d2, d2 === '1' ? 'GPS Signal LOST' : '0 (GPS OK)');
    this.setDigitBox('3', d3, d3 === '1' ? 'Separation FAIL' : '0 (Separated OK)');
    this.setDigitBox('4', d4, d4 === '1' ? 'Parachute ACTIVE' : '0 (Inactive)');

    const isFault = codeStr !== '0000';
    const hudCode = document.getElementById('hud-error-code');
    const badge = document.getElementById('error-badge-status');

    if (hudCode) {
      hudCode.innerText = codeStr;
      hudCode.style.color = isFault ? 'var(--status-danger)' : 'var(--status-ok)';
    }

    if (badge) {
      badge.innerText = isFault ? `${codeStr} FAULT` : '0000 ALL OK';
      badge.style.background = isFault ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)';
      badge.style.color = isFault ? '#f87171' : '#34d399';
    }
  }

  setDigitBox(num, val, text) {
    const box = document.getElementById(`digit-box-${num}`);
    const valEl = document.getElementById(`digit-val-${num}`);
    const descEl = document.getElementById(`err-desc-${num}`);
    const textEl = document.getElementById(`err-text-${num}`);

    if (valEl) valEl.innerText = val;
    if (box) box.className = val === '1' ? 'digit-box fault' : 'digit-box';
    if (descEl) descEl.className = val === '1' ? 'error-item fault' : 'error-item ok';
    if (textEl) textEl.innerText = text;
  }

  appendTableRecord(pkt) {
    const tbody = document.getElementById('telemetry-table-body');
    if (!tbody) return;

    const tr = document.createElement('tr');
    if (pkt.errorCode !== '0000') tr.style.color = '#f87171';

    tr.innerHTML = `
      <td>${pkt.packetCount}</td>
      <td>${pkt.timeStr}</td>
      <td>${pkt.containerAlt.toFixed(1)}</td>
      <td>${pkt.payloadAlt.toFixed(1)}</td>
      <td>${pkt.pressure.toFixed(1)}</td>
      <td>${pkt.temp.toFixed(1)}</td>
      <td>${pkt.voltage.toFixed(2)}</td>
      <td>${pkt.descentRate.toFixed(1)}</td>
      <td><strong>${pkt.errorCode}</strong></td>
    `;

    tbody.insertBefore(tr, tbody.firstChild);

    while (tbody.children.length > 50) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  logCommand(msg, type = 'info') {
    const logBox = document.getElementById('command-log');
    if (!logBox) return;
    const timeStr = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="time">[${timeStr}]</span> ${msg}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  exportCSV() {
    const logs = this.parser.logs;
    if (!logs.length) { alert('No telemetry logs to export.'); return; }
    const headers = ['Team_ID','Packet_Count','Time','Container_Alt_m','Payload_Alt_m','Pressure_hPa','Temp_C','Voltage_V','Descent_Rate_ms','GPS_Lat','GPS_Lng','GPS_Sats','Pitch','Roll','Yaw','Error_Code','State'];
    const rows = [headers.join(',')];
    logs.forEach(p => {
      rows.push([p.teamId,p.packetCount,p.timeStr,p.containerAlt,p.payloadAlt,p.pressure,p.temp,p.voltage,p.descentRate,p.gpsLat,p.gpsLng,p.gpsSats,p.pitch,p.roll,p.yaw,p.errorCode,p.flightState].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CanSat_Telemetry_Log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportGraph() {
    const canvas = document.getElementById('chart-altitude');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `CanSat_Telemetry_Graph_${Date.now()}.png`;
    a.click();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new GroundControlApplication();
  app.init();
});
