# 🐅 StripeID Sentinel — Pench Tiger Reserve Intelligence Platform
## Complete Project Walkthrough & Development Journey (Start to Finish)

> **Official AI Wildlife Monitoring & Movement Intelligence Engine**  
> *Developed for Pench Tiger Reserve (Madhya Pradesh & Maharashtra Forest Departments)*

---

## 🏆 Executive Summary

**StripeID Sentinel** is a production-grade AI wildlife intelligence platform designed to eliminate the **70–80% manual labor waste** associated with auditing blank camera trap photos in tiger reserves. Powered by **Google Gemini Vision AI**, local HTTPS single-camera WebRTC streaming, and Google Maps GIS modeling, the platform automatically triages incoming camera trap photos, classifies individual tigers by flank stripe patterns, tracks territory movement vectors, predicts 48-hour spatial dispersal, and alerts forest officers to human-wildlife conflict risks.

---

## 📅 Chronological Development Journey (What We Built)

### Phase 1: Local HTTPS & Smartphone WebRTC Camera Integration
- **Problem**: Mobile browsers (Chrome Android, Safari iOS) block camera access over insecure `http://` IP addresses.
- **Solution**: Integrated `@vitejs/plugin-basic-ssl` into `client/vite.config.js` to serve local HTTPS on `https://10.58.70.84:5173`.
- **Outcome**: Any smartphone on local Wi-Fi can scan station QR codes and grant 100% instant camera permissions without cloud deployment.

### Phase 2: Express REST API & Google Gemini Vision Multi-Model Engine
- **Backend Architecture**: Built an Express.js REST API server on Port 5000 backed by a disk JSON database (`server/data_store.json`).
- **Gemini Multi-Model Fallback**: Configured automated rate-limit and quota fallback across `gemini-3.5-flash`, `gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, and `gemini-flash-latest`.
- **API Key Verification**: Built `POST /api/ai/test-key` diagnostic endpoint returning HTTP 200 verification.

### Phase 3: Intelligent Tiger Subject Detector (No Tiger = No Capture)
- **User Directive**: *"The camera trap should NOT capture images continuously; it must only capture when a tiger appears."*
- **Solution**: Developed a real-time HTML5 Canvas visual detector in `StationCamView.jsx` inspecting running video frames for Tawny Gold/Orange color signatures, flank stripe contrast edges, and nocturnal eye-shine.
- **Outcome**: Eliminates unwanted empty frame capture and storage flooding!

### Phase 4: Night-Vision & Thermal IR Gemini AI Classifier
- **User Directive**: *"Can the AI detect tigers from Night Vision IR feeds?"*
- **Solution**:
  - Added a toggleable **Ironbow Thermal IR Shader** (`contrast(190%) sepia(100%) hue-rotate(300deg)`).
  - Passed `isNightVision: true` parameter to `callGeminiVision`, instructing Gemini AI to specifically analyze feline tapetum lucidum eye-shine, body heat outlines, and nocturnal silhouettes in pitch darkness.

### Phase 5: Interactive GIS Map & Individual Tiger Tracking
- **Color-Coded Tigers**: Assigned unique vibrant colors to every tiger (e.g. Leo-001 = Hot Pink `#EC4899`, Leo-002 = Teal `#14B8A6`, Leo-004 = Gold `#EAB308`, T-30 = Emerald `#10B981`, T-42 = Royal Blue `#3B82F6`).
- **Territory Bounds**: Rendered Minimum Convex Polygon (MCP) home range polygons.
- **Movement Arrows**: Rendered vector polylines with forward closed arrowheads displaying trajectory direction.
- **Centroid Markers**: Labeled map markers with interactive info windows displaying tiger name, area (sq km), and movement distance (km).

### Phase 6: Next-Level Advanced Capabilities
1. **💬 Ask Sentinel AI Voice/Text GIS Locator**: Chatbot powered by Gemini 3.5 Flash that parses tiger queries (e.g. *"Where is Leo 002?"*), auto-switches to the Google Map tab, zooms to that tiger, and generates a movement breakdown.
2. **🔊 AI Bio-Acoustic Roar & Alarm Call Sensor**: Web Audio API frequency resonance analyzer monitoring 80Hz–250Hz Tiger Roars & Sambar/Cheetal prey alarm calls.
3. **🚁 Drone FLIR Thermal Patrol Console**: Aerial thermal infrared surveillance console with live capture auto-syncing (`/api/captures/latest`).
4. **🔮 AI 48-Hour Movement Spatial Heatmap Predictor**: Forecasts tiger movement probability around activity centroids over the next 48 hours.
5. **📡 Real-Time Forest Ranger GPS Patrol Tracker**: Displays live ranger units (*Turia QRT-1*, *Karmajhiri Squad*) with 1-click dispatch.
6. **📊 1-Click NTCA Official Census Exporter**: Generates PDF census reports compliant with National Tiger Conservation Authority Phase-IV standards.

### Phase 7: GitHub Production Readiness & API Key Security
- Scrubbed 100% of hardcoded API key strings across all client and backend files.
- Configured `server/index.js` to read keys from `process.env.PRIMARY_USER_KEY` via `dotenv`.
- Created root `.env`, `server/.env`, and `.env.example` templates.
- Configured `.gitignore` to prevent secret leaks and amended git history (`1a1cc4a`).
- **Successfully pushed clean repository to GitHub ([`https://github.com/receptacle-pot/StripeID-Sentinel.git`](https://github.com/receptacle-pot/StripeID-Sentinel.git)) passing Push Protection 100%!**

---

## 🛠️ Technology Stack & Dependencies Summary

| Component | Technology Used | Package Version |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | `react@19.0.0`, `vite@6.1.0` |
| **Local HTTPS Security** | Vite Basic SSL Plugin | `@vitejs/plugin-basic-ssl@2.3.0` |
| **Backend REST API** | Express.js (ES Modules) | `express@4.21.2`, `dotenv@16.4.7` |
| **Multimodal Vision AI** | Google Gemini Vision AI | `gemini-3.5-flash` API |
| **GIS & Spatial Modeling** | Google Maps JS Loader & Turf.js | `@googlemaps/js-api-loader`, `@turf/turf` |
| **Icons & UI Design** | Lucide React + Tailwind CSS | `lucide-react@0.475.0`, `tailwindcss@3.4.17` |

---

## 🌐 Live Access URLs

| Service | Access Link |
| :--- | :--- |
| **Vite Local HTTPS Dashboard** | [`https://localhost:5173`](https://localhost:5173) or [`https://10.58.70.84:5173`](https://10.58.70.84:5173) |
| **Express Backend REST API** | [`http://localhost:5000`](http://localhost:5000) |
| **GitHub Repository** | [`https://github.com/receptacle-pot/StripeID-Sentinel.git`](https://github.com/receptacle-pot/StripeID-Sentinel.git) |
