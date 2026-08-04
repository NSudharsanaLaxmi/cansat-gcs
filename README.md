# India Space Lab (ISL) - CanSat Ground Control Software (GCS)

**Course Domain**: Aerospace Engineering / Embedded Systems / Avionics / Ground Systems  
**Project Category**: Real-Time Telemetry Monitoring & Mission Operations Software  
**Assignment Type**: Design and Development Assignment  

---

## 🚀 Mission Overview
The **CanSat Ground Control Software (GCS)** is a professional, aerospace-style single-page operator dashboard engineered for real-time telemetry monitoring, mission operations control, GPS trajectory tracking, 3D orientation visualization, live video streaming, and 4-digit fault diagnostic monitoring.

Designed according to **India Space Lab (ISL)** aerospace assignment specifications, it supports both **USB Hardware Serial communication via Web Serial API** (for WeGyanik Kit / Arduino / ESP32 microcontrollers) and an **Interactive Telemetry Flight Simulator** with fault injection modes.

---

## 🌟 Key Features & Requirements Matrix

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Single-Page Dashboard** | Integrated dark aerospace UI with glassmorphism, responsive grid layout, and custom HUD metrics | ✅ Completed |
| **Top Control Bar** | Start/Stop streaming, Web Serial USB connect, CSV Export, Chart PNG Export, PC Time Sync, Packet Counter Reset | ✅ Completed |
| **Mission Control Panel** | Manual Separation trigger, Emergency Parachute safety modal, Redundant Activation, Real-time Command Log | ✅ Completed |
| **Telemetry Display** | Separated Container (Alt, Press, Temp, Volt) and Payload (Alt, Rate, Gyro, GPS Sats) Data Cards | ✅ Completed |
| **4-Digit Error System** | Live monitoring of Digits 1-4 (Descent Rate, GPS, Separation, Parachute) with color-coded status badges | ✅ Completed |
| **Real-Time Graphs** | 5 synchronized Chart.js graphs for Altitude, Pressure, Temperature, Descent Rate, and Battery Voltage | ✅ Completed |
| **GPS Tracking Map** | Leaflet.js with CartoDB dark tile map, real-time payload position marker, and flight path polyline | ✅ Completed |
| **Orientation & PFD** | Three.js interactive 3D satellite model + Primary Flight Display (PFD) Glass Cockpit Artificial Horizon | ✅ Completed |
| **Live Camera Video** | MediaDevices API browser camera feed with targeting HUD overlay and stream controls | ✅ Completed |
| **Data Management** | Telemetry buffer table, downloadable formatted CSV log, and Chart PNG image snapshot export | ✅ Completed |

---

## 📊 Detailed 4-Digit Error Code System

The GCS features a live 4-digit error diagnostic code. Each digit monitors a critical flight condition (`0` = Safe/OK, `1` = Fault/Active):

```
+-------------------------------------------------------------------------------+
|  Digit 1: Descent Rate      | 0 = Safe (8–10 m/s)   | 1 = Outside Safe Range  |
|  Digit 2: GPS Availability   | 0 = GPS Available     | 1 = GPS Lost / Outage   |
|  Digit 3: Payload Separation | 0 = Separated OK      | 1 = Separation Failure  |
|  Digit 4: Parachute System   | 0 = Inactive          | 1 = Parachute Deployed  |
+-------------------------------------------------------------------------------+
```

### Fault Code Examples:
- **`0000`**: All Systems Normal (Nominal Flight)
- **`1000`**: Descent Rate Fault Detected (>10 m/s high freefall rate)
- **`0100`**: GPS Data Unavailable / Signal Lost
- **`0010`**: Payload Separation Failure
- **`0001`**: Emergency Parachute Deployment Activated
- **`1111`**: Critical Alert — All Fault Conditions Active

---

## 🛠️ Tech Stack & Dependencies
- **Frontend Architecture**: HTML5, CSS3, ES6 JavaScript (Zero backend server requirement).
- **Styling**: Vanilla CSS3, Grid & Flexbox, Backdrop Blur (`glassmorphism`), Custom CSS Animations.
- **Graphing Engine**: `Chart.js` (v4.4.1)
- **Mapping Engine**: `Leaflet.js` (v1.9.4) & OpenStreetMap / CartoDB Dark Tiles
- **3D Graphics Engine**: `Three.js` (r128)
- **Iconography**: `Lucide Icons`
- **Hardware Integration**: Native Browser **Web Serial API** (`navigator.serial`)

---

## ⚡ How to Run the Software

### Method 1: Instant Browser Launch (Recommended)
1. Open the project folder `cansat-gcs`.
2. Double-click **`index.html`** or open it in **Google Chrome**, **Microsoft Edge**, or **Brave**.
3. Click **`Start Streaming`** in the top control bar to initiate the built-in flight telemetry simulator!

### Method 2: Local HTTP Dev Server
If you prefer running via local HTTP server:
```bash
# Using Python builtin HTTP server
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.

---

## 🔌 Microcontroller Hardware Testing (WeGyanik Kit / Arduino / ESP32)

1. Open `hardware/cansat_firmware.ino` in **Arduino IDE**.
2. Flash the sketch to your WeGyanik Kit / Arduino Uno / ESP32 board.
3. Connect the microcontroller to your PC via USB cable.
4. Open the Ground Control Software in Chrome/Edge, click **`Serial Port`** in the top bar, select your microcontroller's COM port, and set baud rate to **9600**.
5. Live sensor telemetry will stream directly from hardware into the GCS!

### Python Serial Simulator (Alternative Testing Tool):
```bash
# Install PySerial if required
pip install pyserial

# Run simulator script specifying COM port
python hardware/cansat_simulator.py COM3
```

---

## 📁 File Structure & Deliverables

```
cansat-gcs/
├── index.html                  # Single-page GCS main interface
├── css/
│   └── styles.css              # Aerospace dark theme styling & layout
├── js/
│   ├── app.js                  # Application entry point & telemetry pipeline
│   ├── simulator.js            # Telemetry flight simulator & profile engine
│   ├── serial.js               # Web Serial API connection manager
│   ├── telemetry.js            # Telemetry parser & 4-digit error system
│   ├── charts.js               # Chart.js real-time graphing
│   ├── map.js                  # Leaflet.js GPS tracking & trajectory path
│   ├── orientation.js          # Three.js 3D satellite & Artificial Horizon PFD
│   ├── video.js                # WebCam video stream HUD
│   ├── controls.js             # Mission controls & safety dialogs
│   └── exporter.js             # CSV and Chart PNG exporter
├── hardware/
│   ├── cansat_firmware.ino     # Arduino C++ Firmware sketch
│   └── cansat_simulator.py     # Python serial telemetry generator
├── data/
│   ├── sample_telemetry.csv    # Sample CSV telemetry log deliverable
│   └── sample_telemetry.json   # Sample JSON telemetry deliverable
└── README.md                   # Complete assignment report & documentation
```

---

## 🏆 Project Compliance & Evaluation Criteria Coverage

- **UI/UX Design (15%)**: Sleek aerospace dark glassmorphism, responsive grid layout, high-contrast HUD cards.
- **Telemetry Handling (20%)**: Continuous parsing of CSV packets, split Container vs Payload fields.
- **Real-Time Visualization (20%)**: Three.js 3D CanSat orientation + PFD Artificial Horizon instrument.
- **Mission Control Features (15%)**: Arming switches, Safety Modals, Redundant activation, Dynamic execution logs.
- **Graphing and Tracking (10%)**: 5 live Chart.js line charts + Leaflet GPS trajectory map.
- **Orientation and Video Systems (10%)**: Web Serial API support + WebCam API live stream HUD.
- **Code Quality & Scalability (10%)**: Clean, modular JS architecture, zero framework bloat.

---
*Developed for India Space Lab (ISL) Aerospace & CanSat Satellite Project Assignment.*
