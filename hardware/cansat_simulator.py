#!/usr/bin/env python3
"""
==========================================================================
INDIA SPACE LAB - CanSat Telemetry Serial Port Simulator Script
Use this script to stream simulated telemetry to a COM port via PySerial.
==========================================================================
"""

import time
import math
import sys

try:
    import serial
except ImportError:
    print("PySerial package not found. Install via: pip install pyserial")

def main():
    port_name = sys.argv[1] if len(sys.argv) > 1 else 'COM3'
    baud_rate = 9600

    print(f"[*] Starting CanSat Serial Telemetry Stream on {port_name} @ {baud_rate} Baud...")

    try:
        ser = serial.Serial(port_name, baud_rate, timeout=1)
        time.sleep(2) # Wait for serial port reset
    except Exception as e:
        print(f"[!] Warning: Could not open {port_name}: {e}")
        print("[!] Running in Console Output Simulation Mode:")
        ser = None

    packet_count = 0
    alt = 0.0

    while True:
        packet_count += 1
        time_str = time.strftime("%H:%M:%S")

        if packet_count < 10:
            state = "PRE_LAUNCH"
            alt = 0.0
            rate = 0.0
        elif packet_count < 30:
            state = "ASCENT"
            alt += 35.0
            rate = -35.0
        elif alt > 0:
            state = "DESCENT"
            rate = 8.8
            alt = max(0.0, alt - rate)
        else:
            state = "LANDED"
            rate = 0.0

        pressure = 1013.25 * math.exp(-alt / 8400.0)
        temp = 24.5 - (alt / 1000.0) * 6.5
        voltage = max(6.4, 8.4 - (packet_count * 0.003))

        # Format CSV Line
        packet = f"ISL-CANSAT-1024,{packet_count},{time_str},{alt:.1f},{alt-1.5:.1f},{pressure:.1f},{temp:.1f},{voltage:.2f},{rate:.1f},28.613900,77.209000,9,0.0,0.0,0.0,0000,{state}\n"

        print(f"[TX Pkt #{packet_count}]: {packet.strip()}")

        if ser:
            ser.write(packet.encode('utf-8'))

        time.sleep(1)

if __name__ == '__main__':
    main()
