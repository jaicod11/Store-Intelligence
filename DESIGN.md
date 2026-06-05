# DESIGN.md — Store Intelligence System

## Overview

The Store Intelligence System is an end-to-end AI-powered analytics platform that processes raw CCTV footage in real time to detect people, vehicles, crowds, intrusions, and abnormal activity. It streams live events to a production-grade dashboard and generates structured reports on demand.

The system is designed around three independently deployable services connected by an event bus, reflecting the kind of architecture used inside high-scale retail technology teams.

---

## System Architecture

```
Video source (CCTV / MP4)
        │
        ▼
CV Service  [Python · FastAPI]
  ├── OpenCV      → frame extraction (every Nth frame)
  ├── YOLOv8n     → object detection (person, car, truck, motorcycle, bus, bicycle)
  ├── ByteTrack   → multi-object tracking (persistent track IDs)
  ├── Shapely     → polygon zone checking (intrusion detection)
  ├── CrowdDetector → threshold + consecutive-frame logic
  └── Gemini Vision API → gender classification + abnormal activity detection
        │
        ▼  Redis Pub/Sub (store:detections · store:alerts)
        │
        ▼
API Service  [Node.js · Express]
  ├── alertEngine.js    → secondary deduplication + severity classification
  ├── eventProcessor.js → unique track ID accumulation → DailyStat flush (5s)
  ├── Detection model   → throttled snapshots (10s interval · 30-day TTL)
  ├── Socket.io         → real-time push to dashboard
  └── PDFKit            → server-side report generation
        │
        ├── MongoDB  → Detection · Alert · DailyStat collections
        │
        ▼
React Dashboard  [React · Vite · Tailwind · Chart.js]
  ├── Stat cards     → People Today / Vehicles Today / Alerts Today
  ├── PeopleChart    → live line chart (last 40 readings via Socket.io)
  ├── VehicleChart   → doughnut by vehicle type
  ├── AlertsChart    → bar chart by alert type
  ├── AlertPanel     → live scrolling feed (intrusion / crowd / abnormal)
  └── StatsSidebar   → date/range picker → detailed stats → PDF report button
```

---

## Component Design

### CV Service

The CV service is the core intelligence layer. It runs as a FastAPI application with a persistent async background task that processes the video stream frame by frame.

**Frame processing pipeline (per frame):**

1. OpenCV reads a frame from the video source (file or RTSP stream)
2. YOLOv8n runs detection with ByteTrack tracking enabled — outputs bounding boxes, class IDs, confidence scores, and persistent track IDs
3. Detections are split into people and vehicles based on COCO class IDs
4. For each detected person, Shapely checks if their centroid falls inside any registered restricted zone polygon
5. Person count is passed to CrowdDetector which checks against the threshold over consecutive frames
6. Every N seconds, a full frame is sent to Gemini Vision API to check for abnormal activity
7. Every detected person crop is sent to Gemini Vision API for gender classification (result cached per track ID for 30 seconds)
8. Detection event and any alert events are published to Redis

**Intrusion zone management:**
Zones are defined as pixel-space polygons via a REST API (`POST /zones/`). The Shapely library computes whether a person's centroid is inside any polygon. Each person track ID has a 15-second cooldown to prevent repeated alerts for the same person in the same zone.

**Crowd detection:**
A crowd alert fires only after a person count exceeds the threshold for 3 consecutive processed frames, preventing false positives from momentary peaks. A 30-frame cooldown prevents repeated crowd alerts.

### API Service

The API service acts as the intelligence hub between the CV pipeline and the dashboard.

**Event processing:**
- Subscribes to `store:detections` and `store:alerts` Redis channels
- For detections: accumulates unique track IDs in memory (resets at midnight) and flushes aggregated counts to the `DailyStat` collection every 5 seconds
- For alerts: passes through the `alertEngine` for secondary deduplication and severity classification, then persists to the `Alert` collection and emits to all connected dashboard clients via Socket.io
- A throttled `Detection` snapshot is saved every 10 seconds for historical analytics

**Report generation:**
PDFKit generates server-side PDF reports. Single-day reports pull from the `DailyStat` and `Alert` collections for the requested date. Range reports aggregate across multiple `DailyStat` documents. Every report includes the period, generation date, time, and day of week.

### React Dashboard

The dashboard connects to the API service via both REST (for historical queries) and WebSocket (for live events).

**Zustand** manages global state including the live people count history (used for the real-time line chart), the alert feed (last 50 alerts), and today's aggregated stats.

**Live line chart** maintains a 40-point rolling window of people counts, updated on every `detection:update` Socket.io event.

**StatsSidebar** supports both single-day and date-range queries. It aggregates stats on the client side for range queries (summing across the array of daily stat objects returned by the API). The PDF report request hits `POST /api/reports/generate` and receives a binary blob which is downloaded directly in the browser.

---

## Database Schema

### Detection
```
{
  timestamp:        Date         // indexed, 30-day TTL
  cameraId:         String
  date:             String       // 'YYYY-MM-DD' for fast date queries
  frameId:          Number
  peopleCount:      Number
  maleCount:        Number
  femaleCount:      Number
  vehicleCount:     Number
  vehicleBreakdown: { car, truck, motorcycle, bus, bicycle }
  crowdDetected:    Boolean
  people:           [{ trackId, gender, confidence }]
  vehicles:         [{ trackId, vehicleType, confidence }]
}
```

### Alert
```
{
  timestamp:  Date          // indexed
  cameraId:   String
  alertType:  String        // 'intrusion' | 'crowd' | 'abnormal'
  message:    String
  severity:   String        // 'low' | 'medium' | 'high'
  metadata:   Mixed
}
```

### DailyStat
```
{
  date:               String    // 'YYYY-MM-DD', unique per (date, cameraId)
  cameraId:           String
  totalPeople:        Number
  maleCount:          Number
  femaleCount:        Number
  unknownGenderCount: Number
  totalVehicles:      Number
  vehicleBreakdown:   { car, truck, motorcycle, bus, bicycle }
  alertCounts:        { intrusion, crowd, abnormal, total }
  updatedAt:          Date
}
```

---

## Data Flow — Detection Event

```
1. CV service detects 5 people in frame 42
2. Checks each person against restricted zones → none violated
3. CrowdDetector: count=5, below threshold → no crowd alert
4. Publishes DetectionEvent to Redis store:detections channel
5. API service eventProcessor receives event
6. Adds track IDs 1,2,3,4,5 to in-memory Set (dedup)
7. 5 seconds elapsed → flushes: DailyStat.totalPeople = 5
8. Socket.io emits detection:update { peopleCount: 5, vehicleCount: 0 }
9. Dashboard PeopleChart updates, stat card shows 5
```

## Data Flow — Alert Event

```
1. CV service detects person track_id=7 inside restricted zone "Storage Room"
2. Cooldown check: track_id=7 not seen in last 15s → proceed
3. Publishes AlertEvent to Redis store:alerts channel
4. API alertEngine.shouldProcess("cam1", "intrusion") → true
5. alertEngine.formatMessage → "Person entered restricted area: Storage Room"
6. Alert saved to MongoDB Alert collection
7. DailyStat.alertCounts.intrusion += 1
8. Socket.io emits alert:new to all dashboard clients
9. Dashboard AlertPanel shows new red intrusion card instantly
```

---

## AI-Assisted Decisions

This section documents every place where AI tools were used to make or validate engineering decisions during the build.

### 1. Detection model selection — YOLOv8n over alternatives

**Decision:** Use YOLOv8n (nano) as the primary detection model rather than a custom-trained model or an alternative like SSD or Faster R-CNN.

**AI assistance used:** Evaluated trade-offs across model families using AI-assisted research. Validated that YOLOv8 natively supports multi-class detection (person + all vehicle types) in a single forward pass, eliminating the need for separate vehicle classification. Confirmed ByteTrack integration is built into Ultralytics without additional dependencies.

**Trade-off acknowledged:** YOLOv8n sacrifices some accuracy for speed. For production with GPU, yolov8m or yolov8l would be used. On CPU (development), nano provides 15–20fps which is sufficient for real-time store monitoring at 1–2 second granularity.

### 2. Gemini Vision API for open-ended detection tasks

**Decision:** Use Gemini Vision API for gender classification and abnormal activity detection instead of training custom classifiers.

**AI assistance used:** AI was used to design the prompts for both tasks. The gender classification prompt was iterated to produce exactly one word output (`male` or `female`) to simplify parsing. The abnormal activity prompt was designed to return structured JSON `{ "detected": bool, "description": string }` to enable programmatic processing without text parsing.

**Trade-off acknowledged:** Gemini API adds latency (~500ms per call) and cost. Mitigated with a 30-second cache per track ID for gender and a 5-second sampling interval for abnormal activity detection.

### 3. Redis Pub/Sub as the event bus

**Decision:** Use Redis Pub/Sub to decouple the CV service (Python) from the API service (Node.js) rather than direct HTTP calls or a message queue like Kafka.

**AI assistance used:** AI was consulted to evaluate Redis Pub/Sub vs Kafka vs RabbitMQ for this use case. Key factors: event volume is moderate (not millions/sec), delivery guarantee of at-least-once is acceptable, and the team already has Redis expertise from prior projects. Kafka was over-engineered for this scale.

### 4. Two-layer alert deduplication

**Decision:** Implement alert deduplication at two layers — the CV service (Python, per track ID) and the API service (Node.js, alertEngine.js, per camera+type).

**AI assistance used:** AI analysis of edge cases revealed that a single deduplication layer is insufficient when the video source loops (track IDs reset) or when the CV service restarts mid-session. The second layer in Node.js catches cross-session duplicates that the Python cooldown map cannot see.

### 5. Unique person counting via track ID accumulation

**Decision:** Count unique people using in-memory Sets of ByteTrack IDs rather than counting all detections (which would drastically overcount).

**AI assistance used:** AI was used to reason through the counting problem. Naive frame-by-frame summation would count a person present for 100 frames as 100 people. Track ID accumulation ensures each physical person is counted exactly once per day regardless of how long they remain in frame.

### 6. MongoDB TTL index for Detection collection

**Decision:** Use a MongoDB TTL (Time-To-Live) index on the Detection collection set to 30 days, rather than a scheduled cleanup job.

**AI assistance used:** AI suggested the TTL index approach after evaluating alternatives (cron jobs, manual cleanup scripts). Benefits: zero application code required, MongoDB handles expiry atomically, no risk of a failed cron leaving stale data.
