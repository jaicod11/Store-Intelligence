# CHOICES.md — Engineering Decisions

This document covers the three core decision categories for the Store Intelligence System:
model selection, schema design, and API architecture. Each decision includes the option considered,
the alternative rejected, and the explicit reasoning.

---

## 1. Model Selection

### 1.1 Object Detection — YOLOv8n (Ultralytics)

**Chosen:** YOLOv8n with ByteTrack tracker
**Rejected:** YOLOv5, SSD MobileNet, Faster R-CNN, custom-trained model

**Reasoning:**

YOLOv8 is the current industry standard for real-time object detection. The specific reasons for choosing it:

- **Single-pass multi-class detection.** YOLOv8 detects all required classes — person, car, truck, motorcycle, bus, bicycle — in one forward pass using COCO weights. No separate model is needed for vehicle type classification.
- **Native ByteTrack integration.** Ultralytics ships ByteTrack as a built-in tracker. Enabling multi-object tracking requires a single parameter change (`persist=True`) with no additional dependencies.
- **Production-grade inference speed.** YOLOv8n achieves 15–20 FPS on CPU (M-series Mac), sufficient for a store environment where 1–2 second event granularity is acceptable.
- **Nano vs larger variants.** YOLOv8n was chosen for the development environment (CPU). For a production GPU deployment, yolov8m or yolov8l would improve accuracy by 5–8% mAP with acceptable latency.

**Why not custom-trained:**
Custom training requires a labelled dataset of store-specific footage, weeks of annotation work, and GPU compute. YOLOv8 on COCO weights already covers all required object classes at production accuracy for this use case.

---

### 1.2 Multi-Object Tracking — ByteTrack

**Chosen:** ByteTrack (via Ultralytics)
**Rejected:** DeepSORT, SORT, StrongSORT, IoU Tracker

**Reasoning:**

- **No re-identification model required.** ByteTrack matches detections using IoU and a Kalman filter without needing a separate appearance embedding model. This eliminates a second neural network from the inference pipeline, reducing latency.
- **Handles occlusion well.** ByteTrack maintains track IDs through short occlusions (e.g., a person walking behind a shelf), which is critical for accurate unique person counting.
- **Low-confidence detection handling.** ByteTrack's two-stage association recovers detections that fall below the primary confidence threshold, improving recall in busy scenes.

**Why not DeepSORT:** DeepSORT requires a Re-ID model (an additional CNN) which doubles inference time and requires a separate model file. ByteTrack achieves comparable accuracy without this overhead.

---

### 1.3 Gender Detection — Gemini Vision API (per-person crop)

**Chosen:** Gemini 2.0 Flash with structured prompt on cropped person bounding box
**Rejected:** DeepFace, custom gender classifier, OpenCV-based face detection pipeline

**Reasoning:**

- **No additional model to deploy.** A custom gender classifier requires a face detection + classification pipeline, two separate models, and training/maintenance. Gemini handles this with a single API call.
- **Handles partial views.** Store CCTV often captures people from the side or partially. Gemini Vision understands context beyond just frontal face orientation.
- **Result caching eliminates redundant calls.** Each track ID's gender result is cached for 30 seconds. A person present for 2 minutes triggers at most 4 API calls, keeping cost and latency manageable.
- **Graceful degradation.** If Gemini fails or is rate-limited, the system continues running — gender is recorded as `null` without interrupting the detection pipeline.

---

### 1.4 Abnormal Activity Detection — Gemini Vision API (full frame)

**Chosen:** Gemini 2.0 Flash with structured JSON prompt on full frame, sampled every 5 seconds
**Rejected:** Rule-based pose estimation, custom anomaly detection model, optical flow analysis

**Reasoning:**

- **Open-ended detection.** Abnormal events (falls, fights, accidents, medical emergencies) are rare, diverse, and hard to enumerate. A rule-based approach would miss most real scenarios. Gemini's multimodal understanding handles arbitrary event types.
- **5-second sampling prevents cost explosion.** At 15 FPS, sending every frame to Gemini would cost thousands of API calls per hour. Sampling one frame every 5 seconds gives 720 checks per hour — sufficient for a store environment where events last longer than 5 seconds.
- **Structured output for programmatic handling.** The prompt requires a JSON response `{ "detected": bool, "description": string }` which is parsed directly into an alert event without text processing.

---

## 2. Schema Design

### 2.1 Three-collection MongoDB design

**Chosen:** Separate `Detection`, `Alert`, and `DailyStat` collections
**Rejected:** Single events collection, time-series collection, flat log file

**Reasoning:**

Each collection has fundamentally different access patterns:

| Collection | Write pattern | Read pattern | Retention |
|---|---|---|---|
| `Detection` | Every 10 seconds | Rarely (historical drill-down) | 30 days (TTL) |
| `Alert` | On event only | Frequently (alert log, reports) | Permanent |
| `DailyStat` | Every 5 seconds (upsert) | Every dashboard load | Permanent |

Merging them into a single collection would force every dashboard query to scan millions of raw detection documents to answer "how many people today?" The pre-aggregated `DailyStat` document answers this in a single document lookup.

---

### 2.2 DailyStat as a pre-aggregated document (one per day)

**Chosen:** Upsert a single `DailyStat` document per (date, cameraId) with running totals
**Rejected:** Aggregate on read from raw Detection documents

**Reasoning:**

The dashboard loads today's stats on every page open and refreshes every 30 seconds. Aggregating from raw Detection documents on every load would require scanning thousands of documents with a MongoDB `$group` aggregation pipeline. With pre-aggregated `DailyStat`, the query is a single `findOne` by indexed `date` field — sub-millisecond.

The trade-off is slightly stale data (up to 5 seconds behind real time), which is acceptable for a store analytics dashboard.

---

### 2.3 Detection collection TTL index — 30 days

**Chosen:** MongoDB TTL index `{ timestamp: 1, expireAfterSeconds: 2592000 }`
**Rejected:** Cron job cleanup, manual purge script, no cleanup

**Reasoning:**

Detection snapshots are high-volume (8,640 documents per day per camera) and are only needed for short-term historical drill-down. After 30 days, the `DailyStat` and `Alert` collections contain all the data needed for reporting.

TTL indexes are handled atomically by MongoDB's background thread — no application code required, no risk of a failed cleanup job leaving stale data, and no impact on write performance.

---

### 2.4 Denormalised `date` string field on Detection

**Chosen:** Store `date` as `"YYYY-MM-DD"` string alongside the full `timestamp` Date
**Rejected:** Derive date from timestamp at query time using `$dateToString`

**Reasoning:**

Queries like "all detections on June 4" are common. Using `$dateToString` in aggregation pipelines is expensive and prevents MongoDB from using an index. A denormalised `date` string field indexed as `{ date: 1, cameraId: 1 }` turns this into a covered index scan — orders of magnitude faster.

---

### 2.5 In-memory Set for unique track ID accumulation

**Chosen:** Node.js in-memory `Set` of track IDs, flushed to `DailyStat` every 5 seconds
**Rejected:** Count raw detections from MongoDB, Redis HyperLogLog, database-side deduplication

**Reasoning:**

The core counting problem is: a person visible for 200 frames must count as 1, not 200. Options considered:

- **Count raw frames:** Massively overcounts. 200 frames × 15 FPS = 1 person counted as 200.
- **Redis HyperLogLog:** Probabilistic — introduces ~1% error. Acceptable for large scale but unnecessary complexity here.
- **Database dedup:** `$addToSet` in MongoDB is expensive and doesn't work well with upserts at high write rates.
- **In-memory Set:** Exact deduplication, zero database overhead, O(1) add/lookup. The only limitation is state loss on restart (acceptable for a hackathon; production would persist the Set to Redis).

The Set resets at midnight (detected via date string comparison on each event) to correctly count unique visitors per day rather than lifetime.

---

## 3. API Architecture Decisions

### 3.1 Redis Pub/Sub as the event bus between services

**Chosen:** Redis Pub/Sub with dedicated subscriber client
**Rejected:** Direct HTTP calls from CV service to API service, Kafka, RabbitMQ, BullMQ

**Reasoning:**

- **Decoupling.** The CV service publishes events without knowing whether the API service is running. If the API service restarts, the CV pipeline continues uninterrupted.
- **Simplicity.** Redis is already in the stack for caching. Adding Pub/Sub requires no new infrastructure.
- **Appropriate scale.** At 15 FPS with frame skipping, the system publishes ~7 events per second. Redis handles millions of messages per second — this workload is trivial.

**Why not Kafka:** Kafka is built for replay, consumer groups, and millions of messages per second. This system needs none of those features. Kafka would add an operator burden (ZooKeeper or KRaft, topic management) with no benefit at this scale.

**Delivery guarantee trade-off:** Redis Pub/Sub is fire-and-forget — if the API service is down when an event is published, that event is lost. For this use case (real-time store analytics), losing a detection event during a brief restart is acceptable. If guaranteed delivery were required, BullMQ (Redis-backed queue) would be the correct upgrade path.

---

### 3.2 REST + WebSocket hybrid API

**Chosen:** REST endpoints for historical queries + Socket.io WebSocket for real-time push
**Rejected:** WebSocket-only, REST polling at short intervals, Server-Sent Events

**Reasoning:**

The two data access patterns require different protocols:

| Pattern | Data | Best protocol |
|---|---|---|
| Dashboard load / sidebar query | Historical stats for a date/range | REST (request-response, cacheable) |
| Live alerts / live count chart | Real-time events as they happen | WebSocket (push, no polling overhead) |

REST polling for real-time alerts would require polling every 1–2 seconds, generating constant unnecessary load. WebSocket push eliminates this — the server sends data only when something actually happens.

Server-Sent Events (SSE) was considered but rejected because Socket.io provides bi-directional communication, built-in reconnection, and room support — useful for future multi-camera scoping.

---

### 3.3 Two-layer alert deduplication

**Chosen:** Primary dedup in CV service (Python, per track ID cooldown) + secondary in API alertEngine.js (per camera+type cooldown)
**Rejected:** Single-layer dedup in CV service only

**Reasoning:**

The CV service cooldown handles the normal case: track ID 7 triggers one intrusion alert and is suppressed for 15 seconds. However, two edge cases bypass this:

1. **Video loop.** When a video file loops, ByteTrack resets track IDs from 1. The Python cooldown map is keyed by track ID, so track_id=7 in the new loop appears as a fresh detection.
2. **Service restart.** The Python cooldown map is in-memory and lost on restart. Restarting the CV service mid-session would re-fire alerts for ongoing situations.

The `alertEngine.js` second layer is keyed by `(cameraId, alertType)` with independent cooldown timers. This catches duplicates regardless of what happens in the CV service.

---

### 3.4 Server-side PDF generation with PDFKit

**Chosen:** Node.js PDFKit rendering PDF on the API server, streamed as binary response
**Rejected:** Client-side PDF (jsPDF, html2pdf), pre-generated reports stored in S3

**Reasoning:**

- **Data access.** Report generation requires querying MongoDB for daily stats and alert logs. This data is on the server — sending it all to the client to render a PDF adds unnecessary data transfer.
- **Consistency.** Server-side rendering produces identical output regardless of the client browser, screen size, or installed fonts.
- **Streaming.** PDFKit streams the PDF directly into the HTTP response without writing a temporary file, keeping memory usage flat regardless of report length.

**Report content design:** Every report embeds the period (date or range), the generation timestamp (date + time + day of week), and a page footer. This satisfies audit requirements and makes printed reports self-contained.

---

### 3.5 Vite + React for the dashboard (no Next.js)

**Chosen:** Vite + React SPA
**Rejected:** Next.js, Create React App, plain HTML

**Reasoning:**

The dashboard is a single authenticated view with no SEO requirements and no server-rendered pages. Next.js adds SSR/SSG complexity that provides no benefit here. Vite gives sub-second HMR and a production build in seconds — significantly faster than CRA for development iteration during a hackathon.

---

### 3.6 Zustand for client state management

**Chosen:** Zustand
**Rejected:** Redux Toolkit, React Context + useReducer, MobX

**Reasoning:**

The dashboard has a small but specific shared state: live people count history (40 readings), alert feed (50 alerts), and today's stats. This state is updated at high frequency by Socket.io events.

Redux Toolkit is well-suited for large applications with complex state graphs. For a single-page dashboard, its boilerplate (actions, reducers, slices, selectors) adds overhead with no benefit. Zustand provides the same predictable state model with a fraction of the code, and its subscription model integrates cleanly with Socket.io event handlers.
