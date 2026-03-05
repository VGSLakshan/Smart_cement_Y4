#include <Wire.h>
#include "Adafruit_VL53L0X.h"
#include <WiFi.h>
#include <PubSubClient.h>

// ---------------- WiFi & MQTT Configuration ----------------
const char* ssid = "Dialog 4G 236";
const char* password = "77553bd3";
const char* mqtt_server = "broker.hivemq.com";  // Public MQTT broker
const int mqtt_port = 1883;
const char* mqtt_topic_sensor = "cement/sensor/data";
const char* mqtt_topic_control = "cement/sensor/control";
const char* mqtt_topic_status = "cement/sensor/status";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ---------------- I2C PINS (ESP32) ----------------
#define I2C_SDA 21
#define I2C_SCL 22

// ---------------- XSHUT PINS (4 Sensors) ----------------
const int XSHUT_1 = 32;
const int XSHUT_2 = 33;
const int XSHUT_3 = 25;
const int XSHUT_4 = 26;

// New I2C addresses (must be different)
#define ADDR_1 0x30
#define ADDR_2 0x31
#define ADDR_3 0x32
#define ADDR_4 0x33

// ---------------- STEPPER (DRV8825) ----------------
const int PIN_DIR     = 27;
const int PIN_STEP    = 14;
const int PIN_SLP_RST = 13;

// ✅ EN pin (output-capable)
const int PIN_EN      = 23;   // DRV8825 EN -> ESP32 GPIO23

// ==== CHANGE THIS if your microstepping differs ====
const uint32_t STEPS_PER_REV = 2000;  // steps for 360°

// Current angles (as in your pasted code)
const uint32_t ANGLE_SIDE      = 27;
const uint32_t ANGLE_HOME_BACK = 81;

// Current speed (as in your pasted code)
const uint32_t STEP_TOGGLE_US  = 5600;

// Hold after each move
const uint32_t HOLD_MS = 2000;

// ---------- CALIBRATION OFFSETS (mm) ----------
const int16_t CAL_S1 = -16;
const int16_t CAL_S2 = -4;
const int16_t CAL_S3 = -20;
const int16_t CAL_S4 = -27;

// ✅ RULE: when printing/using sensor values, if <58 then output 60
const uint16_t MIN_LIMIT = 58;
const uint16_t FORCE_VALUE = 60;

// ---------------- SENSORS ----------------
Adafruit_VL53L0X lox1, lox2, lox3, lox4;

// ---------------- TIMER (ESP32 core 3.x) ----------------
hw_timer_t *stepTimer = nullptr;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

volatile bool     stepRunning  = false;
volatile bool     stepDoneFlag = false;
volatile uint32_t stepCount    = 0;
volatile uint32_t stepTarget   = 0;
volatile bool     stepPinState = false;

void ARDUINO_ISR_ATTR onStepTimer() {
  portENTER_CRITICAL_ISR(&timerMux);

  if (!stepRunning) {
    portEXIT_CRITICAL_ISR(&timerMux);
    return;
  }

  stepPinState = !stepPinState;
  digitalWrite(PIN_STEP, stepPinState);

  // count 1 step on rising edge
  if (stepPinState) {
    stepCount++;
    if (stepCount >= stepTarget) {
      stepRunning  = false;
      stepDoneFlag = true;
      digitalWrite(PIN_STEP, LOW);
      stepPinState = false;
    }
  }

  portEXIT_CRITICAL_ISR(&timerMux);
}

void startSmoothSteps(uint32_t targetSteps) {
  portENTER_CRITICAL(&timerMux);
  stepTarget   = targetSteps;
  stepCount    = 0;
  stepRunning  = true;
  stepDoneFlag = false;
  stepPinState = false;
  digitalWrite(PIN_STEP, LOW);
  portEXIT_CRITICAL(&timerMux);

  timerWrite(stepTimer, 0);
  timerStart(stepTimer);
}

bool stepIsDone() {
  portENTER_CRITICAL(&timerMux);
  bool done = stepDoneFlag;
  portEXIT_CRITICAL(&timerMux);
  return done;
}

void clearStepDoneFlag() {
  portENTER_CRITICAL(&timerMux);
  stepDoneFlag = false;
  portEXIT_CRITICAL(&timerMux);
}

void waitMoveDoneAndStopTimer() {
  while (!stepIsDone()) delay(1);
  timerStop(stepTimer);
  clearStepDoneFlag();
}

// ---------------- helpers ----------------
uint32_t stepsForAngle(uint32_t angleDeg) {
  return (uint32_t)((angleDeg * STEPS_PER_REV) / 360UL);
}

void countdownSeconds(uint32_t sec) {
  for (int i = (int)sec; i >= 1; i--) {
    Serial.print(i);
    Serial.println("...");
    delay(1000);
  }
}

// ---------------- motor control ----------------
// DRV8825 EN: LOW = enabled, HIGH = disabled
void motorWakeForMove() {
  digitalWrite(PIN_SLP_RST, HIGH);
  delay(3);
  digitalWrite(PIN_EN, LOW);    // enable driver
  delay(2);
}

void motorHold() {
  digitalWrite(PIN_SLP_RST, HIGH);
  digitalWrite(PIN_EN, LOW);    // enabled => hold torque
  delay(2);
}

void motorRelease() {
  digitalWrite(PIN_STEP, LOW);
  digitalWrite(PIN_EN, HIGH);   // disabled => coils off
}

void motorSleep() {
  timerStop(stepTimer);
  digitalWrite(PIN_STEP, LOW);
  digitalWrite(PIN_EN, HIGH);   // disable
  digitalWrite(PIN_SLP_RST, LOW);
}

// ---------------- sensors power & init ----------------
void sensorsPowerOff() {
  digitalWrite(XSHUT_1, LOW);
  digitalWrite(XSHUT_2, LOW);
  digitalWrite(XSHUT_3, LOW);
  digitalWrite(XSHUT_4, LOW);
  delay(10);
}

bool sensorsPowerOnAndInit() {
  sensorsPowerOff();

  digitalWrite(XSHUT_1, HIGH);
  delay(10);
  if (!lox1.begin(0x29, false, &Wire)) return false;
  lox1.setAddress(ADDR_1);

  digitalWrite(XSHUT_2, HIGH);
  delay(10);
  if (!lox2.begin(0x29, false, &Wire)) return false;
  lox2.setAddress(ADDR_2);

  digitalWrite(XSHUT_3, HIGH);
  delay(10);
  if (!lox3.begin(0x29, false, &Wire)) return false;
  lox3.setAddress(ADDR_3);

  digitalWrite(XSHUT_4, HIGH);
  delay(10);
  if (!lox4.begin(0x29, false, &Wire)) return false;
  lox4.setAddress(ADDR_4);

  return true;
}

// ---------------- calibration + rule ----------------
uint16_t applyMinRule(uint16_t v) {
  // if <58 -> output 60 (as you requested)
  return (v < MIN_LIMIT) ? FORCE_VALUE : v;
}

// ---------------- sensor reading (CALIBRATED + RULE APPLIED) ----------------
bool readOneMM(Adafruit_VL53L0X &lox, int16_t calOffset, uint16_t &mmOut) {
  VL53L0X_RangingMeasurementData_t m;
  lox.rangingTest(&m, false);

  if (m.RangeStatus != 4) {
    int32_t v = (int32_t)m.RangeMilliMeter + (int32_t)calOffset;
    if (v < 0) v = 0;

    uint16_t out = (uint16_t)v;
    out = applyMinRule(out);      // ✅ apply rule for ALL printed/used sensor values
    mmOut = out;
    return true;
  }
  return false;
}

// For ONE LINE: take 8 readings per sensor -> avg8 per sensor
void lineAvg8PerSensor(uint16_t &a1, bool &v1,
                       uint16_t &a2, bool &v2,
                       uint16_t &a3, bool &v3,
                       uint16_t &a4, bool &v4) {
  uint32_t s1=0,s2=0,s3=0,s4=0;
  uint8_t  c1=0,c2=0,c3=0,c4=0;

  for (int i=0; i<8; i++) {
    uint16_t mm;
    if (readOneMM(lox1, CAL_S1, mm)) { s1 += mm; c1++; }
    if (readOneMM(lox2, CAL_S2, mm)) { s2 += mm; c2++; }
    if (readOneMM(lox3, CAL_S3, mm)) { s3 += mm; c3++; }
    if (readOneMM(lox4, CAL_S4, mm)) { s4 += mm; c4++; }
    delay(5);
  }

  v1 = (c1>0); v2 = (c2>0); v3 = (c3>0); v4 = (c4>0);
  a1 = v1 ? applyMinRule((uint16_t)(s1/c1)) : 0;
  a2 = v2 ? applyMinRule((uint16_t)(s2/c2)) : 0;
  a3 = v3 ? applyMinRule((uint16_t)(s3/c3)) : 0;
  a4 = v4 ? applyMinRule((uint16_t)(s4/c4)) : 0;
}

// Measure one side:
// - motor fully sleep/release while reading
// - prints 8 lines (Sensor1..4 avg8 each line)
// - then prints per-sensor side average (avg of 8 lines)
bool measureSide(int sideNo,
                 uint16_t &sideS1, bool &sideV1,
                 uint16_t &sideS2, bool &sideV2,
                 uint16_t &sideS3, bool &sideV3,
                 uint16_t &sideS4, bool &sideV4) {

  motorSleep(); // motor low while reading

  uint32_t sumS1=0,sumS2=0,sumS3=0,sumS4=0;
  uint8_t  cntS1=0,cntS2=0,cntS3=0,cntS4=0;

  for (int line=1; line<=8; line++) {
    uint16_t a1,a2,a3,a4;
    bool v1,v2,v3,v4;

    lineAvg8PerSensor(a1,v1,a2,v2,a3,v3,a4,v4);

    Serial.print("Side ");
    Serial.print(sideNo);
    Serial.print(" - Line ");
    Serial.print(line);
    Serial.print(" | Sensor1: "); Serial.print(v1 ? String(a1) + "mm" : "OUT");
    Serial.print(" | Sensor2: "); Serial.print(v2 ? String(a2) + "mm" : "OUT");
    Serial.print(" | Sensor3: "); Serial.print(v3 ? String(a3) + "mm" : "OUT");
    Serial.print(" | Sensor4: "); Serial.println(v4 ? String(a4) + "mm" : "OUT");

    if (v1) { sumS1 += a1; cntS1++; }
    if (v2) { sumS2 += a2; cntS2++; }
    if (v3) { sumS3 += a3; cntS3++; }
    if (v4) { sumS4 += a4; cntS4++; }

    delay(120);
  }

  sideV1 = (cntS1>0); sideV2=(cntS2>0); sideV3=(cntS3>0); sideV4=(cntS4>0);
  sideS1 = sideV1 ? applyMinRule((uint16_t)(sumS1/cntS1)) : 0;
  sideS2 = sideV2 ? applyMinRule((uint16_t)(sumS2/cntS2)) : 0;
  sideS3 = sideV3 ? applyMinRule((uint16_t)(sumS3/cntS3)) : 0;
  sideS4 = sideV4 ? applyMinRule((uint16_t)(sumS4/cntS4)) : 0;

  Serial.print("avarage of ");
  Serial.print(sideNo);
  Serial.println(" side readings:");
  Serial.print("  Sensor1: "); Serial.println(sideV1 ? String(sideS1) + " mm" : "OUT");
  Serial.print("  Sensor2: "); Serial.println(sideV2 ? String(sideS2) + " mm" : "OUT");
  Serial.print("  Sensor3: "); Serial.println(sideV3 ? String(sideS3) + " mm" : "OUT");
  Serial.print("  Sensor4: "); Serial.println(sideV4 ? String(sideS4) + " mm" : "OUT");

  return (sideV1 || sideV2 || sideV3 || sideV4);
}

// Rotate: move -> HOLD 2s -> RELEASE
void rotateAngleWithHold(uint32_t angleDeg, bool forwardDir) {
  motorWakeForMove();
  digitalWrite(PIN_DIR, forwardDir ? HIGH : LOW);

  uint32_t steps = stepsForAngle(angleDeg);
  startSmoothSteps(steps);
  waitMoveDoneAndStopTimer();

  motorHold();
  delay(HOLD_MS);

  motorRelease();
}

// ---------------- RESULTS STORAGE ----------------
uint16_t sideVal[4][4];
bool     sideOk[4][4];
bool testStartRequested = false;
bool testInProgress = false;

// ---------------- WiFi & MQTT Functions ----------------
void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("MQTT Message received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);
  
  if (String(topic) == mqtt_topic_control) {
    if (message == "START_TEST" && !testInProgress) {
      testStartRequested = true;
      Serial.println("Test start requested via MQTT");
    }
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32-Cement-" + String(ESP.getEfuseMac());
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected!");
      mqttClient.subscribe(mqtt_topic_control);
      mqttClient.publish(mqtt_topic_status, "ONLINE");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void publishSensorData(int side, uint16_t s1, uint16_t s2, uint16_t s3, uint16_t s4) {
  String payload = "{";
  payload += "\"side\":" + String(side) + ",";
  payload += "\"sensor1\":" + String(s1) + ",";
  payload += "\"sensor2\":" + String(s2) + ",";
  payload += "\"sensor3\":" + String(s3) + ",";
  payload += "\"sensor4\":" + String(s4) + ",";
  payload += "\"timestamp\":" + String(millis());
  payload += "}";
  
  mqttClient.publish(mqtt_topic_sensor, payload.c_str());
  Serial.print("Published to MQTT: ");
  Serial.println(payload);
}

void publishTestStatus(String status) {
  mqttClient.publish(mqtt_topic_status, status.c_str());
  Serial.print("Status: ");
  Serial.println(status);
}

// ---------------- RESULTS STORAGE ----------------

void setup() {
  Serial.begin(115200);
  delay(50);

  pinMode(PIN_DIR, OUTPUT);
  pinMode(PIN_STEP, OUTPUT);
  pinMode(PIN_SLP_RST, OUTPUT);
  pinMode(PIN_EN, OUTPUT);

  pinMode(XSHUT_1, OUTPUT);
  pinMode(XSHUT_2, OUTPUT);
  pinMode(XSHUT_3, OUTPUT);
  pinMode(XSHUT_4, OUTPUT);

  digitalWrite(PIN_STEP, LOW);
  digitalWrite(PIN_EN, HIGH);     // default release
  digitalWrite(PIN_SLP_RST, LOW); // sleep
  motorSleep();

  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(400000);

  // timer setup (1MHz)
  stepTimer = timerBegin(1000000);
  timerAttachInterrupt(stepTimer, &onStepTimer);
  timerAlarm(stepTimer, STEP_TOGGLE_US, true, 0);
  timerStop(stepTimer);

  Serial.println("=================================");
  Serial.println("Smart Cement Measurement System");
  Serial.println("=================================");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  
  Serial.println("System ready. Waiting for START_TEST command...");
  publishTestStatus("READY");
}

void runMeasurementSequence() {
  testInProgress = true;
  publishTestStatus("TEST_STARTED");
  
  Serial.println("Starting measurement sequence...");
  countdownSeconds(3);

  // -------- SIDE 1 --------
  Serial.println("ready to get senser reading");
  if (!sensorsPowerOnAndInit()) { Serial.println("Sensor init FAIL."); while(true) delay(1000); }
  delay(200);

  measureSide(1,
              sideVal[0][0], sideOk[0][0],
              sideVal[0][1], sideOk[0][1],
              sideVal[0][2], sideOk[0][2],
              sideVal[0][3], sideOk[0][3]);
  sensorsPowerOff();
  
  // Publish Side 1 data via MQTT
  publishSensorData(1, sideVal[0][0], sideVal[0][1], sideVal[0][2], sideVal[0][3]);

  // -------- SIDE 2 --------
  Serial.println("start to rotate 2nd side");
  countdownSeconds(3);
  rotateAngleWithHold(ANGLE_SIDE, true);

  Serial.println("ready to get senser reading");
  countdownSeconds(2);
  if (!sensorsPowerOnAndInit()) { Serial.println("Sensor init FAIL."); while(true) delay(1000); }
  delay(200);

  measureSide(2,
              sideVal[1][0], sideOk[1][0],
              sideVal[1][1], sideOk[1][1],
              sideVal[1][2], sideOk[1][2],
              sideVal[1][3], sideOk[1][3]);
  sensorsPowerOff();
  
  // Publish Side 2 data via MQTT
  publishSensorData(2, sideVal[1][0], sideVal[1][1], sideVal[1][2], sideVal[1][3]);

  // -------- SIDE 3 --------
  Serial.println("start to rotate 3rd side");
  countdownSeconds(3);
  rotateAngleWithHold(ANGLE_SIDE, true);

  Serial.println("ready to get senser reading");
  countdownSeconds(2);
  if (!sensorsPowerOnAndInit()) { Serial.println("Sensor init FAIL."); while(true) delay(1000); }
  delay(200);

  measureSide(3,
              sideVal[2][0], sideOk[2][0],
              sideVal[2][1], sideOk[2][1],
              sideVal[2][2], sideOk[2][2],
              sideVal[2][3], sideOk[2][3]);
  sensorsPowerOff();
  
  // Publish Side 3 data via MQTT
  publishSensorData(3, sideVal[2][0], sideVal[2][1], sideVal[2][2], sideVal[2][3]);

  // -------- SIDE 4 --------
  Serial.println("start to rotate 4th side");
  countdownSeconds(3);
  rotateAngleWithHold(ANGLE_SIDE, true);

  Serial.println("ready to get senser reading");
  countdownSeconds(2);
  if (!sensorsPowerOnAndInit()) { Serial.println("Sensor init FAIL."); while(true) delay(1000); }
  delay(200);

  measureSide(4,
              sideVal[3][0], sideOk[3][0],
              sideVal[3][1], sideOk[3][1],
              sideVal[3][2], sideOk[3][2],
              sideVal[3][3], sideOk[3][3]);
  sensorsPowerOff();
  
  // Publish Side 4 data via MQTT
  publishSensorData(4, sideVal[3][0], sideVal[3][1], sideVal[3][2], sideVal[3][3]);

  Serial.println("cube meshermenet is success");
  for (int s=0; s<4; s++) {
    Serial.print("SIDE "); Serial.print(s+1); Serial.println(" FINAL AVERAGES:");
    Serial.print("  Sensor1: "); Serial.println(sideOk[s][0] ? String(sideVal[s][0]) + " mm" : "OUT");
    Serial.print("  Sensor2: "); Serial.println(sideOk[s][1] ? String(sideVal[s][1]) + " mm" : "OUT");
    Serial.print("  Sensor3: "); Serial.println(sideOk[s][2] ? String(sideVal[s][2]) + " mm" : "OUT");
    Serial.print("  Sensor4: "); Serial.println(sideOk[s][3] ? String(sideVal[s][3]) + " mm" : "OUT");
  }

  Serial.print("return to home position (backward ");
  Serial.print(ANGLE_HOME_BACK);
  Serial.println(")");
  rotateAngleWithHold(ANGLE_HOME_BACK, false);

  Serial.println("DONE");
  motorSleep();
  
  publishTestStatus("TEST_COMPLETED");
  testInProgress = false;
  testStartRequested = false;
}

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Check if test start was requested
  if (testStartRequested && !testInProgress) {
    testStartRequested = false;
    runMeasurementSequence();
  }
  
  delay(100);
}
