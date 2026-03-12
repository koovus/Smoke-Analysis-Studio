# SMOKE VISION

**Real-Time Smoke Cloud Analysis for Artistic Effect**

A browser-based computer vision tool that uses your webcam to detect, measure, and rate exhaled smoke clouds in real time — no server required, no machine learning models, all processing happens locally in your browser.

---

## What It Does

SMOKE VISION analyses cigarette (or any) smoke exhaled in front of a camera and gives you live data on the properties of the cloud:

- **Cloud Size** — how much of the frame the smoke occupies, expressed as a percentage
- **Smoke Thickness** — how opaque/dense the smoke appears (thin / medium / thick)
- **Cloud Shape** — circularity of the detected blob (wispy / round / ring)
- **Velocity & Direction** — how fast the cloud is moving and in which cardinal direction
- **Smoke Ring Detection** — automatically flags when a ring shape is detected based on circularity and a hollow-centre test
- **Exhale Scoring** — each distinct exhale is rated 0–100 when it dissipates, factoring in volume, density, duration, and whether a ring was produced
- **Exhale History** — keeps the last 10 rated exhales, colour-coded by tier (gold / silver / bronze / grey)

---

## Features

### Live Analysis
Real-time CV pipeline running at up to 60fps with throttled React updates (~10/sec) to keep the UI smooth. All metrics update continuously while the camera is active.

### Clip Recorder
Record the live camera feed combined with the detection overlay as a video clip. Three duration options — **6 s**, **15 s**, or **30 s** — with a progress bar and countdown. The clip auto-downloads when the timer finishes.

- **Format**: MP4 (H.264) via the WebCodecs API on Chrome/Edge; falls back to WebM on older browsers
- **Content**: Composite of the raw camera feed + green detection overlay, recorded at 30fps
- **Output**: `smoke-vision-Xs-timestamp.mp4`

### WASD Key Effects
Press any WASD key to trigger a full-screen particle effect with a synthesised sound. Effects layer if you press multiple keys quickly.

| Key | Visual Effect | Sound |
|-----|--------------|-------|
| **W** | 140 spinning gold coins burst from screen centre outward with gravity — each coin flips as it flies | Slot machine spin → ascending win fanfare |
| **A** | Electric blue & white sparks explode from centre and fade fast | Sharp electric zap |
| **S** | 120 coloured confetti pieces shower from the top, drifting side to side | Ascending party-pop notes |
| **D** | Orange/red fire particles rise from the bottom centre, shrinking as they fade | Low crackle + bass rumble |

All sounds are synthesised in the browser using the Web Audio API — no audio files required.

### Sensitivity Controls
In-app sliders for every detection parameter, grouped in the left column next to the camera for easy access.

---

## How It Works

Everything runs in the browser using the **WebRTC camera API** and **HTML5 Canvas** for pixel-level image processing. There is no machine learning model, no cloud service, and no data ever leaves your device.

### Vision Pipeline (runs every animation frame at ~60fps)

```
1. Capture video frame → draw to offscreen canvas (320×240)
2. Read raw pixel data (RGBA Uint8ClampedArray)
3. Convert each pixel to grayscale
4. Subtract adaptive background model (per-pixel)
5. Threshold: mark pixel as "smoke" if diff > threshold AND brightness > min
6. Accumulate scores into a 32×24 grid of cells
7. Activate cells where grid score exceeds block threshold
8. Group active cells into a single blob (primary cloud)
9. Compute metrics: centroid, bounding box, circularity, velocity, spread
10. Run exhale state machine (start / accumulate / score & record)
11. Draw visual overlay onto the display canvas
12. Throttle React state updates to ~10/sec to keep UI smooth
```

### Background Subtraction Model

The background is initialised from the first frame and then updated using an exponential moving average:

```
background[px] = background[px] × (1 - updateRate) + current[px] × updateRate
```

The update rate slows significantly on pixels classified as smoke, so the background model does not "learn" the smoke into itself. Default: 5% per frame on non-smoke pixels, 0.5% on smoke pixels.

### Smoke Detection Criteria

A pixel is classified as smoke when both conditions are true:

| Condition | Default |
|-----------|---------|
| `abs(current_gray - background_gray)` > threshold | threshold = 10 |
| `current_gray` > min brightness | min brightness = 50 |

The brightness check prevents dark shadows from triggering false positives.

### Grid Aggregation

Rather than analysing every pixel for grouping (which would be expensive), the frame is divided into a **32×24 grid of cells**. A cell is marked active when the total smoke-pixel differential within it exceeds 80. Connected active cells form the detected smoke cloud.

### Ring Detection

A smoke ring is flagged when:
1. The bounding box is roughly square (aspect ratio 0.6–1.4)
2. The bounding box is at least 3 cells wide and 3 cells tall
3. The grid cell at the centroid is **not** active (hollow centre)
4. Circularity score > 0.5 (calculated as `activeCells / expectedEllipseArea`)

### Exhale Scoring (0–100)

When smoke disappears (blob drops below minimum size), the exhale is scored:

| Factor | Max contribution |
|--------|-----------------|
| Cloud volume (max area reached) | 40 pts |
| Cloud density (max density reached) | 30 pts |
| Duration (capped at 5 seconds) | 30 pts |
| Ring bonus (if ring was detected) | +30 pts (capped at 100) |

Exhales shorter than 0.5 seconds or smaller than 5% of the frame are discarded.

**Score tiers:**

| Score | Medal |
|-------|-------|
| 80–100 | Gold |
| 60–79 | Silver |
| 40–59 | Bronze |
| 0–39 | Grey |

**Automatic tags** applied to each exhale: `RING`, `DENSE`, `LINGERING`, `MASSIVE`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Icons | Lucide React |
| Camera API | `navigator.mediaDevices.getUserMedia` |
| Vision | HTML5 Canvas (`getImageData`, `putImageData`) |
| Recording | WebCodecs API + `mp4-muxer` (MP4); MediaRecorder fallback (WebM) |
| Audio | Web Audio API (synthesised, no audio files) |
| Particles | Canvas 2D API (RAF-based, ref-driven, no React re-renders) |
| State | React hooks + refs (no external state library) |
| Routing | Wouter |
| Build | Vite (static output, no server needed) |

No backend. No database. No external API calls. Everything runs locally in the browser.

---

## Project Structure

```
artifacts/smoke-analyzer/
├── src/
│   ├── lib/
│   │   └── smoke-analyzer.ts       # Core CV engine (detection, metrics, scoring, overlay drawing)
│   ├── hooks/
│   │   ├── use-camera.ts           # WebRTC camera setup and permission handling
│   │   ├── use-smoke-analyzer.ts   # Frame loop, React integration, state throttling
│   │   ├── use-recorder.ts         # MP4/WebM clip recorder (WebCodecs + mp4-muxer)
│   │   └── use-key-effects.ts      # WASD key listener + Web Audio sound synthesis
│   ├── components/
│   │   ├── camera-view.tsx         # Video feed + overlay canvas + HUD chrome
│   │   ├── stats-panel.tsx         # Live telemetry display
│   │   ├── history-panel.tsx       # Exhale history log with scored cards
│   │   ├── controls-panel.tsx      # Sensitivity sliders + debug toggle
│   │   ├── record-panel.tsx        # Clip recorder UI (duration buttons, progress bar)
│   │   └── effects-overlay.tsx     # Full-screen particle system canvas (WASD effects)
│   ├── pages/
│   │   └── Home.tsx                # Main layout (camera + controls left, panels right)
│   ├── App.tsx                     # Router + providers
│   └── index.css                   # Tailwind theme (dark cinematic, smoke/vapor aesthetic)
└── package.json
```

---

## Sensitivity Controls

All controls are available in the **Sensitivity Controls** panel beneath the camera:

| Control | Description | Default |
|---------|-------------|---------|
| Detection Threshold | Minimum pixel difference to count as smoke | 10 |
| Min Brightness | Ignore pixels darker than this (prevents shadow false positives) | 50 |
| Background Update Speed | How fast the background model adapts | 5% |
| Min Blob Size | Minimum grid cells for a cloud to register | 4 cells |
| Debug Overlay | Shows raw detection grid in red over the video | Off |

---

## Getting Started

### Requirements

- A modern browser (Chrome or Edge recommended for MP4 recording via WebCodecs)
- A webcam
- Good lighting — smoke is most detectable against a dark or contrasting background
- Best results: exhale smoke with a light or window behind you so the smoke appears lighter than the background

### Run Locally

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm --filter @workspace/smoke-analyzer run dev
```

Then open the URL shown in your terminal and allow camera access when prompted.

### Build for Production

```bash
pnpm --filter @workspace/smoke-analyzer run build
```

Output is in `artifacts/smoke-analyzer/dist/public/` — fully static, can be served from any CDN or static host.

---

## Tips for Best Results

- **Lighting**: Side lighting or backlighting works best. The algorithm detects change from a background, so smoke that contrasts well with what's behind it is easier to detect.
- **Background**: A plain, still background reduces false positives. Moving objects (people walking by, flickering lights) will trigger the detector.
- **Smoke rings**: Blow rings slowly and hold them steady in frame for 1–2 seconds after formation for the hollow-centre detection to trigger.
- **Sensitivity**: If the detector misses thin wisps, lower the Detection Threshold. If it fires on shadows or hand movements, raise it.
- **Debug mode**: Enable the Debug Overlay to see exactly which grid cells the algorithm is activating — useful for tuning threshold settings.
- **Recording**: For best clip quality, use Chrome or Edge (MP4/H.264). Firefox will produce a WebM file instead.

---

## Limitations & Known Behaviour

- **One blob**: The current implementation tracks a single primary smoke cloud per frame. Multiple simultaneous independent clouds are merged into one bounding box.
- **Motion false positives**: Any fast movement in frame (waving hands, people walking by) will temporarily trigger the detector. The background model recovers within a few seconds.
- **Thin wisps**: Very light or thin smoke may fall below the detection threshold. Lower the threshold if needed.
- **Camera quality**: The algorithm processes at 320×240 internally. Higher resolution cameras produce sharper video but don't improve detection accuracy.
- **No audio input**: The app does not use the microphone. Exhale detection is purely visual.

---

## Roadmap / Possible Extensions

- [ ] Multi-blob tracking (separate clouds with individual IDs and trails)
- [ ] Optical flow for more accurate velocity measurement
- [ ] Smoke trail path drawing (persistence of centroid history)
- [ ] Session statistics (best score, average score, total exhales, ring success rate)
- [ ] WebGL accelerated pixel processing for higher frame rate analysis
- [ ] Mobile support (rear camera option for third-person filming)
- [ ] Configurable scoring weights (user-defined point allocation)
- [ ] Additional WASD effects and customisable key bindings

---

## License

MIT
