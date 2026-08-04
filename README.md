# Ground Control Software (GCS) - CanSat Mission Operations

A modular, high-performance single-page Ground Control Software (GCS) engineered for CanSat & CubeSat mission operations. Designed according to India Space Lab (ISL) avionics specifications, the system provides real-time telemetry ingestion, 4-digit diagnostic fault decoding, 5-channel parameter plotting, 3D attitude visualization, vector GPS trajectory tracking, and USB serial hardware interop.

---

## 1. System Architecture

The software follows a decoupled Event-Driven ES Module (ESM) architecture with zero monolithic global scope pollution.

```
cansat-gcs/
├── index.html                  # Semantic HTML5 operator interface
├── css/
│   └── styles.css              # Design system tokens & CSS Grid / Flexbox
├── src/
│   └── js/
│       ├── config.js           # System constants, fault bitmasks, flight phases
│       ├── main.js             # Application orchestrator & DI entry point
│       ├── utils/
│       │   └── formatters.js   # Telemetry conversions & math functions
│       ├── services/
│       │   ├── TelemetryParser.js  # CSV parser & 4-digit fault bitmask engine
│       │   ├── SerialTransport.js  # Web Serial API driver & stream decoder
│       │   └── FlightSimulator.js  # Barometric physics flight engine
│       └── components/
│           ├── ChartEngine.js      # Chart.js 5-channel real-time graphing
│           ├── MapEngine.js        # Leaflet GPS map & polyline trajectory
│           ├── OrientationEngine.js# Three.js 3D WebGL satellite & PFD horizon
│           └── StreamEngine.js     # MediaDevices WebCam API HUD
├── hardware/
│   ├── cansat_firmware.ino     # Arduino/ESP32 C++ firmware sketch
│   └── cansat_simulator.py     # Python PySerial test runner
└── data/
    ├── sample_telemetry.csv    # Sample mission log deliverable
    └── sample_telemetry.json   # JSON formatted telemetry dump
```

---

## 2. Telemetry Frame Specification

The GCS ingests telemetry frames formatted as ASCII comma-separated values (CSV) at 1.0 Hz:

```
TEAM_ID,PACKET_COUNT,TIME,CONT_ALT,PAY_ALT,PRESS,TEMP,VOLT,DESCENT_RATE,LAT,LNG,SATS,PITCH,ROLL,YAW,ERROR_CODE,FLIGHT_STATE
```

### 4-Digit Error Diagnostic System (`ERROR_CODE`)

The 4-digit string represents a binary bitmask evaluated against operational boundaries (`0` = Nominal, `1` = Fault Condition):

| Digit Position | Condition Monitored | Nominal Criteria (`0`) | Fault Criteria (`1`) |
| :---: | :--- | :--- | :--- |
| **Digit 1** | Descent Velocity | 8.0 m/s &le; Rate &le; 10.0 m/s | Rate > 11.0 m/s or < 7.0 m/s (Descent Phase) |
| **Digit 2** | GPS Receiver Fix | Satellites &ge; 4 & valid lat/lng | Satellites < 4 or signal drop |
| **Digit 3** | Payload Separation | Separation command acknowledged | Separation failure detected |
| **Digit 4** | Parachute System | Standby / Nominal rate | Emergency parachute deployed |

```
0000 -> Nominal Systems Operating
1000 -> Descent Rate Violation Detected (> 10 m/s)
0100 -> Loss of GPS Carrier Lock
0010 -> Payload Separation Mechanical Failure
0001 -> Emergency Recovery Parachute Triggered
1111 -> Critical System Fault State
```

---

## 3. Hardware Transport & Protocols

### Web Serial API Integration
The client interfaces directly with USB serial hardware (WeGyanik Kit / Arduino Uno / ESP32) using native Chrome/Edge `navigator.serial` streams at 9600 / 115200 baud without requiring native desktop wrappers or backend servers.

### Microcontroller Firmware Deployment (`hardware/cansat_firmware.ino`)
Flash the provided C++ sketch to the target microcontroller board via Arduino IDE. Serial output will format telemetry frames automatically.

```bash
# Optional Python serial simulator CLI
python hardware/cansat_simulator.py COM3
```

---

## 4. Execution & Setup

### Development Server
```bash
# Serve over HTTP using Python
python -m http.server 8080
```
Open `http://localhost:8080` in Chrome or Edge.

---
*India Space Lab (ISL) Aerospace & Ground Station Operations Specification.*
