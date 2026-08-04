/**
 * Real-Time Telemetry Graph Engine (Chart.js wrapper)
 * @module components/ChartEngine
 */

import { SYSTEM_CONFIG } from '../config.js';

export class ChartEngine {
  constructor() {
    this.charts = {};
  }

  init() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.font.size = 10;

    this.charts.altitude = new Chart(document.getElementById('chart-altitude').getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'Container Alt (m)', borderColor: '#00f0ff', backgroundColor: 'rgba(0, 240, 255, 0.1)', borderWidth: 2, tension: 0.3, fill: true, data: [] },
          { label: 'Payload Alt (m)', borderColor: '#3b82f6', borderWidth: 2, borderDash: [4, 4], tension: 0.3, data: [] }
        ]
      },
      options: this.getOptions('Altitude Profile (m)')
    });

    this.charts.pressure = new Chart(document.getElementById('chart-pressure').getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Pressure (hPa)', borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 2, tension: 0.3, fill: true, data: [] }] },
      options: this.getOptions('Atmospheric Pressure (hPa)')
    });

    this.charts.temperature = new Chart(document.getElementById('chart-temperature').getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Temperature (°C)', borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 2, tension: 0.3, fill: true, data: [] }] },
      options: this.getOptions('Temperature (°C)')
    });

    this.charts.descentRate = new Chart(document.getElementById('chart-descent-rate').getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Descent Rate (m/s)', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 2, tension: 0.3, fill: true, data: [] }] },
      options: this.getOptions('Descent Rate (m/s)')
    });

    this.charts.voltage = new Chart(document.getElementById('chart-voltage').getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Battery Voltage (V)', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, tension: 0.3, fill: true, data: [] }] },
      options: this.getOptions('Battery Voltage (V)')
    });
  }

  getOptions(title) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        title: { display: true, text: title, color: '#f8fafc', font: { size: 11, weight: '600' } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
      }
    };
  }

  update(packet) {
    const timeLabel = packet.timeStr;
    const maxWin = SYSTEM_CONFIG.GRAPH_ROLLING_WINDOW;

    const pushToChart = (chart, values) => {
      chart.data.labels.push(timeLabel);
      if (chart.data.labels.length > maxWin) chart.data.labels.shift();

      chart.data.datasets.forEach((dataset, idx) => {
        dataset.data.push(values[idx]);
        if (dataset.data.length > maxWin) dataset.data.shift();
      });
      chart.update();
    };

    pushToChart(this.charts.altitude, [packet.containerAlt, packet.payloadAlt]);
    pushToChart(this.charts.pressure, [packet.pressure]);
    pushToChart(this.charts.temperature, [packet.temp]);
    pushToChart(this.charts.descentRate, [packet.descentRate]);
    pushToChart(this.charts.voltage, [packet.voltage]);
  }

  reset() {
    Object.values(this.charts).forEach(c => {
      c.data.labels = [];
      c.data.datasets.forEach(d => d.data = []);
      c.update();
    });
  }
}
