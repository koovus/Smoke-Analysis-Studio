// Core vision processing for smoke detection
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export interface SmokeMetrics {
  area: number;        // total pixels
  density: number;     // 0-100 average diff
  centroid: Point;
  bounds: Rect;
  circularity: number; // 0-1
  isRing: boolean;
  spreadRate: number;  // pixels/sec
  velocity: Point;     // pixels/sec
}

export interface ExhaleRecord {
  id: string;
  timestamp: number;
  score: number;
  duration: number;
  maxArea: number;
  maxDensity: number;
  wasRing: boolean;
  tags: string[];
}

export interface AnalyzerConfig {
  diffThreshold: number;      // 0-255
  minBrightness: number;      // 0-255
  bgUpdateSpeed: number;      // 0-1 multiplier
  minBlobArea: number;        // in logical grid cells
  showDebug: boolean;
}

type GridCell = { x: number, y: number, smokeScore: number, active: boolean };

export class SmokeAnalyzer {
  private processingW = 320;
  private processingH = 240;
  private gridW = 32; // 10x10 blocks
  private gridH = 24;
  
  private background: Float32Array | null = null;
  private grid: GridCell[] = [];
  
  private lastCentroid: Point | null = null;
  private lastTime: number = 0;
  private lastArea: number = 0;
  
  // Exhale tracking state
  private isPuffing = false;
  private currentPuffStart = 0;
  private currentPuffMaxArea = 0;
  private currentPuffMaxDensity = 0;
  private currentPuffWasRing = false;

  // History
  public puffHistory: ExhaleRecord[] = [];
  
  public config: AnalyzerConfig = {
    diffThreshold: 20,
    minBrightness: 80,
    bgUpdateSpeed: 0.05,
    minBlobArea: 5,
    showDebug: false
  };

  constructor() {
    // Initialize grid
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        this.grid.push({ x, y, smokeScore: 0, active: false });
      }
    }
  }

  public processFrame(
    video: HTMLVideoElement, 
    procCanvas: HTMLCanvasElement, 
    overlayCanvas: HTMLCanvasElement,
    onMetricsUpdate: (metrics: SmokeMetrics | null) => void,
    onNewExhale: (exhale: ExhaleRecord) => void
  ) {
    const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!procCtx || !overlayCtx) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000; // seconds

    // 1. Draw video to processing canvas
    procCtx.drawImage(video, 0, 0, this.processingW, this.processingH);
    const imgData = procCtx.getImageData(0, 0, this.processingW, this.processingH);
    const data = imgData.data;

    // 2. Initialize background model if needed
    if (!this.background) {
      this.background = new Float32Array(this.processingW * this.processingH);
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i+1] + data[i+2]) / 3;
        this.background[i/4] = gray;
      }
      this.lastTime = now;
      return;
    }

    // 3. Reset grid
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i].smokeScore = 0;
      this.grid[i].active = false;
    }

    // 4. Pixel pass: diff, threshold, and grid accumulation
    const cellW = this.processingW / this.gridW;
    const cellH = this.processingH / this.gridH;
    let maxDiffInFrame = 0;

    for (let y = 0; y < this.processingH; y++) {
      for (let x = 0; x < this.processingW; x++) {
        const i = (y * this.processingW + x) * 4;
        const gray = (data[i] + data[i+1] + data[i+2]) / 3;
        const bgIdx = y * this.processingW + x;
        const bgGray = this.background[bgIdx];
        
        const diff = Math.abs(gray - bgGray);
        if (diff > maxDiffInFrame) maxDiffInFrame = diff;

        // Is this a smoke pixel?
        const isSmoke = diff > this.config.diffThreshold && gray > this.config.minBrightness;
        
        if (isSmoke) {
          const gx = Math.floor(x / cellW);
          const gy = Math.floor(y / cellH);
          const gIdx = gy * this.gridW + gx;
          if (gIdx >= 0 && gIdx < this.grid.length) {
            this.grid[gIdx].smokeScore += diff;
          }
        }

        // Update background slowly (faster if no smoke)
        const updateRate = isSmoke ? (this.config.bgUpdateSpeed * 0.1) : this.config.bgUpdateSpeed;
        this.background[bgIdx] = bgGray * (1 - updateRate) + gray * updateRate;
      }
    }

    // 5. Activate grid cells based on score
    let activeCellCount = 0;
    let totalDensity = 0;
    
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i].smokeScore > 200) { // Threshold for a block to be "smoke"
        this.grid[i].active = true;
        activeCellCount++;
        totalDensity += this.grid[i].smokeScore;
      }
    }

    // 6. Analyze components (simplified to one big blob for now)
    let metrics: SmokeMetrics | null = null;
    const isRingCandidate = false;

    if (activeCellCount >= this.config.minBlobArea) {
      let minX = this.gridW, minY = this.gridH, maxX = 0, maxY = 0;
      let sumX = 0, sumY = 0;

      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i].active) {
          const c = this.grid[i];
          if (c.x < minX) minX = c.x;
          if (c.y < minY) minY = c.y;
          if (c.x > maxX) maxX = c.x;
          if (c.y > maxY) maxY = c.y;
          sumX += c.x;
          sumY += c.y;
        }
      }

      const cx = sumX / activeCellCount;
      const cy = sumY / activeCellCount;
      
      const width = (maxX - minX + 1);
      const height = (maxY - minY + 1);
      
      // Calculate circularity (approximate)
      const aspect = width / height;
      const expectedArea = (width * height * Math.PI) / 4;
      const circularity = Math.min(1, activeCellCount / expectedArea);
      
      // Ring detection: check if center is hollow
      let centerHollow = false;
      if (width > 3 && height > 3 && aspect > 0.6 && aspect < 1.4) {
        const centerIdx = Math.floor(cy) * this.gridW + Math.floor(cx);
        if (centerIdx >= 0 && centerIdx < this.grid.length && !this.grid[centerIdx].active) {
          centerHollow = true;
        }
      }

      // Calculate velocity & spread
      let vx = 0, vy = 0, spreadRate = 0;
      if (this.lastCentroid && dt > 0) {
        vx = (cx - this.lastCentroid.x) / dt;
        vy = (cy - this.lastCentroid.y) / dt;
        spreadRate = (activeCellCount - this.lastArea) / dt;
      }

      const density = Math.min(100, (totalDensity / activeCellCount) / 10);

      metrics = {
        area: activeCellCount * (cellW * cellH),
        density,
        centroid: { x: cx * cellW, y: cy * cellH },
        bounds: { x: minX * cellW, y: minY * cellH, w: width * cellW, h: height * cellH },
        circularity,
        isRing: centerHollow && circularity > 0.5,
        velocity: { x: vx * cellW, y: vy * cellH },
        spreadRate: spreadRate * (cellW * cellH)
      };

      this.lastCentroid = { x: cx, y: cy };
    } else {
      this.lastCentroid = null;
    }

    this.lastArea = activeCellCount;

    // 7. Exhale State Machine
    this.processExhaleState(metrics, now, onNewExhale);

    // 8. Draw Overlay
    this.drawOverlay(overlayCanvas, overlayCtx, metrics, cellW, cellH);

    this.lastTime = now;
    onMetricsUpdate(metrics);
  }

  private processExhaleState(metrics: SmokeMetrics | null, now: number, onNewExhale: (exhale: ExhaleRecord) => void) {
    if (metrics) {
      if (!this.isPuffing) {
        this.isPuffing = true;
        this.currentPuffStart = now;
        this.currentPuffMaxArea = metrics.area;
        this.currentPuffMaxDensity = metrics.density;
        this.currentPuffWasRing = metrics.isRing;
      } else {
        if (metrics.area > this.currentPuffMaxArea) this.currentPuffMaxArea = metrics.area;
        if (metrics.density > this.currentPuffMaxDensity) this.currentPuffMaxDensity = metrics.density;
        if (metrics.isRing) this.currentPuffWasRing = true;
      }
    } else {
      if (this.isPuffing) {
        const duration = (now - this.currentPuffStart) / 1000;
        
        // Only count significant puffs (> 0.5 seconds and decent size)
        if (duration > 0.5 && this.currentPuffMaxArea > (this.processingW * this.processingH * 0.05)) {
          
          // Calculate score (0-100)
          let score = (this.currentPuffMaxArea / 20000) * 40 + (this.currentPuffMaxDensity / 100) * 30 + Math.min(duration, 5) * 6;
          if (this.currentPuffWasRing) score += 30;
          score = Math.min(100, Math.max(0, score));

          const tags = [];
          if (this.currentPuffWasRing) tags.push("RING");
          if (this.currentPuffMaxDensity > 70) tags.push("DENSE");
          if (duration > 4) tags.push("LINGERING");
          if (this.currentPuffMaxArea > 30000) tags.push("MASSIVE");

          const record: ExhaleRecord = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            score: Math.round(score),
            duration,
            maxArea: this.currentPuffMaxArea,
            maxDensity: this.currentPuffMaxDensity,
            wasRing: this.currentPuffWasRing,
            tags
          };

          this.puffHistory.unshift(record);
          if (this.puffHistory.length > 10) this.puffHistory.pop();
          
          onNewExhale(record);
        }
        
        this.isPuffing = false;
      }
    }
  }

  private drawOverlay(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, metrics: SmokeMetrics | null, cellW: number, cellH: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale factors to map processing space to visual overlay space
    const scaleX = canvas.width / this.processingW;
    const scaleY = canvas.height / this.processingH;

    // Draw active grid cells (debug mode or subtle overlay)
    if (this.config.showDebug) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      for (let i = 0; i < this.grid.length; i++) {
        const c = this.grid[i];
        if (c.active) {
          ctx.fillRect(c.x * cellW * scaleX, c.y * cellH * scaleY, cellW * scaleX, cellH * scaleY);
        }
      }
    }

    if (!metrics) return;

    // Draw bounding box
    ctx.strokeStyle = metrics.isRing ? 'rgba(200, 100, 255, 0.8)' : 'rgba(100, 255, 200, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      metrics.bounds.x * scaleX, 
      metrics.bounds.y * scaleY, 
      metrics.bounds.w * scaleX, 
      metrics.bounds.h * scaleY
    );

    // Draw centroid
    const vcx = metrics.centroid.x * scaleX;
    const vcy = metrics.centroid.y * scaleY;
    
    ctx.beginPath();
    ctx.arc(vcx, vcy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();

    // Draw velocity vector
    if (Math.abs(metrics.velocity.x) > 1 || Math.abs(metrics.velocity.y) > 1) {
      ctx.beginPath();
      ctx.moveTo(vcx, vcy);
      ctx.lineTo(vcx + metrics.velocity.x * scaleX * 0.5, vcy + metrics.velocity.y * scaleY * 0.5);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = metrics.isRing ? '#d8b4fe' : '#64ffc8';
    ctx.font = '14px "Share Tech Mono"';
    ctx.fillText(
      `${metrics.isRing ? 'RING DETECTED' : 'SMOKE'} | D:${Math.round(metrics.density)}`, 
      metrics.bounds.x * scaleX, 
      (metrics.bounds.y * scaleY) - 8
    );
  }

  public setConfig(newConfig: Partial<AnalyzerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}
