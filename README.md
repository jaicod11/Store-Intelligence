<div align="center">

# 🏪 Store Intelligence System

**AI-powered real-time CCTV analytics — built for Purplle Tech Challenge 2026, Round 2**

*Detects people, vehicles, crowds, intrusions, and abnormal activity from raw CCTV footage —
streams live analytics and alerts to a production-grade dashboard.*

![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

</div>

---

## 🧱 Tech Stack

### 🤖 Computer Vision & AI

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-111827?style=for-the-badge&logoColor=white)
![ByteTrack](https://img.shields.io/badge/ByteTrack-Multi--Object_Tracking-FF6B35?style=for-the-badge&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_Vision_API-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Shapely](https://img.shields.io/badge/Shapely-ROI_Zones-228B22?style=for-the-badge&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)

### ⚙️ Backend Services

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-Report_Generator-DC143C?style=for-the-badge&logoColor=white)

### 🗄️ Database & Messaging

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_Pub%2FSub-DC382D?style=for-the-badge&logo=redis&logoColor=white)

### 🖥️ Frontend

![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-State_Management-433E38?style=for-the-badge&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### 🐳 DevOps

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-Multi--Service-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 👤 **People detection** | Real-time person detection with persistent track IDs via ByteTrack |
| 🚗 **Vehicle detection** | Classifies car, truck, motorcycle, bus, bicycle in a single YOLO pass |
| ♂️♀️ **Gender detection** | Gemini Vision API per person crop; result cached 30s per track ID |
| 🚧 **Intrusion detection** | Polygon ROI zones — alerts fire with 15s cooldown per unique person |
| 👥 **Crowd detection** | Configurable threshold; requires 3 consecutive frames before alerting |
| ⚠️ **Abnormal activity** | Gemini Vision API analyzes full frames every 5s for accidents / falls / fights |
| 🔔 **Real-time alerts** | Socket.io pushes alerts to dashboard instantly with type, time, and severity |
| 📊 **Live dashboard** | Stat cards + live line chart + doughnut + bar chart, all updating in real time |
| 📅 **Historical stats** | Query any single date or date range — gender split, vehicle breakdown, alert log |
| 📄 **PDF reports** | Server-side PDFKit reports with period, generation date, time, and day on every page |

---

## 📁 Project Structure

```
store-intelligence/
│
├── docker-compose.yml              # Wires all 5 services together
├── .env.example                    # Copy → .env and fill GEMINI_API_KEY
├── videos/                         # Drop your .mp4 files here
│
├── cv-service/                     # Python · FastAPI · YOLOv8
│   ├── core/
│   │   ├── detector.py             # Main detection + tracking pipeline
│   │   ├── zone_manager.py         # Polygon ROI zone management
│   │   ├── crowd_detector.py       # Threshold + consecutive-frame logic
│   │   └── gemini_client.py        # Gemini Vision API wrapper
│   ├── publishers/
│   │   └── redis_publisher.py      # Publishes events to Redis
│   ├── routers/
│   │   ├── stream.py               # Start / stop / status endpoints
│   │   └── zones.py                # CRUD for restricted zones
│   └── main.py                     # FastAPI entry point
│
├── api-service/                    # Node.js · Express · Socket.io
│   ├── models/
│   │   ├── Detection.js            # Throttled frame snapshots (10s, 30d TTL)
│   │   ├── Alert.js                # Individual alert events
│   │   └── DailyStat.js            # Pre-aggregated per-day stats
│   ├── services/
│   │   ├── alertEngine.js          # Dedup + severity + message normalisation
│   │   ├── eventProcessor.js       # Redis subscriber + accumulator + DB flush
│   │   ├── statsService.js         # Date-range aggregation queries
│   │   └── reportService.js        # PDFKit report builder
│   ├── routes/
│   │   ├── stats.js                # GET /api/stats
│   │   ├── alerts.js               # GET /api/alerts
│   │   └── reports.js              # POST /api/reports/generate
│   └── server.js                   # Entry point
│
└── dashboard/                      # React · Vite · Tailwind · Chart.js
    └── src/
        ├── store/useAlertStore.js  # Zustand global state
        ├── hooks/
        │   ├── useSocket.js        # Socket.io connection + event handlers
        │   └── useStats.js        # REST polling for today's stats
        ├── components/
        │   ├── charts/             # PeopleChart, VehicleChart, AlertsChart
        │   ├── AlertPanel.jsx      # Live alert feed
        │   └── StatsSidebar.jsx    # Date picker + stats + report button
        └── pages/Dashboard.jsx     # Main page layout
```

---

## ⚙️ Prerequisites

- **Docker** and **Docker Compose** installed
- A **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)
- A video file (`.mp4`) **or** an RTSP stream URL from your camera

> **No GPU required.** YOLOv8n runs comfortably on CPU. For better accuracy at higher FPS, use `yolov8m.pt` and a machine with a CUDA GPU.

---

## 🚀 Quick Start

### 1 — Clone and configure

```bash
git clone https://github.com/your-username/store-intelligence.git
cd store-intelligence

cp .env.example .env
# Open .env and set GEMINI_API_KEY + VIDEO_SOURCE
```

### 2 — Add your video

```bash
mkdir videos
cp /path/to/your/footage.mp4 videos/sample.mp4
```

### 3 — Start all services

```bash
docker-compose up --build
```

All five services start in dependency order: `redis` → `mongodb` → `cv-service` + `api-service` → `dashboard`.

| Service | URL |
|---|---|
| 🖥️ Dashboard | http://localhost:5173 |
| ⚙️ API Service | http://localhost:3000 |
| 🤖 CV Service | http://localhost:8000 |
| 🗄️ MongoDB | localhost:27017 |
| 📨 Redis | localhost:6379 |

### 4 — Start the detection pipeline

```bash
curl -X POST http://localhost:8000/stream/start
```

Open the dashboard — you should see live counts and charts updating within seconds.

---

## 🔐 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Google AI Studio key |
| `VIDEO_SOURCE` | `./videos/sample.mp4` | `.mp4` path or `rtsp://` URL |
| `YOLO_MODEL` | `yolov8n.pt` | Model size: `n` (fast) · `m` · `l` · `x` (accurate) |
| `CROWD_THRESHOLD` | `10` | People count that triggers a crowd alert |
| `ABNORMAL_CHECK_INTERVAL` | `5` | Seconds between Gemini abnormal activity checks |
| `GENDER_CACHE_TTL` | `30` | Seconds to cache Gemini gender result per track ID |
| `FRAME_SKIP` | `2` | Process every Nth frame — higher = faster, lower accuracy |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `MONGO_URI` | `mongodb://mongodb:27017/store_intelligence` | MongoDB URI |
| `PORT` | `3000` | API service port |

---

## 📡 API Reference

### Stats

```
GET  /api/stats/today               → today's aggregated stats
GET  /api/stats?date=YYYY-MM-DD     → stats for a specific date
GET  /api/stats?from=DATE&to=DATE   → stats for a date range
```

### Alerts

```
GET  /api/alerts?limit=50           → most recent N alerts
GET  /api/alerts?date=YYYY-MM-DD    → all alerts that day
GET  /api/alerts?from=DATE&to=DATE  → alerts for a date range
GET  /api/alerts?type=intrusion     → filter by type (intrusion|crowd|abnormal)
```

### Reports

```
POST /api/reports/generate
  Body: { "date": "YYYY-MM-DD" }              → single-day PDF
  Body: { "from": "DATE", "to": "DATE" }      → date-range PDF
```

### CV Service

```
POST /stream/start?source=<optional override>  → start pipeline
POST /stream/stop                              → stop pipeline
GET  /stream/status                            → { running: true|false }
POST /zones/                                   → create a restricted zone
GET  /zones/                                   → list all zones
GET  /zones/{zone_id}                          → get a specific zone
DEL  /zones/{zone_id}                          → delete a zone
```

---

## 🚧 Setting Up Restricted Zones

Zones are defined as polygon coordinates in frame-pixel space.
Use [Roboflow Polygon Zone](https://polygonzone.roboflow.com) to draw zones visually
and export the pixel coordinates.

```bash
curl -X POST http://localhost:8000/zones/ \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id":   "zone-server-room",
    "name":      "Server Room",
    "camera_id": "cam1",
    "points":    [[100,100],[400,100],[400,350],[100,350]]
  }'
```

An intrusion alert fires as soon as any person's centroid enters the polygon.
A 15-second cooldown per `track_id` prevents alert spam for the same person.

---

## 🔄 Event Flow

```
Video file / RTSP stream
        │
        ▼
  CV Service  (Python · FastAPI)
  ┌─────────────────────────────────────────────────┐
  │  OpenCV → extract frames (every Nth frame)      │
  │  YOLOv8 → detect person / car / truck / ...     │
  │  ByteTrack → assign persistent track IDs        │
  │  Shapely → centroid ∈ restricted polygon?       │
  │    └─ YES → publish intrusion alert             │
  │  CrowdDetector → count > threshold & 3 frames?  │
  │    └─ YES → publish crowd alert                 │
  │  Gemini Vision (every 5s) → abnormal activity?  │
  │    └─ YES → publish abnormal alert              │
  │  Gemini Vision (cached 30s/ID) → gender per ID  │
  └─────────────────────────────────────────────────┘
        │
        ▼  Redis Pub/Sub
             store:detections  ─────────────────────────┐
             store:alerts  ──────────────────────────────┤
        │                                                │
        ▼                                                │
  API Service  (Node.js · Express)                       │
  ┌──────────────────────────────────────────────────┐   │
  │  alertEngine.js → dedup + severity + format      │◄──┘
  │  eventProcessor.js → accumulate unique track IDs │
  │    └─ flush → DailyStat (every 5s)               │
  │    └─ snapshot → Detection (every 10s, 30d TTL)  │
  │  Socket.io → emit live counts + alert:new        │
  └──────────────────────────────────────────────────┘
        │
        ▼  WebSocket + REST
  React Dashboard
  ┌──────────────────────────────────────────────────┐
  │  Stat cards: People Today / Vehicles / Alerts    │
  │  PeopleChart  → live line chart (last 40 pts)    │
  │  VehicleChart → doughnut by type                 │
  │  AlertsChart  → bar by alert type               │
  │  AlertPanel   → live scrolling feed              │
  │  StatsSidebar → date/range picker                │
  │    ├─ people + gender breakdown                  │
  │    ├─ vehicles by type                           │
  │    ├─ alert log (type + time)                    │
  │    └─ 📄 Generate PDF Report button             │
  └──────────────────────────────────────────────────┘
```

---

## 🧠 Architecture Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Detection model | YOLOv8n | Best speed/accuracy trade-off; native ByteTrack integration via Ultralytics |
| Tracking | ByteTrack | Maintains persistent IDs across frames — essential for unique person counting |
| Abnormal detection | Gemini Vision API | Sampled every 5s; complex scene understanding without a custom-trained model |
| Gender detection | Gemini Vision API | Cached 30s per track ID; avoids API rate limits at 15fps |
| Event bus | Redis Pub/Sub | Decouples CV service from API; horizontally scalable; same pattern as CollabDocs |
| Unique counting | In-memory Set of track IDs | Prevents double-counting the same person across frames; resets at midnight |
| DB write strategy | Throttled flush (5s DailyStat · 10s Detection) | Prevents write storms from frame-rate detection events |
| Alert deduplication | Two-layer (CV service + alertEngine.js) | CV handles per-detection cooldown; Node.js catches any cross-session duplicates |
| Report generation | PDFKit server-side | Produces consistent PDFs without browser rendering quirks |
| Detection TTL | 30-day MongoDB TTL index | Auto-expires old snapshots — no cron job needed |

---

## ⚠️ Known Limitations

- **Track ID reuse** — ByteTrack IDs reset when a video file loops, which may slightly overcount unique people. In production, use a live RTSP stream.
- **In-memory accumulators** — Unique track ID sets live in process RAM. A service restart mid-day resets the day's count. For production, persist accumulator state to Redis.
- **Single camera** — Currently wired for `cam1`. Multi-camera support requires parallel CV service instances scoped by `cameraId`.
- **Gender accuracy** — Gemini Vision classification depends on crop size and image quality; results are best-effort.
- **No authentication** — API endpoints and the dashboard are public. Add JWT middleware (pattern already in LifeTracker) before any production deployment.

---

## 📄 License

MIT — use it however you like.

---

<div align="center">

Built by **Jaideep Kundu** &nbsp;·&nbsp; Purplle Tech Challenge 2026

</div>
