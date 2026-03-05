# Quick Start Commands for MQTT Integration

# ==========================================
# STEP 1: Install Backend Dependencies
# ==========================================
Write-Host "Installing Backend Dependencies..." -ForegroundColor Green
cd "strength-backend"
npm install
cd ..

# ==========================================
# STEP 2: Install Frontend Dependencies
# ==========================================
Write-Host "Installing Frontend Dependencies..." -ForegroundColor Green
cd "frontend"
npm install
cd ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload the updated ESP32 code (mesherment_IOT/Meshement.ino)" -ForegroundColor White
Write-Host "   - Install PubSubClient library in Arduino IDE" -ForegroundColor Gray
Write-Host "   - Verify WiFi credentials" -ForegroundColor Gray
Write-Host "   - Upload to ESP32" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the Backend Server:" -ForegroundColor White
Write-Host "   cd strength-backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the Frontend Server:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open Frontend at http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "5. Navigate to Compressive Strength Detail page" -ForegroundColor White
Write-Host ""
Write-Host "6. Click 'Test Now' button to start measurement!" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see MQTT_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
