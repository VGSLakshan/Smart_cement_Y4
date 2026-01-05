# INSEE Smart Cement Platform

![INSEE Logo](frontend/public/insee-logo.png)

## 🏗️ Project Overview

The **INSEE Smart Cement Platform** is an advanced AI-powered prediction and analysis system designed for cement quality control and research. This comprehensive platform integrates four cutting-edge machine learning components to revolutionize cement manufacturing processes through real-time monitoring, quality assessment, and predictive analytics.

### Key Features

- 🎯 **Multi-Output Strength Prediction**: Predict cement compressive strength at 1D, 2D, 7D, 28D, and 56D using ensemble ML models (XGBoost + LightGBM)
- 🔬 **Raw Meal Particle Analysis**: YOLO v8-based particle detection and color identification for quality control
- 🧱 **Crack Detection System**: Deep learning U-Net segmentation for structural integrity analysis
- 📊 **IoT Cube Monitoring**: Real-time environmental data tracking during cement curing process
- 🔐 **Secure Authentication**: JWT-based user authentication and session management
- 📈 **Historical Analytics**: Track predictions, generate reports, and analyze trends

```

### Four Research Components

1. **IoT-Based Cube Dimension Monitoring**
   - Real-time tracking of cement cube dimensions
   - Environmental data logging (temperature, humidity)
   - TensorFlow-based time series analysis

2. **Material Mix Ratio and Temperature Analysis**
   - YOLO v8 object detection for particle identification
   - Color-based quality assessment
   - Size and distribution analysis

3. **Compressive Strength and Crack Detection**
   - U-Net deep learning segmentation
   - Structural integrity assessment
   - Crack severity analysis

4. **Cement Strength Prediction (Multi-Output)**
   - Predict strength at 5 time intervals (1D, 2D, 7D, 28D, 56D)
   - Ensemble learning (XGBoost + LightGBM)
   - 14 input parameters (physical + chemical composition)

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Build Tool**: Webpack (via react-scripts)

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn (ASGI)
- **Language**: Python 3.13
- **Validation**: Pydantic
- **Authentication**: JWT

### Machine Learning & AI
- **TensorFlow**: 2.20.0 (IoT monitoring, crack detection)
- **PyTorch**: 2.9.1 (YOLO models)
- **Ultralytics YOLO**: 8.3.248 (particle detection)
- **XGBoost**: Latest (strength prediction)
- **LightGBM**: Latest (strength prediction)
- **Keras**: 3.13.0
- **Scikit-learn**: Latest

### Data Processing
- **NumPy**: 2.2.6
- **Pandas**: Latest
- **Polars**: 1.36.1
- **OpenCV**: 4.12.0
- **Pillow**: 12.0.0
- **Matplotlib**: 3.10.7

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher
- **Python**: 3.13 or higher
- **pip**: Latest version
- **Git**: For version control

---

## 📦 Dependencies

### Frontend Dependencies

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.0.0",
  "lucide-react": "latest",
  "tailwindcss": "^3.0.0"
}
```

### Backend Dependencies

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
python-multipart
tensorflow>=2.15.0
torch>=2.0.0
torchvision>=0.15.0
ultralytics>=8.0.0
opencv-python>=4.10.0
pillow>=10.3.0
numpy>=2.1.0
pandas>=2.0.0
polars>=0.20.0
scikit-learn>=1.3.0
xgboost>=2.0.0
lightgbm>=4.0.0
matplotlib>=3.7.0
scipy>=1.10.0
pyyaml>=6.0
psutil>=5.9.0
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/VGSLakshan/Smart_cement_Y4.git
cd Smart_cement_Y4
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Alternative: Install specific packages
pip install fastapi uvicorn tensorflow torch ultralytics opencv-python numpy pandas
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Install additional required packages
npm install lucide-react axios
```

---

## ▶️ Running the Project

### Start Backend Server

```bash
# From the backend directory
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at**: `http://localhost:8000`
**API Documentation**: `http://localhost:8000/docs`

### Start Frontend Development Server

```bash
# From the frontend directory (in a new terminal)
cd frontend
npm start
```

**Frontend will be available at**: `http://localhost:3000`

### Running Both Servers Simultaneously

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

---

## 📁 Project Structure

```
Smart_cement_Y4/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── routes/
│   │   │   ├── hirumi/            # Strength prediction endpoints
│   │   │   ├── kanchana/          # Raw meal analysis endpoints
│   │   │   └── sanchitha/         # Crack detection endpoints
│   │   └── services/              # Business logic and ML services
│   ├── ml_models/
│   │   ├── kanchana/
│   │   │   └── best.pt            # YOLO model (56MB)
│   │   └── sanchitha/
│   │       └── unet_seg_crack.h5  # U-Net model (23MB)
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── insee-logo.png
│   ├── src/
│   │   ├── App.js                 # Main application component
│   │   ├── components/
│   │   │   ├── Navbar.js          # Top navigation bar
│   │   │   ├── Sidebar.js         # Left sidebar navigation
│   │   │   └── ResearchCard.js    # Component cards
│   │   └── pages/
│   │       ├── Home.js            # Dashboard
│   │       ├── Login.js           # Authentication
│   │       ├── CementStrengthDetail.js        # Component 4
│   │       ├── CompressiveStrengthDetail.js   # Component 3
│   │       └── RawMealPages.js               # Component 2
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/app/main.py` for CORS settings:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend API Configuration

Update API endpoint in frontend components if needed:

```javascript
const response = await fetch('http://localhost:8000/api/hirumi/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

---

## 👥 Contributors

- **Sanchitha** - Crack Detection System (Component 3)
- **Chamudini** -  (Component 1)
- **Kanchana** - Raw Meal Particle Analysis (Component 2)
- **Hirumi** - Cement Strength Prediction (Component 4)

---

## 📄 License

This project is developed for **INSEE Cement - AI Research Lab**.  
© 2025 INSEE. All rights reserved.

---

## 🔗 Related Links

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **TensorFlow**: https://www.tensorflow.org/
- **Ultralytics YOLO**: https://docs.ultralytics.com/

---

## 📧 Support

For questions or issues, please contact the INSEE AI Research Lab team.

**Built with ❤️ for Innovation in Cement Manufacturing**
