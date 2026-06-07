import { createWorld, addEntity, removeEntity, IWorld } from 'bitecs';
import {
  Position,
  Renderable,
  Health,
  Combat,
  AI,
  Velocity,
  Player,
  Monster,
  Chest,
  Trap,
  Stairs,
  Wall,
  EmojiIndex,
} from './components';
import { COLORS, PLAYER_BASE, MONSTER_TYPES } from '../constants/gameConfig';

export type GameWorld = IWorld & {
  map?: number[][];
  floor?: number;
  turn?: number;
  gamePhase?: string;
  messages?: string[];
  pendingActions?: PendingAction[];
};

export interface PendingAction {
  type: 'move' | 'attack' | 'interact';
  eid: number;
  targetX?: number;
  targetY?: number;
  targetEid?: number;
}

export let world: GameWorld = createWorld();
export let playerEid: number = 0;

export function resetWorld(): void {
  world = createWorld();
  world.map = [];
  world.floor = 1;
  world.turn = 1;
  world.gamePhase = 'player';
  world.messages = [];
  world.pendingActions = [];
  playerEid = 0;
}

export function createPlayer(x: number, y: number): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Renderable, eid);
  addComponent(world, Health, eid);
  addComponent(world, Combat, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Player, eid);

  Position.x[eid] = x;
  Position.y[eid] = y;

  Renderable.color[eid] = hexToInt(COLORS.PLAYER);
  Renderable.visible[eid] = 1;
  Renderable.emojiIndex[eid] = EmojiIndex.PLAYER;

  Health.current[eid] = PLAYER_BASE.health;
  Health.max[eid] = PLAYER_BASE.health;

  Combat.attack[eid] = PLAYER_BASE.attack;
  Combat.defense[eid] = PLAYER_BASE.defense;

  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  playerEid = eid;
  return eid;
}

export function createMonster(
  x: number,
  y: number,
  type: keyof typeof MONSTER_TYPES
): number {
  const monsterConfig = MONSTER_TYPES[type];
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Renderable, eid);
  addComponent(world, Health, eid);
  addComponent(world, Combat, eid);
  addComponent(world, AI, eid);
  addComponent(world, Monster, eid);

  Position.x[eid] = x;
  Position.y[eid] = y;

  Renderable.color[eid] = hexToInt(COLORS.MONSTER);
  Renderable.visible[eid] = 1;
  Renderable.emojiIndex[eid] = EmojiIndex[type];

  Health.current[eid] = monsterConfig.health;
  Health.max[eid] = monsterConfig.health;

  Combat.attack[eid] = monsterConfig.attack;
  Combat.defense[eid] = monsterConfig.defense;

  AI.type[eid] = monsterConfig.aiType;
  AI.state[eid] = 0;
  AI.targetEid[eid] = 0;
  AI.lastMoveX[eid] = 0;
  AI.lastMoveY[eid] = 0;

  return eid;
}

export function createChest(x: number, y: number): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Renderable, eid);
  addComponent(world, Chest, eid);

  Position.x[eid] = x;
  Position.y[eid] = y;

  Renderable.color[eid] = hexToInt(COLORS.CHEST);
  Renderable.visible[eid] = 1;
  Renderable.emojiIndex[eid] = EmojiIndex.CHEST;

  return eid;
}

export function createTrap(x: number, y: number): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Renderable, eid);
  addComponent(world, Trap, eid);

  Position.x[eid] = x;
  Position.y[eid] = y;

  Renderable.color[eid] = hexToInt(COLORS.TRAP);
  Renderable.visible[eid] = 0;
  Renderable.emojiIndex[eid] = EmojiIndex.TRAP;

  return eid;
}

export function createStairs(x: number, y: number): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Renderable, eid);
  addComponent(world, Stairs, eid);

  Position.x[eid] = x;
  Position.y[eid] = y;

  Renderable.color[eid] = hexToInt(COLORS.STAIRS);
  Renderable.visible[eid] = 1;
  Renderable.emojiIndex[eid] = EmojiIndex.STAIRS;

  return eid;
}

export function createWall(x: number, y: number): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Renderable, eid);
  addComponent(world, Wall, eid);

  Position.x[eid] = x;
  Position.y[eid] = y;

  Renderable.color[eid] = hexToInt(COLORS.WALL);
  Renderable.visible[eid] = 1;
  Renderable.emojiIndex[eid] = 0;

  return eid;
}

export function removeGameEntity(eid: number): void {
  if (hasComponent(world, Position, eid)) removeComponent(world, Position, eid);
  if (hasComponent(world, Renderable, eid)) removeComponent(world, Renderable, eid);
  if (hasComponent(world, Health, eid)) removeComponent(world, Health, eid);
  if (hasComponent(world, Combat, eid)) removeComponent(world, Combat, eid);
  if (hasComponent(world, AI, eid)) removeComponent(world, AI, eid);
  if (hasComponent(world, Velocity, eid)) removeComponent(world, Velocity, eid);
  if (hasComponent(world, Player, eid)) removeComponent(world, Player, eid);
  if (hasComponent(world, Monster, eid)) removeComponent(world, Monster, eid);
  if (hasComponent(world, Chest, eid)) removeComponent(world, Chest, eid);
  if (hasComponent(world, Trap, eid)) removeComponent(world, Trap, eid);
  if (hasComponent(world, Stairs, eid)) removeComponent(world, Stairs, eid);
  if (hasComponent(world, Wall, eid)) removeComponent(world, Wall, eid);
  removeEntity(world, eid);
}

export function addMessage(message: string): void {
  if (!world.messages) {
    world.messages = [];
  }
  world.messages.push(message);
  if (world.messages.length > 50) {
    world.messages.shift();
  }
}

function hexToInt(hex: string): number {
  const hexStr = hex.replace('#', '');
  const r = parseInt(hexStr.substring(0, 2), 16);
  const g = parseInt(hexStr.substring(2, 4), 16);
  const b = parseInt(hexStr.substring(4, 6), 16);
  return (r << 16) | (g << 8) | b;
}

export function intToHex(color: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function addComponent(world: GameWorld, comp: any, eid: number): void {
  comp[eid] = true;
}

function removeComponent(world: GameWorld, comp: any, eid: number): void {
  delete comp[eid];
}

function hasComponent(world: GameWorld, comp: any, eid: number): boolean {
  return comp[eid] !== undefined;
}
