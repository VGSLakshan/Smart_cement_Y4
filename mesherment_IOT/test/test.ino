/*
 * NEMA 17 Stepper Motor Test Code
 * DRV8825 Driver with ESP32
 * 
 * This code tests the NEMA 17 stepper motor with basic movements:
 * - Forward rotation
 * - Backward rotation
 * - Speed variations
 * - Different step counts
 */

// ---------------- STEPPER (DRV8825) PINS ----------------
const int PIN_DIR     = 27;   // Direction pin
const int PIN_STEP    = 14;   // Step pin
const int PIN_SLP_RST = 13;   // Sleep/Reset pin (tied together)
const int PIN_EN      = 23;   // Enable pin (LOW = enabled, HIGH = disabled)

// ---------------- MOTOR CONFIGURATION ----------------
// Adjust STEPS_PER_REV based on your microstepping configuration:
// Full step = 200, 1/2 = 400, 1/4 = 800, 1/8 = 1600, 1/16 = 3200, 1/32 = 6400
const uint32_t STEPS_PER_REV = 2000;  // Full rotation steps

// Speed control (microseconds between step pulses)
const uint32_t SPEED_SLOW   = 8000;   // Slow speed
const uint32_t SPEED_MEDIUM = 5600;   // Medium speed
const uint32_t SPEED_FAST   = 3000;   // Fast speed

// Test parameters
const uint32_t TEST_ANGLE = 90;       // Test rotation angle (degrees)
const uint32_t HOLD_TIME = 2000;      // Hold time after movement (ms)
const uint32_t PAUSE_TIME = 3000;     // Pause between tests (ms)

// ---------------- HELPER FUNCTIONS ----------------

// Calculate steps for a given angle
uint32_t stepsForAngle(uint32_t angleDeg) {
  return (uint32_t)((angleDeg * STEPS_PER_REV) / 360UL);
}

// Enable the motor driver
void motorEnable() {
  digitalWrite(PIN_SLP_RST, HIGH);  // Wake from sleep
  delay(3);                         // Wait for driver to wake up
  digitalWrite(PIN_EN, LOW);        // Enable driver (LOW = enabled)
  delay(2);
  Serial.println("Motor enabled");
}

// Disable the motor driver (coils off, no holding torque)
void motorDisable() {
  digitalWrite(PIN_STEP, LOW);
  digitalWrite(PIN_EN, HIGH);       // Disable driver (HIGH = disabled)
  Serial.println("Motor disabled (coils off)");
}

// Put motor driver to sleep
void motorSleep() {
  digitalWrite(PIN_STEP, LOW);
  digitalWrite(PIN_EN, HIGH);       // Disable
  digitalWrite(PIN_SLP_RST, LOW);   // Sleep
  Serial.println("Motor in sleep mode");
}

// Rotate motor by specified steps
void rotateSteps(uint32_t steps, bool clockwise, uint32_t speedUs) {
  motorEnable();
  
  // Set direction
  digitalWrite(PIN_DIR, clockwise ? HIGH : LOW);
  delay(1);
  
  Serial.print("Rotating ");
  Serial.print(steps);
  Serial.print(" steps ");
  Serial.print(clockwise ? "clockwise" : "counter-clockwise");
  Serial.print(" at speed ");
  Serial.println(speedUs);
  
  // Generate step pulses
  for (uint32_t i = 0; i < steps; i++) {
    digitalWrite(PIN_STEP, HIGH);
    delayMicroseconds(speedUs / 2);
    digitalWrite(PIN_STEP, LOW);
    delayMicroseconds(speedUs / 2);
  }
  
  Serial.println("Movement complete");
}

// Rotate motor by specified angle
void rotateAngle(uint32_t angleDeg, bool clockwise, uint32_t speedUs) {
  uint32_t steps = stepsForAngle(angleDeg);
  Serial.print("Rotating ");
  Serial.print(angleDeg);
  Serial.println(" degrees");
  rotateSteps(steps, clockwise, speedUs);
}

// Full rotation test
void testFullRotation(bool clockwise, uint32_t speedUs) {
  Serial.println("\n--- Full Rotation Test ---");
  rotateAngle(360, clockwise, speedUs);
  delay(HOLD_TIME);
  motorDisable();
}

// Back and forth test
void testBackAndForth(uint32_t angleDeg, uint32_t speedUs) {
  Serial.println("\n--- Back and Forth Test ---");
  
  rotateAngle(angleDeg, true, speedUs);
  delay(HOLD_TIME);
  
  rotateAngle(angleDeg, false, speedUs);
  delay(HOLD_TIME);
  
  motorDisable();
}

// Speed comparison test
void testSpeedComparison(uint32_t angleDeg) {
  Serial.println("\n--- Speed Comparison Test ---");
  
  Serial.println("SLOW speed:");
  rotateAngle(angleDeg, true, SPEED_SLOW);
  delay(HOLD_TIME);
  
  Serial.println("MEDIUM speed:");
  rotateAngle(angleDeg, true, SPEED_MEDIUM);
  delay(HOLD_TIME);
  
  Serial.println("FAST speed:");
  rotateAngle(angleDeg, true, SPEED_FAST);
  delay(HOLD_TIME);
  
  motorDisable();
}

// Micro-stepping test
void testMicroSteps() {
  Serial.println("\n--- Micro-stepping Test ---");
  
  motorEnable();
  
  Serial.println("Small incremental steps:");
  for (int i = 0; i < 10; i++) {
    rotateSteps(10, true, SPEED_MEDIUM);
    delay(500);
  }
  
  motorDisable();
}

// Continuous rotation test
void testContinuousRotation(uint32_t durationMs, uint32_t speedUs) {
  Serial.println("\n--- Continuous Rotation Test ---");
  Serial.print("Rotating continuously for ");
  Serial.print(durationMs);
  Serial.println(" ms");
  
  motorEnable();
  digitalWrite(PIN_DIR, HIGH);
  
  unsigned long startTime = millis();
  uint32_t stepCount = 0;
  
  while (millis() - startTime < durationMs) {
    digitalWrite(PIN_STEP, HIGH);
    delayMicroseconds(speedUs / 2);
    digitalWrite(PIN_STEP, LOW);
    delayMicroseconds(speedUs / 2);
    stepCount++;
  }
  
  Serial.print("Completed ");
  Serial.print(stepCount);
  Serial.println(" steps");
  
  motorDisable();
}

// Countdown helper
void countdown(int seconds) {
  for (int i = seconds; i > 0; i--) {
    Serial.print(i);
    Serial.println("...");
    delay(1000);
  }
}

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Configure pins
  pinMode(PIN_DIR, OUTPUT);
  pinMode(PIN_STEP, OUTPUT);
  pinMode(PIN_SLP_RST, OUTPUT);
  pinMode(PIN_EN, OUTPUT);
  
  // Initialize to safe state
  digitalWrite(PIN_STEP, LOW);
  digitalWrite(PIN_EN, HIGH);      // Disabled
  digitalWrite(PIN_SLP_RST, LOW);  // Sleep
  
  Serial.println("\n=================================");
  Serial.println("   NEMA 17 Motor Test System");
  Serial.println("   DRV8825 Driver with ESP32");
  Serial.println("=================================");
  Serial.println();
  Serial.print("Steps per revolution: ");
  Serial.println(STEPS_PER_REV);
  Serial.println();
  Serial.println("Starting test sequence in 3 seconds...");
  
  countdown(3);
}

// ---------------- MAIN LOOP ----------------
void loop() {
  Serial.println("\n\n========== TEST SEQUENCE START ==========\n");
  
  // Test 1: Full clockwise rotation
  testFullRotation(true, SPEED_MEDIUM);
  delay(PAUSE_TIME);
  
  // Test 2: Full counter-clockwise rotation
  testFullRotation(false, SPEED_MEDIUM);
  delay(PAUSE_TIME);
  
  // Test 3: Back and forth 90 degrees
  testBackAndForth(TEST_ANGLE, SPEED_MEDIUM);
  delay(PAUSE_TIME);
  
  // Test 4: Speed comparison
  testSpeedComparison(TEST_ANGLE);
  delay(PAUSE_TIME);
  
  // Test 5: Micro-stepping
  testMicroSteps();
  delay(PAUSE_TIME);
  
  // Test 6: Continuous rotation for 5 seconds
  testContinuousRotation(5000, SPEED_MEDIUM);
  delay(PAUSE_TIME);
  
  Serial.println("\n========== TEST SEQUENCE COMPLETE ==========\n");
  Serial.println("All tests completed successfully!");
  Serial.println("Motor in sleep mode.");
  Serial.println("\nRestarting test sequence in 10 seconds...\n");
  
  motorSleep();
  
  countdown(10);
}
