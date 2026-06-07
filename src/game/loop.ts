import { world } from '../ecs/world';
import RenderSystem from '../ecs/systems/render';

export class GameLoop {
  private renderSystem: RenderSystem;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private onUpdateCallback: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderSystem = new RenderSystem(canvas);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setOnUpdateCallback(callback: () => void): void {
    this.onUpdateCallback = callback;
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    this.render();

    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  render(): void {
    this.renderSystem.render();
  }

  forceRender(): void {
    this.renderSystem.render();
  }

  getRenderSystem(): RenderSystem {
    return this.renderSystem;
  }

  destroy(): void {
    this.stop();
  }
}

export default GameLoop;
