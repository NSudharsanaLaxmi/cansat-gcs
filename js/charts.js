/* ==========================================================================
   Chart.js Real-Time Telemetry Graphing Module
   ========================================================================== */

class ChartManager {
  constructor() {
    this.maxPoints = 30; // Rolling window of 30 time steps
    this.charts = {};
  }

  init() {
    // Chart Default Formatting & Dark Theme Styling
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.font.size = 10;
    Chart.defaults.plugins.legend.labels.boxWidth = 10;

    // 1. Altitude Chart
    const ctxAlt = document.getElementById('chart-altitude').getContext('2d');
    this.charts.altitude = new Chart(ctxAlt, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Container Alt (m)',
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            data: []
          },
          {
            label: 'Payload Alt (m)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.3,
            data: []
          }
        ]
      },
      options: this.getChartOptions('Altitude (m)')
    });

    // 2. Atmospheric Pressure Chart
    const ctxPress = document.getElementById('chart-pressure').getContext('2d');
    this.charts.pressure = new Chart(ctxPress, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Atm. Pressure (hPa)',
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          data: []
        }]
      },
      options: this.getChartOptions('Pressure (hPa)')
    });

    // 3. Temperature Chart
    const ctxTemp = document.getElementById('chart-temperature').getContext('2d');
    this.charts.temperature = new Chart(ctxTemp, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Temperature (°C)',
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          data: []
        }]
      },
      options: this.getChartOptions('Temp (°C)')
    });

    // 4. Descent Rate Chart
    const ctxRate = document.getElementById('chart-descent-rate').getContext('2d');
    this.charts.descentRate = new Chart(ctxRate, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Descent Rate (m/s)',
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            data: []
          }
        ]
      },
      options: this.getChartOptions('Descent Rate (m/s)')
    });

    // 5. Battery Voltage Chart
    const ctxVolt = document.getElementById('chart-voltage').getContext('2d');
    this.charts.voltage = new Chart(ctxVolt, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Battery Voltage (V)',
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          data: []
        }]
      },
      options: this.getChartOptions('Voltage (V)')
    });
  }

  getChartOptions(titleText) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        title: { display: true, text: titleText, color: '#f8fafc', font: { size: 11, weight: 'bold' } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
      }
    };
  }

  update(packet) {
    const timeLabel = packet.time;

    // Helper to push and trim
    const pushData = (chart, label, values) => {
      chart.data.labels.push(label);
      if (chart.data.labels.length > this.maxPoints) {
        chart.data.labels.shift();
      }

      chart.data.datasets.forEach((dataset, idx) => {
        dataset.data.push(values[idx]);
        if (dataset.data.length > this.maxPoints) {
          dataset.data.shift();
        }
      });

      chart.update();
    };

    pushData(this.charts.altitude, timeLabel, [packet.containerAlt, packet.payloadAlt]);
    pushData(this.charts.pressure, timeLabel, [packet.pressure]);
    pushData(this.charts.temperature, timeLabel, [packet.temp]);
    pushData(this.charts.descentRate, timeLabel, [packet.descentRate]);
    pushData(this.charts.voltage, timeLabel, [packet.voltage]);
  }

  clear() {
    Object.values(this.charts).forEach(chart => {
      chart.data.labels = [];
      chart.data.datasets.forEach(ds => ds.data = []);
      chart.update();
    });
  }
}

window.chartManager = new ChartManager();
