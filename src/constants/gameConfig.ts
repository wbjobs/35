export const MAP_WIDTH = 10;
export const MAP_HEIGHT = 10;
export const TILE_SIZE = 80;
export const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export const TILE = {
  WALL: 0,
  FLOOR: 1,
} as const;

export const EMOJI = {
  PLAYER: '👤',
  MONSTER: '👹',
  CHEST: '📦',
  TRAP: '⚠️',
  STAIRS: '🚪',
  GOBLIN: '👺',
  ORC: '👿',
  SLIME: '🟢',
} as const;

export const COLORS = {
  WALL: '#1a1a2e',
  FLOOR: '#3d3d5c',
  PLAYER: '#ffd700',
  MONSTER: '#ff4757',
  CHEST: '#ffa502',
  TRAP: '#ff6348',
  STAIRS: '#2ed573',
  GRID: '#2d2d44',
  UI_BG: 'rgba(45, 27, 78, 0.9)',
  UI_BORDER: '#ffd700',
  TEXT: '#ffffff',
  TEXT_SECONDARY: '#a0a0c0',
} as const;

export const MONSTER_TYPES = {
  GOBLIN: {
    name: '哥布林',
    emoji: '👺',
    health: 20,
    attack: 5,
    defense: 2,
    aiType: 1,
  },
  ORC: {
    name: '兽人',
    emoji: '👿',
    health: 35,
    attack: 8,
    defense: 4,
    aiType: 1,
  },
  SLIME: {
    name: '史莱姆',
    emoji: '🟢',
    health: 15,
    attack: 3,
    defense: 1,
    aiType: 0,
  },
} as const;

export const PLAYER_BASE = {
  health: 100,
  attack: 10,
  defense: 5,
} as const;

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

export const AI_STATE = {
  IDLE: 0,
  PATROL: 1,
  CHASE: 2,
  ATTACK: 3,
  FLEE: 4,
} as const;

export const GAME_PHASE = {
  PLAYER_TURN: 'player',
  MONSTER_TURN: 'monster',
  GAME_OVER: 'gameover',
  VICTORY: 'victory',
} as const;

export const SAVE_VERSION = '1.0.0';
