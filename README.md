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
![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
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
![Docker Compose](https://img.shields.io/badge/Docker_Compose-Infrastructure_only-2496ED?style=for-the-badge&logo=docker&logoColor=white)

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
├── docker-compose.yml              # Redis + MongoDB only (see Quick Start)
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
│   ├── config.py                   # Reads .env from both ./  and ../
│   └── main.py                     # FastAPI entry point
│
├── api-service/                    # Node.js · Express · Socket.io
│   ├── models/
│   │   ├── Detection.js            # Throttled snapshots (10s, 30-day TTL)
│   │   ├── Alert.js                # Individual alert events
│   │   └── DailyStat.js            # Pre-aggregated per-day stats
│   ├── services/
│   │   ├── alertEngine.js          # Secondary dedup + severity + message
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
        │   └── useStats.js         # REST polling for today's stats
        ├── components/
        │   ├── charts/             # PeopleChart · VehicleChart · AlertsChart
        │   ├── AlertPanel.jsx      # Live alert feed
        │   └── StatsSidebar.jsx    # Date picker + stats + report button
        └── pages/Dashboard.jsx     # Main page layout
```

---

## 📄 Documentation

| File | Contents |
|---|---|
| `README.md` | Setup, running instructions, API reference |
| `DESIGN.md` | System architecture, component design, data flows, AI-Assisted Decisions |
| `CHOICES.md` | Model selection, schema design, API architecture decisions |
| `events.jsonl` | Sample event log in JSONL format |

---

## ⚙️ Prerequisites

- **Docker Desktop** (for Redis + MongoDB infrastructure only)
- **Python 3.11** with `pip`
- **Node.js 20** with `npm`
- **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)
- **ffmpeg** — for converting CCTV video to H.264 (required for some camera formats)
- A video file (`.mp4`) or an RTSP stream URL

```bash
# Install ffmpeg (Mac)
brew install ffmpeg
```

> **Apple Silicon (M1/M2/M3) note:** Run cv-service, api-service, and dashboard natively on Mac. Only Redis and MongoDB run in Docker. See Quick Start below.

---

## 🚀 Quick Start

> **Important:** Run services natively on Mac for best performance. Docker is used only for Redis and MongoDB (lightweight infrastructure). Running cv-service in Docker on Apple Silicon causes extremely slow PyTorch installation due to VM overhead.

### Step 1 — Clone and configure

```bash
git clone https://github.com/your-username/store-intelligence.git
cd store-intelligence

cp .env.example .env
# Open .env and set GEMINI_API_KEY and VIDEO_SOURCE
```

### Step 2 — Add your video

```bash
mkdir -p videos
cp /path/to/your/footage.mp4 videos/sample.mp4
```

**If your footage is from a CP Plus / H.265 camera, convert it first:**
```bash
ffmpeg -i videos/sample.mp4 -vcodec libx264 -crf 23 videos/converted.mp4
# Then set VIDEO_SOURCE=../videos/converted.mp4 in .env
```

### Step 3 — Start Redis and MongoDB

```bash
docker-compose up redis mongodb -d
```

### Step 4 — Install and run cv-service

```bash
cd cv-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 5 — Install and run api-service (new terminal)

```bash
cd api-service
npm install
node server.js
```

### Step 6 — Install and run dashboard (new terminal)

```bash
cd dashboard
npm install
npm run dev
```

### Step 7 — Start the detection pipeline

```bash
curl -X POST http://localhost:8000/stream/start
```

Open **http://localhost:5173** — the dashboard will show live detections within seconds.

---

## ✅ Expected Terminal Output

```bash
# Redis + MongoDB
✅ Container store-intelligence-mongodb-1  Running
✅ Container store-intelligence-redis-1    Running

# cv-service
INFO: Uvicorn running on http://0.0.0.0:8000
Redis publisher connected.
[Frame 2] → 5 people, 0 vehicles
[Frame 4] → 6 people, 1 vehicles

# api-service
✅ MongoDB connected
✅ Redis subscribed → store:detections, store:alerts
✅ Socket.io initialized
✅ API Service → http://localhost:3000
🔌 Dashboard connected: <socket_id>

# dashboard
VITE ready at http://localhost:5173
```

---

## 🔐 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Google AI Studio key |
| `VIDEO_SOURCE` | `../videos/sample.mp4` | `.mp4` path (relative to cv-service/) or `rtsp://` URL |
| `YOLO_MODEL` | `yolov8n.pt` | Model size: `n` (fast) · `m` · `l` · `x` (accurate) |
| `CROWD_THRESHOLD` | `10` | People count that triggers a crowd alert |
| `ABNORMAL_CHECK_INTERVAL` | `5` | Seconds between Gemini abnormal activity checks |
| `GENDER_CACHE_TTL` | `30` | Seconds to cache Gemini gender result per track ID |
| `FRAME_SKIP` | `2` | Process every Nth frame — higher = faster, lower accuracy |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `MONGO_URI` | `mongodb://localhost:27017/store_intelligence` | MongoDB URI |
| `PORT` | `3000` | API service port |

> **Note:** When running natively (not in Docker), use `redis://localhost:6379` and `mongodb://localhost:27017/...`. When running fully in Docker, use `redis://redis:6379` and `mongodb://mongodb:27017/...`.

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
POST /stream/start?source=<optional>  → start pipeline
POST /stream/stop                     → stop pipeline
GET  /stream/status                   → { running: true|false }
POST /zones/                          → create restricted zone
GET  /zones/                          → list all zones
GET  /zones/{zone_id}                 → get a specific zone
DEL  /zones/{zone_id}                 → delete a zone
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
    "zone_id":   "zone-storage",
    "name":      "Storage Room",
    "camera_id": "cam1",
    "points":    [[100,100],[400,100],[400,350],[100,350]]
  }'
```

An intrusion alert fires when any person's centroid enters the polygon.
A 15-second cooldown per `track_id` prevents alert spam for the same person.

---

## 🔄 Event Flow

```
Video file / RTSP stream
        │
        ▼
  CV Service  (Python · FastAPI)
  ┌────────────────────────────────────────────────┐
  │  OpenCV → extract frames (every Nth frame)     │
  │  YOLOv8 → detect person / car / truck / ...    │
  │  ByteTrack → assign persistent track IDs       │
  │  Shapely → centroid inside restricted zone?    │
  │    └─ YES → publish intrusion alert            │
  │  CrowdDetector → count > threshold & 3 frames? │
  │    └─ YES → publish crowd alert                │
  │  Gemini Vision (every 5s) → abnormal activity? │
  │    └─ YES → publish abnormal alert             │
  │  Gemini Vision (cached 30s/ID) → gender        │
  └────────────────────────────────────────────────┘
        │
        ▼  Redis Pub/Sub (store:detections · store:alerts)
        │
        ▼
  API Service  (Node.js · Express)
  ┌────────────────────────────────────────────────┐
  │  alertEngine.js → dedup + severity + format    │
  │  eventProcessor → unique track ID accumulation │
  │    └─ flush → DailyStat every 5s              │
  │    └─ snapshot → Detection every 10s (30d TTL)│
  │  Socket.io → emit live counts + alert:new      │
  └────────────────────────────────────────────────┘
        │
        ▼  WebSocket + REST
  React Dashboard
  ┌────────────────────────────────────────────────┐
  │  Stat cards: People / Vehicles / Alerts Today  │
  │  PeopleChart  → live line chart (40 readings)  │
  │  VehicleChart → doughnut by vehicle type       │
  │  AlertsChart  → bar by alert type             │
  │  AlertPanel   → live scrolling alert feed      │
  │  StatsSidebar → date/range picker              │
  │    ├─ people + gender breakdown                │
  │    ├─ vehicles by type                         │
  │    ├─ alert log (type + time)                  │
  │    └─ 📄 Generate PDF Report                  │
  └────────────────────────────────────────────────┘
```

---

## 🧠 Architecture Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Detection model | YOLOv8n | Best speed/accuracy for CPU; native ByteTrack + multi-class in one pass |
| Tracking | ByteTrack | Persistent IDs without Re-ID model; handles occlusion |
| Abnormal detection | Gemini 2.0 Flash | Open-ended scene understanding; sampled every 5s to control cost |
| Gender detection | Gemini 2.0 Flash | Cached 30s per track ID; no separate CV model needed |
| Event bus | Redis Pub/Sub | Decouples services; same pattern as prior CollabDocs project |
| Unique counting | In-memory Set of track IDs | Prevents double-counting same person across frames |
| DB write strategy | 5s flush (DailyStat) · 10s snapshot (Detection) | Prevents write storms at 15fps detection rate |
| Alert deduplication | Two layers: CV service + alertEngine.js | CV handles per-detection cooldown; Node.js catches cross-session duplicates |
| Report generation | PDFKit server-side | Consistent output; streams binary response without temp files |
| Detection TTL | 30-day MongoDB TTL index | Auto-expiry with no cron job needed |

See [DESIGN.md](./DESIGN.md) and [CHOICES.md](./CHOICES.md) for full reasoning.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| `libgl1-mesa-glx has no installation candidate` | Replace with `libgl1` in cv-service/Dockerfile (Apple Silicon issue) |
| `PyTorch install takes 1+ hour in Docker` | Run cv-service natively — `pip install` on Apple Silicon is 10x faster |
| `Cannot open video source` | Check VIDEO_SOURCE path — use `../videos/filename.mp4` when running natively |
| `OpenCV: Couldn't read video stream` | Convert video with `ffmpeg -i input.mp4 -vcodec libx264 output.mp4` (H.265 → H.264) |
| `EADDRINUSE: port already in use` | Run `lsof -ti:3000 | xargs kill -9` (or 8000 / 5173) |
| `MongooseServerSelectionError` | Run `docker-compose up redis mongodb -d` before starting api-service |
| `ValidationError: gemini_api_key missing` | Add `env_file = (".env", "../.env")` to config.py Settings.Config |
| `UnpicklingError loading YOLO weights` | Run `pip install -U ultralytics` (PyTorch 2.6 compatibility fix) |
| `gemini-1.5-flash not found` | Update model name to `gemini-2.0-flash` in gemini_client.py |
| Dashboard shows all zeros | Check cv-service terminal for frame logs — `[Frame N] → X people` |

---

## ⚠️ Known Limitations

- **Track ID reuse** — ByteTrack IDs reset when a video file loops, which may slightly overcount unique people. Use a live RTSP stream in production.
- **In-memory accumulators** — Unique track ID Sets live in process RAM. A service restart mid-day resets the day's count. For production, persist accumulator state to Redis.
- **Single camera** — Currently wired for `cam1`. Multi-camera support requires parallel CV service instances scoped by `cameraId`.
- **Gender accuracy** — Gemini Vision classification depends on crop size and image quality; results are best-effort and not guaranteed.
- **No authentication** — API endpoints and dashboard are unauthenticated. Add JWT middleware before any production deployment.
- **H.265 video** — OpenCV on macOS cannot decode H.265 (common in IP cameras). Convert to H.264 using ffmpeg before processing.

---

## 📄 License

MIT — use it however you like.

---

<div align="center">

Built by **Jaideep Kundu** &nbsp;·&nbsp; Purplle Tech Challenge 2026

</div>