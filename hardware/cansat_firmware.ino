/* ==========================================================================
   INDIA SPACE LAB - CanSat & CubeSat Mission Firmware
   Target Microcontroller: WeGyanik Kit / Arduino Uno / Mega / ESP32
   Communication: UART Serial (9600 Baud) -> Web Serial API
   ========================================================================== */

#include <Wire.h>

// Mission Constants & Pins
#define TEAM_ID "ISL-CANSAT-1024"
#define PIN_SEPARATION_SERVO 9
#define PIN_PARACHUTE_RELAY 10
#define PIN_BUZZER 11

// Flight Telemetry Variables
unsigned long packetCounter = 0;
float containerAlt = 0.0;
float payloadAlt = 0.0;
float pressure = 1013.25;
float temp = 24.5;
float voltage = 7.4;
float descentRate = 0.0;
float gpsLat = 28.6139;
float gpsLng = 77.2090;
int gpsSats = 8;
float pitch = 0.0;
float roll = 0.0;
float yaw = 0.0;
char errorCode[5] = "0000";
char flightState[16] = "PRE_LAUNCH";

unsigned long lastTelemetryTime = 0;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_SEPARATION_SERVO, OUTPUT);
  pinMode(PIN_PARACHUTE_RELAY, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Sound startup chime
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
}

void loop() {
  // Check for Incoming GCS Commands via Serial
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "CMD_SEP") {
      digitalWrite(PIN_SEPARATION_SERVO, HIGH);
      errorCode[2] = '0'; // Separation OK
    } else if (cmd == "CMD_PARACHUTE") {
      digitalWrite(PIN_PARACHUTE_RELAY, HIGH);
      errorCode[3] = '1'; // Emergency Parachute Activated
    } else if (cmd == "CMD_RESET") {
      packetCounter = 0;
    }
  }

  // Transmit 1 Hz Telemetry Packet
  if (millis() - lastTelemetryTime >= 1000) {
    lastTelemetryTime = millis();
    packetCounter++;

    // Update Simulated Sensor Readings
    readSensors();

    // Print Formatted CSV Packet:
    // TEAM_ID,PACKET_COUNT,TIME,CONT_ALT,PAY_ALT,PRESS,TEMP,VOLT,DESCENT_RATE,LAT,LNG,SATS,PITCH,ROLL,YAW,ERROR_CODE,STATE
    Serial.print(TEAM_ID); Serial.print(",");
    Serial.print(packetCounter); Serial.print(",");
    Serial.print(getFormattedTime()); Serial.print(",");
    Serial.print(containerAlt, 1); Serial.print(",");
    Serial.print(payloadAlt, 1); Serial.print(",");
    Serial.print(pressure, 1); Serial.print(",");
    Serial.print(temp, 1); Serial.print(",");
    Serial.print(voltage, 2); Serial.print(",");
    Serial.print(descentRate, 1); Serial.print(",");
    Serial.print(gpsLat, 6); Serial.print(",");
    Serial.print(gpsLng, 6); Serial.print(",");
    Serial.print(gpsSats); Serial.print(",");
    Serial.print(pitch, 1); Serial.print(",");
    Serial.print(roll, 1); Serial.print(",");
    Serial.print(yaw, 1); Serial.print(",");
    Serial.print(errorCode); Serial.print(",");
    Serial.println(flightState);
  }
}

void readSensors() {
  // Replace with real sensor readings (e.g. BMP280, MPU6050, NEO-6M GPS)
  if (packetCounter < 10) {
    strcpy(flightState, "PRE_LAUNCH");
    containerAlt = 0.0;
    descentRate = 0.0;
  } else if (packetCounter < 30) {
    strcpy(flightState, "ASCENT");
    containerAlt += 30.0;
    descentRate = -30.0;
  } else if (containerAlt > 0) {
    strcpy(flightState, "DESCENT");
    descentRate = 8.5; // Safe descent rate 8-10 m/s
    containerAlt = max(0.0, containerAlt - descentRate);
    payloadAlt = containerAlt - 2.0;
  } else {
    strcpy(flightState, "LANDED");
    descentRate = 0.0;
  }

  pressure = 1013.25 * exp(-containerAlt / 8400.0);
  temp = 24.5 - (containerAlt / 1000.0) * 6.5;
  voltage = max(6.4, 8.4 - (packetCounter * 0.005));
}

String getFormattedTime() {
  unsigned long seconds = millis() / 1000;
  int h = seconds / 3600;
  int m = (seconds % 3600) / 60;
  int s = seconds % 60;
  char buf[12];
  sprintf(buf, "%02d:%02d:%02d", h, m, s);
  return String(buf);
}
