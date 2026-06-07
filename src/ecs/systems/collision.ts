import { world, playerEid } from '../world';
import { Position, Player, Monster, Chest, Trap, Stairs, Wall, monsterQuery, chestQuery, trapQuery, stairsQuery } from '../components';
import { MAP_WIDTH, MAP_HEIGHT, TILE } from '../../constants/gameConfig';

export interface CollisionResult {
  canMove: boolean;
  collisionType?: 'wall' | 'monster' | 'chest' | 'trap' | 'stairs' | 'player' | 'outOfBounds';
  targetEid?: number;
}

export function checkCollision(
  x: number,
  y: number,
  ignoreEid: number = -1
): CollisionResult {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return { canMove: false, collisionType: 'outOfBounds' };
  }

  if (world.map && world.map[y][x] === TILE.WALL) {
    return { canMove: false, collisionType: 'wall' };
  }

  const monsters = monsterQuery(world);
  for (const eid of monsters) {
    if (eid !== ignoreEid && Position.x[eid] === x && Position.y[eid] === y) {
      return { canMove: false, collisionType: 'monster', targetEid: eid };
    }
  }

  const chests = chestQuery(world);
  for (const eid of chests) {
    if (eid !== ignoreEid && Position.x[eid] === x && Position.y[eid] === y) {
      return { canMove: false, collisionType: 'chest', targetEid: eid };
    }
  }

  const traps = trapQuery(world);
  for (const eid of traps) {
    if (eid !== ignoreEid && Position.x[eid] === x && Position.y[eid] === y) {
      return { canMove: true, collisionType: 'trap', targetEid: eid };
    }
  }

  const stairs = stairsQuery(world);
  for (const eid of stairs) {
    if (eid !== ignoreEid && Position.x[eid] === x && Position.y[eid] === y) {
      return { canMove: true, collisionType: 'stairs', targetEid: eid };
    }
  }

  if (ignoreEid !== playerEid && playerEid > 0) {
    if (Position.x[playerEid] === x && Position.y[playerEid] === y) {
      return { canMove: false, collisionType: 'player', targetEid: playerEid };
    }
  }

  return { canMove: true };
}

export function isPositionOccupied(x: number, y: number, ignoreEid: number = -1): boolean {
  const result = checkCollision(x, y, ignoreEid);
  return !result.canMove || result.collisionType === 'trap' || result.collisionType === 'stairs';
}

export function getEntityAtPosition(x: number, y: number): number | null {
  if (playerEid > 0 && Position.x[playerEid] === x && Position.y[playerEid] === y) {
    return playerEid;
  }

  const monsters = monsterQuery(world);
  for (const eid of monsters) {
    if (Position.x[eid] === x && Position.y[eid] === y) {
      return eid;
    }
  }

  const chests = chestQuery(world);
  for (const eid of chests) {
    if (Position.x[eid] === x && Position.y[eid] === y) {
      return eid;
    }
  }

  const traps = trapQuery(world);
  for (const eid of traps) {
    if (Position.x[eid] === x && Position.y[eid] === y) {
      return eid;
    }
  }

  const stairs = stairsQuery(world);
  for (const eid of stairs) {
    if (Position.x[eid] === x && Position.y[eid] === y) {
      return eid;
    }
  }

  return null;
}

export function getDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function isAdjacent(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean {
  return getDistance(x1, y1, x2, y2) === 1;
}
