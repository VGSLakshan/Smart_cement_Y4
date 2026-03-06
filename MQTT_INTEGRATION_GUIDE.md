# MQTT Real-Time Sensor Integration Guide

## Overview

This guide explains the MQTT integration for real-time sensor data transmission from ESP32 to the frontend via the backend server.

## Architecture

```
ESP32 Device (Meshement.ino)
    ↓ publishes via MQTT
HiveMQ Broker (Public MQTT Broker)
    ↓ subscribes
Backend Server (Node.js + MQTT)
    ↓ broadcasts via Socket.IO
Frontend (React + Socket.IO Client)
```

## Components Updated

### 1. ESP32 Device (`mesherment_IOT/Meshement.ino`)

**New Features:**

- WiFi connectivity (SSID: "Dialog 4G 236", Password: "77553bd3")
- MQTT client connection to HiveMQ broker
- Publishes sensor data to `cement/sensor/data` topic after each side measurement
- Publishes status updates to `cement/sensor/status` topic
- Listens for `START_TEST` command on `cement/sensor/control` topic
- Waits for MQTT command instead of auto-starting on power-up

**Required Libraries:**

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
```

Install via Arduino IDE Library Manager:

- WiFi (built-in for ESP32)
- PubSubClient by Nick O'Leary

**MQTT Topics:**

- `cement/sensor/data` - Publishes sensor measurements (JSON format)
- `cement/sensor/status` - Publishes device status (ONLINE, READY, TEST_STARTED, TEST_COMPLETED)
- `cement/sensor/control` - Receives commands (START_TEST)

**Data Format:**

```json
{
  "side": 1,
  "sensor1": 60,
  "sensor2": 60,
  "sensor3": 60,
  "sensor4": 60,
  "timestamp": 12345
}
```

### 2. Backend Server (`strength-backend/`)

**New Dependencies:**

```bash
npm install mqtt socket.io
```

**New Files:**

- `src/services/mqttService.js` - MQTT client service with Socket.IO integration

**New API Endpoints:**

- `POST /api/sensor/start-test` - Triggers ESP32 to start measurement
- `GET /api/sensor/data` - Get current sensor data
- `GET /api/sensor/status` - Get device connection status

**Socket.IO Events:**

- `initialData` - Sent to newly connected clients with current sensor data
- `sensorData` - Broadcasts sensor data when received from MQTT
- `testStatus` - Broadcasts test status updates

**Environment Variables (.env):**

```env
MQTT_BROKER=mqtt://broker.hivemq.com
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

### 3. Frontend (`frontend/`)

**New Dependency:**

```bash
npm install socket.io-client
```

**Updated Component:**

- `src/pages/CompressiveStrengthDetail.js`

**New Features:**

- **Test Now Button** - Triggers ESP32 measurement via MQTT
- **Real-time Data Updates** - Displays sensor data as it arrives
- **Status Indicators** - Shows device status (Idle, Ready, Measuring, Completed)
- **Visual Feedback** - Green borders for received sensor data
- **Auto-calculation** - Automatically calculates dimensions when test completes

**Socket.IO Connection:**

```javascript
const socket = io("http://localhost:5000");
```

## Setup Instructions

### Step 1: Update ESP32 Firmware

1. Open `mesherment_IOT/Meshement.ino` in Arduino IDE
2. Install required libraries:
   - Go to **Sketch → Include Library → Manage Libraries**
   - Search and install: `PubSubClient`
3. Verify WiFi credentials in code:
   ```cpp
   const char* ssid = "Dialog 4G 236";
   const char* password = "77553bd3";
   ```
4. Upload to ESP32

### Step 2: Install Backend Dependencies

```bash
cd strength-backend
npm install
```

### Step 3: Configure Backend Environment

Create/update `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cement_strength
MQTT_BROKER=mqtt://broker.hivemq.com
```

### Step 4: Start Backend Server

```bash
cd strength-backend
npm start
```

You should see:

```
✅ MQTT Connected successfully
📡 Subscribed to cement/sensor/data
📡 Subscribed to cement/sensor/status
🚀 Cement Strength Test API Server
📡 Server running on port: 5000
🔌 Socket.IO enabled
📱 MQTT enabled
```

### Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 6: Start Frontend Development Server

```bash
cd frontend
npm start
```

Frontend should open at `http://localhost:3000`

## Usage Flow

1. **Power On ESP32**
   - Connects to WiFi
   - Connects to MQTT broker
   - Publishes "READY" status
   - Waits for START_TEST command

2. **Open Frontend**
   - Navigate to Compressive Strength Detail page
   - Frontend connects to backend via Socket.IO
   - Status indicator shows "Device Ready"

3. **Start Test**
   - Click "Test Now" button
   - Backend publishes START_TEST to MQTT
   - ESP32 begins measurement sequence
   - Status changes to "Measuring..."

4. **Real-time Updates**
   - As ESP32 measures each side (1-4):
     - Sensor data published to MQTT
     - Backend receives and broadcasts via Socket.IO
     - Frontend displays data in real-time
     - Visual indicators turn green when data received

5. **Test Completion**
   - After all 4 sides measured:
     - ESP32 publishes "TEST_COMPLETED" status
     - ESP32 returns to home position
     - Frontend auto-calculates dimensions
     - Status shows "Completed"

6. **Save Results**
   - Review calculated dimensions
   - Fill in additional test parameters
   - Save to database

## Troubleshooting

### ESP32 Not Connecting to WiFi

- Verify SSID and password are correct
- Check WiFi signal strength
- Ensure ESP32 is within range
- Check Serial Monitor for connection messages

### MQTT Connection Failed

- Verify internet connectivity
- Try alternative MQTT broker: `mqtt://test.mosquitto.org`
- Check firewall settings

### Backend Not Receiving Data

- Check backend console for MQTT connection status
- Verify MQTT_BROKER environment variable
- Ensure topics match between ESP32 and backend

### Frontend Not Updating

- Open browser console (F12)
- Check for Socket.IO connection messages
- Verify backend URL in frontend code
- Check CORS settings in backend

### Sensor Data Not Appearing

- Check ESP32 Serial Monitor for sensor readings
- Verify sensors are properly connected
- Check I2C addresses are correct
- Ensure all 4 sensors are initialized

## MQTT Broker Alternatives

If HiveMQ public broker is slow or unavailable, you can use:

1. **Mosquitto Public Broker**

   ```env
   MQTT_BROKER=mqtt://test.mosquitto.org
   ```

2. **Local Mosquitto Broker**

   ```bash
   # Install Mosquitto
   sudo apt-get install mosquitto mosquitto-clients

   # Update .env
   MQTT_BROKER=mqtt://localhost:1883
   ```

3. **CloudMQTT** (Free tier available)
   - Sign up at https://www.cloudmqtt.com
   - Get connection details
   - Update MQTT_BROKER with provided URL

## Testing MQTT Connection

### Test with MQTT CLI (mosquitto_sub/pub)

**Subscribe to sensor data:**

```bash
mosquitto_sub -h broker.hivemq.com -t "cement/sensor/data"
```

**Publish test command:**

```bash
mosquitto_pub -h broker.hivemq.com -t "cement/sensor/control" -m "START_TEST"
```

## Security Notes

⚠️ **Production Recommendations:**

- Use private MQTT broker with authentication
- Enable TLS/SSL encryption
- Implement access control lists (ACL)
- Use secure WebSocket (wss://) for Socket.IO
- Add authentication to backend API endpoints
- Validate all incoming MQTT messages

## Data Flow Diagram

```
┌─────────────┐
│   ESP32     │
│   Device    │
└──────┬──────┘
       │ WiFi: Dialog 4G 236
       │ MQTT Publish (cement/sensor/data)
       ↓
┌─────────────────┐
│  HiveMQ Broker  │
│ broker.hivemq   │
│     .com        │
└────────┬────────┘
         │ MQTT Subscribe
         ↓
┌─────────────────┐
│  Backend Server │
│   (Node.js)     │
│  Port: 5000     │
└────────┬────────┘
         │ Socket.IO Broadcast
         ↓
┌─────────────────┐
│   Frontend      │
│   (React)       │
│  Port: 3000     │
└─────────────────┘
```

## Next Steps

1. **Add Authentication**
   - Implement user login
   - Secure MQTT with username/password
   - Add JWT tokens for API access

2. **Data Persistence**
   - Store all sensor readings in MongoDB
   - Create historical data API
   - Add data export functionality

3. **Error Handling**
   - Implement retry logic for failed measurements
   - Add sensor health monitoring
   - Create alert system for anomalies

4. **UI Enhancements**
   - Add real-time charts for sensor data
   - Implement measurement progress bar
   - Add historical test comparison

## Support

For issues or questions:

1. Check ESP32 Serial Monitor logs
2. Check backend console logs
3. Check browser console (F12)
4. Verify all services are running
5. Test MQTT connection independently

---

**Last Updated:** March 5, 2026
**Version:** 1.0.0
