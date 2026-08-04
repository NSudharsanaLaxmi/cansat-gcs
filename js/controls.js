/* ==========================================================================
   Mission Controls, Safety Dialogs & Top Bar Manager
   ========================================================================== */

class ControlsManager {
  constructor() {
    this.pendingCommand = null;
  }

  init() {
    // 1. Mission Control Buttons
    const btnSep = document.getElementById('cmd-separation');
    if (btnSep) {
      btnSep.addEventListener('click', () => this.handleSeparationCommand());
    }

    const btnParachute = document.getElementById('cmd-parachute');
    if (btnParachute) {
      btnParachute.addEventListener('click', () => this.openSafetyModal('PARACHUTE'));
    }

    const btnRedundant = document.getElementById('cmd-redundant');
    if (btnRedundant) {
      btnRedundant.addEventListener('click', () => this.handleRedundantCommand());
    }

    // 2. Modal Cancel & Confirm
    const btnCancel = document.getElementById('modal-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => this.closeSafetyModal());
    }

    const btnConfirm = document.getElementById('modal-confirm');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => this.executeModalCommand());
    }

    // 3. Top Control Bar Buttons
    const btnExportCSV = document.getElementById('btn-export-csv');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => window.exporter.exportCSV());
    }

    const btnExportGraph = document.getElementById('btn-export-graph');
    if (btnExportGraph) {
      btnExportGraph.addEventListener('click', () => window.exporter.exportGraph());
    }

    const btnSyncTime = document.getElementById('btn-sync-time');
    if (btnSyncTime) {
      btnSyncTime.addEventListener('click', () => this.syncPCTime());
    }

    const btnReset = document.getElementById('btn-reset-packet');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetPackets());
    }

    // 4. Fault Checkboxes
    const chkDescent = document.getElementById('fault-descent');
    if (chkDescent) {
      chkDescent.addEventListener('change', (e) => {
        window.telemetryProcessor.highDescentRate = e.target.checked;
        this.logCommand(`FAULT INJECTION: High Descent Rate override set to ${e.target.checked}`, 'alert');
      });
    }

    const chkGPS = document.getElementById('fault-gps');
    if (chkGPS) {
      chkGPS.addEventListener('change', (e) => {
        window.telemetryProcessor.gpsFailed = e.target.checked;
        this.logCommand(`FAULT INJECTION: GPS Failure override set to ${e.target.checked}`, 'alert');
      });
    }

    const chkSep = document.getElementById('fault-separation');
    if (chkSep) {
      chkSep.addEventListener('change', (e) => {
        window.telemetryProcessor.separationFailed = e.target.checked;
        this.logCommand(`FAULT INJECTION: Separation Fail override set to ${e.target.checked}`, 'alert');
      });
    }
  }

  handleSeparationCommand() {
    window.telemetryProcessor.manualSeparated = true;
    this.logCommand("CMD DISPATCH: MANUAL SEPARATION -> SENT", "success");
    alert("CMD EXECUTION: Container & Payload Manual Separation Triggered!");
  }

  handleRedundantCommand() {
    this.logCommand("CMD DISPATCH: REDUNDANT ACTIVATION SIGNAL -> TRANSMITTED (ACK RECEIVED)", "info");
  }

  openSafetyModal(cmdType) {
    this.pendingCommand = cmdType;
    const modal = document.getElementById('safety-modal');
    if (modal) modal.classList.add('active');
  }

  closeSafetyModal() {
    this.pendingCommand = null;
    const modal = document.getElementById('safety-modal');
    if (modal) modal.classList.remove('active');
  }

  executeModalCommand() {
    if (this.pendingCommand === 'PARACHUTE') {
      window.telemetryProcessor.emergencyParachute = true;
      this.logCommand("CRITICAL CMD EXECUTION: EMERGENCY PARACHUTE DEPLOYED!", "alert");
    }
    this.closeSafetyModal();
  }

  syncPCTime() {
    const pcTime = new Date().toLocaleTimeString();
    this.logCommand(`GCS TIME SYNC: Synchronized with local PC Clock -> ${pcTime}`, "info");
  }

  resetPackets() {
    window.telemetryProcessor.resetCounter();
    if (window.chartManager) window.chartManager.clear();
    if (window.mapManager) window.mapManager.clear();
    
    document.getElementById('telemetry-table-body').innerHTML = '';
    document.getElementById('hud-packets').innerText = '0';
    this.logCommand("SYSTEM RESET: Telemetry packet counter & buffers reset.", "info");
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
}

window.controlsManager = new ControlsManager();
