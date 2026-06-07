import { world } from '../world';
import {
  Position,
  Renderable,
  Health,
  Player,
  Monster,
  Chest,
  Trap,
  Stairs,
  renderableQuery,
  playerQuery,
  monsterQuery,
  EmojiIndex,
} from '../components';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  TILE,
} from '../../constants/gameConfig';
import { intToHex } from '../world';

const EMOJI_MAP: Record<number, string> = {
  [EmojiIndex.PLAYER]: '👤',
  [EmojiIndex.MONSTER]: '👹',
  [EmojiIndex.CHEST]: '📦',
  [EmojiIndex.TRAP]: '⚠️',
  [EmojiIndex.STAIRS]: '🚪',
  [EmojiIndex.GOBLIN]: '👺',
  [EmojiIndex.ORC]: '👿',
  [EmojiIndex.SLIME]: '🟢',
  [EmojiIndex.SKELETON]: '💀',
  [EmojiIndex.MAGE]: '🧙',
  [EmojiIndex.GHOST]: '👻',
};

export class RenderSystem {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
  }

  render(): void {
    this.clear();
    this.renderMap();
    this.renderGrid();
    this.renderEntities();
    this.renderHealthBars();
  }

  private clear(): void {
    this.ctx.fillStyle = COLORS.WALL;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private renderMap(): void {
    if (!world.map) return;

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = world.map[y][x];
        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        if (tile === TILE.WALL) {
          this.ctx.fillStyle = COLORS.WALL;
        } else {
          this.ctx.fillStyle = COLORS.FLOOR;
        }

        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        if (tile === TILE.FLOOR) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          this.ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
      }
    }
  }

  private renderGrid(): void {
    this.ctx.strokeStyle = COLORS.GRID;
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= MAP_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * TILE_SIZE, 0);
      this.ctx.lineTo(x * TILE_SIZE, CANVAS_HEIGHT);
      this.ctx.stroke();
    }

    for (let y = 0; y <= MAP_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * TILE_SIZE);
      this.ctx.lineTo(CANVAS_WIDTH, y * TILE_SIZE);
      this.ctx.stroke();
    }
  }

  private renderEntities(): void {
    const entities = renderableQuery(world);

    for (const eid of entities) {
      if (Renderable.visible[eid] === 0) continue;

      const x = Position.x[eid];
      const y = Position.y[eid];
      const emojiIndex = Renderable.emojiIndex[eid];
      const emoji = EMOJI_MAP[emojiIndex] || '❓';

      const screenX = x * TILE_SIZE + TILE_SIZE / 2;
      const screenY = y * TILE_SIZE + TILE_SIZE / 2;

      if (Player[eid]) {
        this.renderGlow(screenX, screenY, COLORS.PLAYER);
      } else if (Monster[eid]) {
        this.renderGlow(screenX, screenY, COLORS.MONSTER);
      } else if (Chest[eid]) {
        this.renderGlow(screenX, screenY, COLORS.CHEST);
      } else if (Stairs[eid]) {
        this.renderGlow(screenX, screenY, COLORS.STAIRS);
      }

      this.ctx.font = `${TILE_SIZE * 0.7}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(emoji, screenX, screenY);
    }
  }

  private renderGlow(x: number, y: number, color: string): void {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, TILE_SIZE * 0.6);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, color + '00');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      x - TILE_SIZE * 0.5,
      y - TILE_SIZE * 0.5,
      TILE_SIZE,
      TILE_SIZE
    );
  }

  private renderHealthBars(): void {
    const monsters = monsterQuery(world);
    for (const eid of monsters) {
      this.renderHealthBar(eid);
    }

    const players = playerQuery(world);
    for (const eid of players) {
      this.renderHealthBar(eid);
    }
  }

  private renderHealthBar(eid: number): void {
    if (!Health[eid]) return;

    const x = Position.x[eid];
    const y = Position.y[eid];
    const current = Health.current[eid];
    const max = Health.max[eid];
    const percentage = current / max;

    const barWidth = TILE_SIZE * 0.8;
    const barHeight = 6;
    const screenX = x * TILE_SIZE + (TILE_SIZE - barWidth) / 2;
    const screenY = y * TILE_SIZE + TILE_SIZE - 10;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(screenX, screenY, barWidth, barHeight);

    let healthColor = '#2ed573';
    if (percentage < 0.3) {
      healthColor = '#ff4757';
    } else if (percentage < 0.6) {
      healthColor = '#ffa502';
    }

    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(screenX, screenY, barWidth * percentage, barHeight);

    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(screenX, screenY, barWidth, barHeight);
  }

  resize(): void {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
  }
}

export default RenderSystem;
