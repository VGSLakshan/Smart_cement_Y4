const mqtt = require("mqtt");

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.sensorData = {
      side1: null,
      side2: null,
      side3: null,
      side4: null,
    };
    this.testStatus = "IDLE";
    this.io = null; // Socket.IO instance
  }

  /**
   * Initialize MQTT client and set up Socket.IO
   * @param {Object} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;

    const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com";
    const MQTT_TOPIC_SENSOR = "cement/sensor/data";
    const MQTT_TOPIC_STATUS = "cement/sensor/status";
    const MQTT_TOPIC_CONTROL = "cement/sensor/control";

    console.log("Connecting to MQTT broker:", MQTT_BROKER);
    this.client = mqtt.connect(MQTT_BROKER, {
      clientId: `cement-backend-${Math.random().toString(16).slice(3)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    // Connection successful
    this.client.on("connect", () => {
      console.log("✅ MQTT Connected successfully");
      this.isConnected = true;

      // Subscribe to topics
      this.client.subscribe(MQTT_TOPIC_SENSOR, (err) => {
        if (!err) {
          console.log(`📡 Subscribed to ${MQTT_TOPIC_SENSOR}`);
        } else {
          console.error("Subscription error:", err);
        }
      });

      this.client.subscribe(MQTT_TOPIC_STATUS, (err) => {
        if (!err) {
          console.log(`📡 Subscribed to ${MQTT_TOPIC_STATUS}`);
        } else {
          console.error("Subscription error:", err);
        }
      });
    });

    // Handle incoming messages
    this.client.on("message", (topic, message) => {
      try {
        const msg = message.toString();
        console.log(`📨 Received [${topic}]:`, msg);

        if (topic === MQTT_TOPIC_SENSOR) {
          // Parse sensor data
          const data = JSON.parse(msg);
          const side = `side${data.side}`;

          this.sensorData[side] = {
            sensor1: data.sensor1,
            sensor2: data.sensor2,
            sensor3: data.sensor3,
            sensor4: data.sensor4,
            timestamp: data.timestamp || Date.now(),
          };

          // Broadcast to all connected clients via Socket.IO
          if (this.io) {
            this.io.emit("sensorData", {
              side: data.side,
              data: this.sensorData[side],
            });
            console.log(`📤 Broadcasted sensor data for side ${data.side}`);
          }
        } else if (topic === MQTT_TOPIC_STATUS) {
          this.testStatus = msg;

          // Broadcast status update
          if (this.io) {
            this.io.emit("testStatus", { status: msg });
            console.log(`📤 Broadcasted status: ${msg}`);
          }
        }
      } catch (error) {
        console.error("Error processing MQTT message:", error);
      }
    });

    // Handle errors
    this.client.on("error", (error) => {
      console.error("❌ MQTT Error:", error);
      this.isConnected = false;
    });

    // Handle connection lost
    this.client.on("offline", () => {
      console.log("⚠️  MQTT offline");
      this.isConnected = false;
    });

    // Handle reconnect
    this.client.on("reconnect", () => {
      console.log("🔄 MQTT reconnecting...");
    });
  }

  /**
   * Publish START_TEST command to ESP32
   */
  startTest() {
    if (!this.isConnected) {
      throw new Error("MQTT not connected");
    }

    // Reset sensor data
    this.sensorData = {
      side1: null,
      side2: null,
      side3: null,
      side4: null,
    };

    const MQTT_TOPIC_CONTROL = "cement/sensor/control";
    this.client.publish(MQTT_TOPIC_CONTROL, "START_TEST");
    console.log("🚀 Published START_TEST command");

    return { success: true, message: "Test started" };
  }

  /**
   * Get current sensor data
   */
  getSensorData() {
    return {
      ...this.sensorData,
      status: this.testStatus,
    };
  }

  /**
   * Get test status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      status: this.testStatus,
    };
  }

  /**
   * Close MQTT connection
   */
  close() {
    if (this.client) {
      this.client.end();
      console.log("MQTT connection closed");
    }
  }
}

// Export singleton instance
module.exports = new MQTTService();
