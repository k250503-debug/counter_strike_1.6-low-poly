import * as THREE from 'three';
import { PerformanceTelemetry } from '../../store/useGameStore';

/**
 * Monitors frame rate, frame time, WebGL draw calls, and triangle budget,
 * and computes an adaptive resolution multiplier when FPS drops persistently.
 */
export class PerformanceMonitor {
  private accumTime = 0;
  private frames = 0;
  private adaptiveScale = 1.0;
  private lowFpsStreak = 0;
  private highFpsStreak = 0;

  private lastTelemetry: PerformanceTelemetry = {
    fps: 60,
    frameMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    adaptiveScale: 1.0,
  };

  public recordFrame(
    dt: number,
    renderer: THREE.WebGLRenderer,
    isSoftwareGl: boolean,
    onSample?: (telemetry: PerformanceTelemetry) => void
  ): PerformanceTelemetry {
    this.accumTime += dt;
    this.frames += 1;

    if (this.accumTime >= 0.45) {
      const fps = Math.max(1, Math.round(this.frames / this.accumTime));
      const frameMs = Math.round((this.accumTime / this.frames) * 10000) / 10;

      if (!isSoftwareGl) {
        if (fps < 44) {
          this.lowFpsStreak += 1;
          this.highFpsStreak = 0;
          if (this.lowFpsStreak >= 2 && this.adaptiveScale > 0.72) {
            this.adaptiveScale = Math.max(0.72, Math.round((this.adaptiveScale - 0.08) * 100) / 100);
          }
        } else if (fps >= 56) {
          this.highFpsStreak += 1;
          this.lowFpsStreak = 0;
          if (this.highFpsStreak >= 3 && this.adaptiveScale < 1.0) {
            this.adaptiveScale = Math.min(1.0, Math.round((this.adaptiveScale + 0.06) * 100) / 100);
          }
        } else {
          this.lowFpsStreak = 0;
          this.highFpsStreak = 0;
        }
      }

      this.lastTelemetry = {
        fps,
        frameMs,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        adaptiveScale: this.adaptiveScale,
      };

      this.accumTime = 0;
      this.frames = 0;
      onSample?.(this.lastTelemetry);
    }

    return this.lastTelemetry;
  }

  public getLatest(): PerformanceTelemetry {
    return this.lastTelemetry;
  }
}
