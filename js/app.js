/* ==========================================================================
   Main Application Entry Point & State Coordinator
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  console.log("Initializing India Space Lab CanSat Ground Control Software...");

  // Initialize Sub-managers
  window.chartManager.init();
  window.mapManager.init();
  window.orientationManager.init();
  window.videoManager.init();
  window.controlsManager.init();

  // Create Telemetry Simulator instance
  const simulator = new window.TelemetrySimulator((rawPacketStr) => {
    processIncomingPacket(rawPacketStr);
  });

  // Create Serial Port Manager instance
  const serial = new window.SerialManager((rawPacketStr) => {
    processIncomingPacket(rawPacketStr);
  });

  // Start & Stop Telemetry buttons
  const btnStart = document.getElementById('btn-start-telemetry');
  const btnStop = document.getElementById('btn-stop-telemetry');
  const btnSerial = document.getElementById('btn-connect-serial');
  const btnToggleVideo = document.getElementById('btn-toggle-video');

  // Auto-start simulator for live visualization
  setTimeout(() => {
    simulator.start();
    btnStart.disabled = true;
    btnStop.disabled = false;
    updateLinkStatus('SIMULATOR ACTIVE (LIVE)', 'ok');
  }, 500);

  btnStart.addEventListener('click', () => {
    simulator.start();
    btnStart.disabled = true;
    btnStop.disabled = false;
    updateLinkStatus('SIMULATOR ACTIVE', 'ok');
    window.controlsManager.logCommand("TELEMETRY STREAM: Simulator started.", "success");
  });

  btnStop.addEventListener('click', () => {
    simulator.stop();
    btnStart.disabled = false;
    btnStop.disabled = true;
    updateLinkStatus('STREAM STOPPED', 'warning');
    window.controlsManager.logCommand("TELEMETRY STREAM: Stopped by operator.", "info");
  });

  btnSerial.addEventListener('click', async () => {
    const success = await serial.connect(9600);
    if (success) {
      simulator.stop(); // Stop simulator if hardware serial is connected
      btnStart.disabled = true;
      btnStop.disabled = false;
      updateLinkStatus('SERIAL HARDWARE CONNECTED', 'ok');
      window.controlsManager.logCommand("HARDWARE SERIAL: USB COM Port Connected @ 9600 Baud.", "success");
    }
  });

  btnToggleVideo.addEventListener('click', async () => {
    if (!window.videoManager.isStreaming) {
      const ok = await window.videoManager.startStream();
      if (ok) btnToggleVideo.innerHTML = '<i data-lucide="video-off"></i> Stop Cam';
    } else {
      window.videoManager.stopStream();
      btnToggleVideo.innerHTML = '<i data-lucide="camera"></i> Start Cam';
    }
    lucide.createIcons();
  });

  // Profile Selector Change
  const simProfileSelect = document.getElementById('sim-profile-select');
  if (simProfileSelect) {
    simProfileSelect.addEventListener('change', (e) => {
      simulator.selectedProfile = e.target.value;
      window.controlsManager.logCommand(`FLIGHT SIMULATOR: Switched profile to [${e.target.value}]`, 'info');
    });
  }

  // Incoming Packet Pipeline
  function processIncomingPacket(rawStr) {
    const packet = window.telemetryProcessor.parsePacket(rawStr);
    if (!packet) return;

    // 1. Update Top Bar HUD & Metadata
    document.getElementById('hud-met').innerText = packet.time;
    document.getElementById('hud-packets').innerText = packet.packetCount;
    document.getElementById('hud-error-code').innerText = packet.errorCode;
    document.getElementById('summary-flight-state').innerText = packet.flightState;

    // 2. Update Telemetry Cards
    document.getElementById('val-container-alt').innerText = packet.containerAlt.toFixed(1);
    document.getElementById('val-payload-alt').innerText = packet.payloadAlt.toFixed(1);
    document.getElementById('val-pressure').innerText = packet.pressure.toFixed(1);
    document.getElementById('val-temp').innerText = packet.temp.toFixed(1);
    document.getElementById('val-voltage').innerText = packet.voltage.toFixed(2);
    document.getElementById('val-descent-rate').innerText = packet.descentRate.toFixed(1);
    document.getElementById('val-gps-sats').innerText = packet.gpsSats;
    document.getElementById('val-gyro-pry').innerText = `${packet.pitch.toFixed(0)}°/${packet.roll.toFixed(0)}°/${packet.yaw.toFixed(0)}°`;

    // 3. Update 4-Digit Error Code Banner & Indicators
    updateErrorBanner(packet.errorCode);

    // 4. Update Visualizations
    window.chartManager.update(packet);
    window.mapManager.update(packet);
    window.orientationManager.update(packet.pitch, packet.roll, packet.yaw);

    // 5. Append to Telemetry Data Table
    appendTableRecord(packet);
  }

  function updateLinkStatus(text, statusType) {
    const textEl = document.getElementById('link-text');
    const dotEl = document.getElementById('status-dot');
    if (textEl) textEl.innerText = text;
    if (dotEl) {
      dotEl.className = 'status-dot';
      if (statusType === 'danger') dotEl.classList.add('danger');
      if (statusType === 'warning') dotEl.classList.add('warning');
    }
  }

  function updateErrorBanner(codeStr) {
    const d1 = codeStr[0] || '0';
    const d2 = codeStr[1] || '0';
    const d3 = codeStr[2] || '0';
    const d4 = codeStr[3] || '0';

    updateDigitBox('1', d1, d1 === '1' ? 'Descent Rate FAULT' : '0 (8–10 m/s Safe)');
    updateDigitBox('2', d2, d2 === '1' ? 'GPS Signal LOST' : '0 (GPS OK)');
    updateDigitBox('3', d3, d3 === '1' ? 'Separation FAIL' : '0 (Separated OK)');
    updateDigitBox('4', d4, d4 === '1' ? 'Parachute ACTIVE' : '0 (Inactive)');

    const isAnyFault = codeStr !== '0000';
    const hudErrCode = document.getElementById('hud-error-code');
    const badgeStatus = document.getElementById('error-badge-status');

    if (hudErrCode) {
      hudErrCode.innerText = codeStr;
      hudErrCode.style.color = isAnyFault ? 'var(--status-danger)' : 'var(--status-ok)';
    }

    if (badgeStatus) {
      badgeStatus.innerText = isAnyFault ? `${codeStr} FAULT` : '0000 ALL OK';
      badgeStatus.style.background = isAnyFault ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)';
      badgeStatus.style.borderColor = isAnyFault ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.3)';
      badgeStatus.style.color = isAnyFault ? '#f87171' : '#34d399';
    }
  }

  function updateDigitBox(num, val, text) {
    const box = document.getElementById(`digit-box-${num}`);
    const valEl = document.getElementById(`digit-val-${num}`);
    const descEl = document.getElementById(`err-desc-${num}`);
    const textEl = document.getElementById(`err-text-${num}`);

    if (valEl) valEl.innerText = val;
    if (box) {
      if (val === '1') box.classList.add('fault');
      else box.classList.remove('fault');
    }
    if (descEl) {
      descEl.className = val === '1' ? 'error-item fault' : 'error-item ok';
    }
    if (textEl) textEl.innerText = text;
  }

  function appendTableRecord(pkt) {
    const tbody = document.getElementById('telemetry-table-body');
    if (!tbody) return;

    const tr = document.createElement('tr');
    const isFault = pkt.errorCode !== '0000';
    if (isFault) tr.style.color = '#f87171';

    tr.innerHTML = `
      <td>${pkt.packetCount}</td>
      <td>${pkt.time}</td>
      <td>${pkt.containerAlt.toFixed(1)}</td>
      <td>${pkt.payloadAlt.toFixed(1)}</td>
      <td>${pkt.pressure.toFixed(1)}</td>
      <td>${pkt.temp.toFixed(1)}</td>
      <td>${pkt.voltage.toFixed(2)}</td>
      <td>${pkt.descentRate.toFixed(1)}</td>
      <td><strong>${pkt.errorCode}</strong></td>
    `;

    tbody.insertBefore(tr, tbody.firstChild);

    // Keep table capped at 50 visible rows
    while (tbody.children.length > 50) {
      tbody.removeChild(tbody.lastChild);
    }

    const countText = document.getElementById('log-count-text');
    if (countText) {
      countText.innerText = `${window.telemetryProcessor.logs.length} Packets Logged`;
    }
  }
});
