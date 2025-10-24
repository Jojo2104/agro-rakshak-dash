# 🌱 Agro Rakshak Dashboard

**Agro Rakshak** is an intelligent agricultural monitoring and disease detection platform that combines IoT sensor data, machine learning, and real-time analytics to help farmers make data-driven decisions for crop management.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Firebase Configuration](#firebase-configuration)
- [ESP32 Integration](#esp32-integration)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Agro Rakshak is a comprehensive agricultural monitoring solution designed as a capstone project. It provides:

- **Real-time sensor monitoring** via ESP32 IoT devices
- **User authentication and data management** through Firebase
- **Crop-specific recommendations** based on survey data
- **Disease detection** using machine learning models
- **Interactive dashboard** for data visualization

## ✨ Features

### Current Features

- **Dashboard Analytics**: Visual representation of agricultural data
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Data Visualization**: Charts and graphs for better insights

### New Features (In Development)

#### 🔐 Authentication System
- User registration and login via Firebase Authentication
- Secure session management
- Password reset functionality
- Role-based access control

#### 📊 Real-time Sensor Integration
- ESP32-based IoT sensors for monitoring:
  - Soil moisture
  - Temperature
  - Humidity
  - pH levels
  - Light intensity
- Live data streaming to Firebase Realtime Database
- Historical data tracking and analysis

#### 📝 Farmer Survey Module
- Comprehensive crop information collection:
  - Crop type and variety
  - Climate conditions
  - Regional pincode
  - Land type and size
  - Irrigation method
  - Farming practices
- Data stored in Firebase for personalized recommendations

#### 🤖 Disease Detection (Planned)
- ML-powered crop disease identification
- Image-based diagnosis
- Treatment recommendations
- Historical disease tracking

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript**: Core web technologies
- **Bootstrap/Tailwind CSS**: Responsive UI framework
- **Chart.js/D3.js**: Data visualization

### Backend & Database
- **Firebase Authentication**: User management
- **Firebase Realtime Database**: Real-time data storage
- **Firebase Hosting**: Web hosting (optional)

### IoT
- **ESP32**: Microcontroller for sensor data collection
- **Arduino IDE**: Development environment
- **Firebase ESP Client Library**: ESP32-Firebase communication

### Machine Learning (Planned)
- **TensorFlow/PyTorch**: Disease detection model
- **Python**: Model training and deployment

## 🏗️ Architecture

```
┌─────────────────┐
│   ESP32 Device  │
│   (Sensors)     │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│    Firebase     │
│  Realtime DB    │
└────────┬────────┘
         │
         │ Real-time
         ▼
┌─────────────────┐
│  Web Dashboard  │
│  (React/HTML)   │
└─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Firebase account
- Arduino IDE (for ESP32 programming)
- ESP32 development board
- Agricultural sensors (soil moisture, DHT22, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Jojo2104/agro-rakshak-dash.git
cd agro-rakshak-dash
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Realtime Database
   - Copy your Firebase configuration

4. **Configure environment variables**

Create a `firebase-config.js` file:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export default firebaseConfig;
```

5. **Run the development server**
```bash
npm start
```

Or simply open `index.html` in your browser for static hosting.

## 🔥 Firebase Configuration

### Database Structure

```json
{
  "users": {
    "userId": {
      "email": "farmer@example.com",
      "profile": {
        "name": "John Doe",
        "phone": "+91XXXXXXXXXX",
        "region": "Karnataka"
      },
      "survey": {
        "cropType": "Rice",
        "landType": "Irrigated",
        "pincode": "560001",
        "climate": "Tropical",
        "landSize": "5 acres"
      }
    }
  },
  "sensorData": {
    "deviceId": {
      "timestamp": 1634567890,
      "soilMoisture": 45,
      "temperature": 28,
      "humidity": 65,
      "pH": 6.5,
      "lightIntensity": 800
    }
  }
}
```

### Security Rules

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "sensorData": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 📡 ESP32 Integration

### Hardware Requirements

- ESP32 Development Board
- Soil Moisture Sensor
- DHT22 (Temperature & Humidity)
- pH Sensor (optional)
- LDR/Light Sensor (optional)
- Jumper wires and breadboard

### ESP32 Code Setup

1. Install the Firebase ESP Client library:
   - Open Arduino IDE
   - Go to Tools → Manage Libraries
   - Search for "Firebase ESP Client"
   - Install the library

2. Upload the following code structure:

```cpp
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase credentials
#define API_KEY "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL "YOUR_DATABASE_URL"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Sensor pins
#define SOIL_MOISTURE_PIN 34
#define DHT_PIN 4

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  
  // Configure Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  
  // Initialize sensors
  pinMode(SOIL_MOISTURE_PIN, INPUT);
}

void loop() {
  // Read sensor data
  int soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  float temperature = readTemperature();
  float humidity = readHumidity();
  
  // Send to Firebase
  Firebase.RTDB.setInt(&fbdo, "/sensorData/device1/soilMoisture", soilMoisture);
  Firebase.RTDB.setFloat(&fbdo, "/sensorData/device1/temperature", temperature);
  Firebase.RTDB.setFloat(&fbdo, "/sensorData/device1/humidity", humidity);
  Firebase.RTDB.setInt(&fbdo, "/sensorData/device1/timestamp", millis());
  
  delay(5000); // Send data every 5 seconds
}
```

## 📁 Project Structure

```
agro-rakshak-dash/
├── index.html              # Main landing page
├── auth/
│   ├── login.html         # Login page
│   ├── signup.html        # Registration page
│   └── auth.js            # Authentication logic
├── dashboard/
│   ├── dashboard.html     # Main dashboard
│   ├── dashboard.js       # Dashboard functionality
│   └── dashboard.css      # Dashboard styles
├── survey/
│   ├── survey.html        # Farmer survey form
│   └── survey.js          # Survey logic
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Images and icons
├── firebase-config.js     # Firebase configuration
├── README.md             # This file
└── package.json          # Dependencies
```

## 💡 Usage

### For Farmers

1. **Register/Login**: Create an account or login with existing credentials
2. **Complete Survey**: Provide information about your farm and crops
3. **View Dashboard**: Monitor real-time sensor data from your fields
4. **Disease Detection**: Upload crop images for disease analysis (coming soon)

### For Administrators

1. **Manage Users**: View registered farmers and their data
2. **Analytics**: Access aggregate data and insights
3. **System Monitoring**: Check ESP32 device status and connectivity

## 📚 API Documentation

### Authentication Endpoints

```javascript
// Register new user
firebase.auth().createUserWithEmailAndPassword(email, password);

// Login
firebase.auth().signInWithEmailAndPassword(email, password);

// Logout
firebase.auth().signOut();

// Password reset
firebase.auth().sendPasswordResetEmail(email);
```

### Database Operations

```javascript
// Read sensor data
firebase.database().ref('sensorData/device1').on('value', (snapshot) => {
  const data = snapshot.val();
});

// Write survey data
firebase.database().ref('users/' + userId + '/survey').set({
  cropType: 'Rice',
  pincode: '560001',
  // ... other fields
});

// Update user profile
firebase.database().ref('users/' + userId + '/profile').update({
  name: 'John Doe',
  phone: '+91XXXXXXXXXX'
});
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: Jojo2104
- **Capstone Project**: Agricultural Technology

## 📞 Support

For questions or support, please open an issue in the GitHub repository or contact [your-email@example.com]

## 🙏 Acknowledgments

- Firebase for providing the backend infrastructure
- ESP32 community for IoT resources
- Agricultural experts for domain knowledge
- Open-source contributors

---

**Made with ❤️ for farmers**
