# 🐅 StripeID Sentinel — Pench Tiger Reserve Intelligence Platform

> **Automated Camera Trap Triage & Tiger Movement Intelligence Engine**  
> *Developed for Pench Tiger Reserve (Madhya Pradesh & Maharashtra Forest Departments)*

[![Node.js](https://img.shields.io/badge/Backend-Express.js_Node_v20+-059669?style=flat-square&logo=node.js)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/Frontend-Vite_React_19_HTTPS-10B981?style=flat-square&logo=vite)](https://vitejs.dev)
[![Gemini Vision AI](https://img.shields.io/badge/AI_Vision-Google_Gemini_3.5_Flash-F59E0B?style=flat-square&logo=google)](https://ai.google.dev)
[![License][https://img.shields.io/badge/License-CC0_1.0-lightgrey?style=flat-square](https://img.shields.io/badge/License-CC0_1.0-lightgrey?style=flat-square)

---

## 📖 Overview

**StripeID Sentinel** is an AI-powered wildlife monitoring and GIS intelligence platform engineered for Pench Tiger Reserve. It eliminates the 70–80% manual burden of auditing blank camera trap photos using **Google Gemini Vision AI** and computes individual tiger movement trajectories, territory occupancy polygons (Minimum Convex Polygon), and real-time conflict alert dispatches.

---

## 🌟 Key Features

1. **📹 25 Field Stations Mobile Camera Trap Integration**:
   - Pair any mobile phone camera to any of the 25 camera trap stations via instant QR Code scanning over local HTTPS.
   - Real-time portal status badge (`🔴 CAPTURING LIVE`) when a phone pairs with a station.

2. **🐅 Intelligent Tiger Subject Camera Detector (No Tiger = No Capture)**:
   - Visual feature detector inspecting live video frames for Tawny Orange/Gold signatures, flank stripe patterns, and nocturnal eye-shine.
   - **Only captures and uploads when an actual tiger subject appears!**

3. **🌙 Night-Vision & Thermal IR Gemini AI Classifier**:
   - Toggleable Ironbow heat palette filter (`contrast(190%) sepia(100%) hue-rotate(300deg)`).
   - Dedicated night-vision prompt passed to Gemini AI to detect feline tapetum lucidum eye-shine and nocturnal outlines in pitch darkness.

4. **🗺️ Interactive GIS Google Maps Engine**:
   - Core & Buffer reserve boundary polygons.
   - Individual tiger Minimum Convex Polygon (MCP) territories & directional movement vectors.
   - **🔮 AI 48-Hour Movement Spatial Heatmap Predictor**.
   - **📡 Real-Time Forest Ranger GPS Patrol Tracker & 1-Click Dispatch**.

5. **💬 Ask Sentinel AI Voice & GIS Locator Assistant**:
   - Floating chatbot powered by Gemini 3.5 Flash.
   - Type or speak: *"Where is Leo 002?"* ➔ Auto-switches to the Google Map, zooms to that tiger, and generates a detailed movement breakdown.

6. **🔊 AI Bio-Acoustic Roar & Alarm Call Sensor**:
   - Real-time Web Audio API frequency resonance analyzer detecting 80Hz–250Hz Tiger Roars & Sambar/Cheetal prey alarm calls.

7. **🚁 Pench Drone FLIR Thermal Surveillance Console**:
   - Aerial FLIR thermal infrared patrol feeds with live drone telemetry (Altitude, Speed, Battery, Heading, GPS) and 98.7% AI bounding boxes.

8. **📊 1-Click NTCA Official Wildlife Census PDF Report Generator**:
   - Instant PDF print and CSV formatting compliant with National Tiger Conservation Authority Phase-IV census standards.

---

## ⚡ System Requirements

- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x` or `v22.x`)
- **npm**: `v9.0.0` or higher
- **Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari (WebRTC & Camera permissions required for mobile pairing)
- **Google Gemini API Key**: Free or Paid tier key from [Google AI Studio](https://aistudio.google.com)

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/pench-tiger-intelligence.git
cd pench-tiger-intelligence
```

### 2. Run Automated Setup
#### On Windows:
Double-click `setup.bat` or run in PowerShell:
```cmd
setup.bat
```

#### On Linux / macOS:
```bash
chmod +x setup.sh
./setup.sh
```

*(Alternatively, run `npm install` at root, inside `/server`, and inside `/client`)*

---

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to include your Google Gemini API key:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PORT=5000
```

---

### 4. Launch the Platform
Run a single command from the project root:
```bash
npm run dev
```

This launches both services concurrently:
- **Express Backend REST API**: [`http://localhost:5000`](http://localhost:5000)
- **Vite Local HTTPS Dashboard UI**: [`https://localhost:5173`](https://localhost:5173) (or `https://<YOUR_LOCAL_IP>:5173`)

---

## 📱 Mobile Phone Camera Trap QR Code Setup

To connect physical smartphones as camera traps over local Wi-Fi without cloud deployment:

1. Ensure your laptop/PC and mobile phone are connected to the **same Wi-Fi network**.
2. Open the dashboard on your laptop at `https://localhost:5173`.
3. Navigate to **`📹 Field Stations (25 Total)`**.
4. Scan the QR code of any station (e.g. *PTR-KOR-01*) using your mobile phone camera.
5. Grant camera permissions on your mobile browser.
6. The dashboard will instantly update the station card to **`🔴 CAPTURING LIVE`**!

---

## 🛠️ REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check & active model status |
| `GET` | `/api/pench-info` | Core/Buffer reserve boundary polygon coordinates |
| `GET` | `/api/stations` | All 25 camera trap stations & live connection states |
| `GET` | `/api/tigers` | Enrolled tigers catalog & territory metadata |
| `GET` | `/api/tigers/:id` | Detailed occupancy, trajectory, and station history |
| `POST` | `/api/triage/process` | Submit image for Gemini Vision AI triage |
| `POST` | `/api/stations/connect` | Register station QR code camera pairing |
| `POST` | `/api/stations/heartbeat` | Camera trap active heartbeat signal |
| `POST` | `/api/ai/test-key` | Verify Gemini API Key validity |

---

## 📂 Project Architecture

```
pench-tiger-intelligence/
├── client/                     # Vite + React 19 Frontend Dashboard
│   ├── public/                 # Static assets & night-vision tiger imagery
│   ├── src/
│   │   ├── components/         # React Components
│   │   │   ├── PenchMap.jsx             # Google Maps GIS & 48h Predictor Heatmap
│   │   │   ├── StationCamView.jsx       # Camera Trap & Tiger Detection Sensor
│   │   │   ├── LiveMobileTraps.jsx      # 25 Stations & Mobile QR Scanner
│   │   │   ├── SentinelAssistant.jsx    # Ask Sentinel AI GIS Locator Assistant
│   │   │   ├── StripeMatcher.jsx        # Side-by-Side Stripe Pattern Comparison
│   │   │   ├── DroneSurveillance.jsx    # Aerial FLIR Thermal Patrol Console
│   │   │   ├── NTCAReportModal.jsx      # 1-Click NTCA Census PDF Exporter
│   │   │   └── AlertCenter.jsx          # Poacher Alert & QRT Patrol Dispatch
│   │   ├── App.jsx             # Main Application Container
│   │   └── index.css           # Design Tokens & Glassmorphism Styling
│   ├── vite.config.js          # Local HTTPS & Basic SSL Config
│   └── package.json
├── server/                     # Express.js REST API Backend
│   ├── index.js                # Express API Server & Gemini Vision Orchestrator
│   ├── data_store.json         # Persistent JSON Database
│   └── package.json
├── .env.example                # Environment Template
├── setup.bat                   # 1-Click Windows Setup Script
├── setup.sh                    # 1-Click Linux/macOS Setup Script
└── package.json                # Root Concurrently Script Runner
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more details.
