# Cement Compressive Strength Test - Backend API

MongoDB persistence layer for storing and managing Compressive Strength Test data.

## 🚀 Quick Start

### Prerequisites

- Node.js v16+ and npm
- MongoDB (local or cloud instance)

### Installation

1. **Navigate to the backend directory:**

```bash
cd strength-backend
```

2. **Install dependencies:**

```bash
npm install express mongoose dotenv multer cors
```

3. **Configure environment variables:**

```bash
# Copy the example env file
copy .env.example .env

# Edit .env and set your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/cement_strength_db
# PORT=5000
```

4. **Start the server:**

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
strength-backend/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── models/
│   │   └── StrengthTest.js          # Mongoose schema & model
│   ├── routes/
│   │   └── strengthTests.js         # API routes & controllers
│   ├── middleware/
│   │   └── errorHandler.js          # Centralized error handler
│   └── server.js                    # Express app entry point
├── uploads/
│   └── strength/                    # Uploaded crack images
├── .env                             # Environment variables (create this)
├── .env.example                     # Example environment config
├── .gitignore
└── package.json
```

## 🔌 API Endpoints

### Base URL

```
http://localhost:5000
```

---

### 1. Create Strength Test Record

**Endpoint:** `POST /api/strength-tests`

**Description:** Create a new strength test record. The system automatically computes `avgAreaMm2`, `compressiveStrengthMpa`, `status`, and `cubeGrade`.

**Request Body:**

```json
{
  "cubeId": "CUBE-001",
  "cubeMadeDate": "2026-02-10",
  "testDate": "2026-02-25",
  "testingTime": "10:30 AM",
  "predictGrade": "M20",
  "curingDays": 15,
  "appliedLoadKn": 450,
  "avgLengthMm": 150,
  "avgWidthMm": 150,
  "cubeGrade": "M20"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123def456789",
    "cubeId": "CUBE-001",
    "cubeMadeDate": "2026-02-10T00:00:00.000Z",
    "testDate": "2026-02-25T00:00:00.000Z",
    "testingTime": "10:30 AM",
    "predictGrade": "M20",
    "cubeGrade": "M20",
    "curingDays": 15,
    "avgLengthMm": 150,
    "avgWidthMm": 150,
    "avgAreaMm2": 22500,
    "appliedLoadKn": 450,
    "compressiveStrengthMpa": 20,
    "status": "Passed",
    "createdAt": "2026-02-25T10:30:00.000Z",
    "updatedAt": "2026-02-25T10:30:00.000Z"
  },
  "message": "Strength test record created successfully"
}
```

---

### 2. Upload Crack Image

**Endpoint:** `POST /api/strength-tests/:id/image`

**Description:** Upload a crack image for an existing test record.

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `image` (file): JPG, JPEG, or PNG file (max 5MB)

**Example using curl:**

```bash
curl -X POST http://localhost:5000/api/strength-tests/65abc123def456789/image \
  -F "image=@crack_photo.jpg"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123def456789",
    "cubeId": "CUBE-001",
    ...
    "crackImageUrl": "http://localhost:5000/uploads/strength/crack-1234567890-987654321.jpg",
    "crackImageLocalPath": "C:\\path\\to\\uploads\\strength\\crack-1234567890-987654321.jpg",
    "imageUploadedAt": "2026-02-25T10:35:00.000Z"
  },
  "message": "Image uploaded successfully"
}
```

---

### 3. Get All Tests (with Pagination & Filtering)

**Endpoint:** `GET /api/strength-tests`

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Records per page (default: 20)
- `cubeId` (string): Filter by cube ID (partial match)
- `status` (string): Filter by status ("Passed" or "Failed")
- `sortBy` (string): Sort field (default: "createdAt")
- `sortOrder` (string): Sort order "asc" or "desc" (default: "desc")

**Example:**

```
GET /api/strength-tests?page=1&limit=10&status=Passed&cubeId=CUBE
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      /* test record 1 */
    },
    {
      /* test record 2 */
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 47,
    "recordsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 4. Get Single Test

**Endpoint:** `GET /api/strength-tests/:id`

**Example:**

```
GET /api/strength-tests/65abc123def456789
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123def456789",
    "cubeId": "CUBE-001",
    ...
  }
}
```

---

### 5. Delete Test Record

**Endpoint:** `DELETE /api/strength-tests/:id`

**Description:** Deletes a test record and its associated image file.

**Response:**

```json
{
  "success": true,
  "message": "Strength test record deleted successfully"
}
```

---

### 6. Health Check

**Endpoint:** `GET /health`

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "mongodb": {
    "status": "connected",
    "database": "configured"
  }
}
```

## 🧮 Automatic Calculations

The system automatically computes:

1. **Average Area (mm²)**

   ```
   avgAreaMm2 = avgLengthMm × avgWidthMm
   ```

2. **Compressive Strength (MPa)**

   ```
   compressiveStrengthMpa = (appliedLoadKn × 1000) / avgAreaMm2
   ```

3. **Pass/Fail Status**

   Based on grade thresholds:
   - M10: 10 MPa
   - M15: 15 MPa
   - M20: 20 MPa
   - M25: 25 MPa
   - M30: 30 MPa
   - M35: 35 MPa
   - M40: 40 MPa

   Status = "Passed" if `compressiveStrengthMpa ≥ gradeThresholdMpa`, else "Failed"

## 🔒 Validation Rules

### Required Fields

- `cubeId`: String, required
- `cubeMadeDate`: Date, required
- `testDate`: Date, required
- `testingTime`: String, required
- `predictGrade`: String, required
- `curingDays`: Number, required, ≥ 0
- `appliedLoadKn`: Number, required, > 0
- `avgLengthMm`: Number, required, > 0
- `avgWidthMm`: Number, required, > 0

### Image Upload Rules

- Allowed formats: JPG, JPEG, PNG
- Maximum file size: 5MB
- Field name: `image`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/cement_strength_db

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE_MB=5
```

## 📝 Example Test Data

```json
{
  "cubeId": "CUBE-2026-001",
  "cubeMadeDate": "2026-01-15",
  "testDate": "2026-02-12",
  "testingTime": "09:30 AM",
  "predictGrade": "M25",
  "curingDays": 28,
  "appliedLoadKn": 562.5,
  "avgLengthMm": 150,
  "avgWidthMm": 150,
  "cubeGrade": "M25"
}
```

**Expected Results:**

- avgAreaMm2: 22,500
- compressiveStrengthMpa: 25
- status: "Passed"

## 🐛 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation message"
    }
  ]
}
```

## 🧪 Testing with Postman/Thunder Client

1. **Create a test:**
   - Method: POST
   - URL: `http://localhost:5000/api/strength-tests`
   - Headers: `Content-Type: application/json`
   - Body: Use example JSON above

2. **Upload image:**
   - Method: POST
   - URL: `http://localhost:5000/api/strength-tests/{id}/image`
   - Body: form-data
   - Key: `image`, Type: File

3. **Get all tests:**
   - Method: GET
   - URL: `http://localhost:5000/api/strength-tests?page=1&limit=10`

## 🚦 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "dotenv": "^16.3.1",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5"
}
```

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Configure `.env` file
3. Start MongoDB
4. Run the server: `npm start`
5. Test endpoints using Postman or curl

## 📧 Support

For issues or questions, please refer to the project documentation.
