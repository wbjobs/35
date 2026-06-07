import { world, playerEid } from '../world';
import { AI, Position, aiQuery, Velocity, Player, Monster } from '../components';
import { checkCollision, getDistance, isAdjacent } from './collision';
import { findAdjacentEnemy, findNearestEnemy } from './combat';
import { setVelocity } from './movement';
import { AI_STATE } from '../../constants/gameConfig';

interface AIAction {
  type: 'move';
  dx: number;
  dy: number;
}

export function processAI(world: any): AIAction[] {
  const actions: AIAction[] = [];
  const monsters = aiQuery(world);

  for (const eid of monsters) {
    const action = processMonsterAI(eid);
    if (action) {
      actions.push(action);
      executeAIAction(eid, action);
    }
  }

  return actions;
}

function processMonsterAI(eid: number): AIAction | null {
  const aiType = AI.type[eid];

  const playerX = Position.x[playerEid];
  const playerY = Position.y[playerEid];
  const monsterX = Position.x[eid];
  const monsterY = Position.y[eid];

  const adjacentEnemy = findAdjacentEnemy(eid);
  if (adjacentEnemy !== null) {
    AI.state[eid] = AI_STATE.ATTACK;
    AI.targetEid[eid] = adjacentEnemy;
    return null;
  }

  const nearestEnemy = findNearestEnemy(eid, 4);
  if (nearestEnemy !== null) {
    AI.state[eid] = AI_STATE.CHASE;
    AI.targetEid[eid] = nearestEnemy;

    const targetX = Position.x[nearestEnemy];
    const targetY = Position.y[nearestEnemy];
    const moveDir = getChaseDirection(monsterX, monsterY, targetX, targetY, eid);

    if (moveDir) {
      return {
        type: 'move',
        dx: moveDir.dx,
        dy: moveDir.dy,
      };
    }
  }

  if (aiType === 1) {
    AI.state[eid] = AI_STATE.PATROL;
    const patrolDir = getPatrolDirection(eid);
    if (patrolDir) {
      return {
        type: 'move',
        dx: patrolDir.dx,
        dy: patrolDir.dy,
      };
    }
  }

  AI.state[eid] = AI_STATE.IDLE;
  return null;
}

function getChaseDirection(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  eid: number
): { dx: number; dy: number } | null {
  const directions = [
    { dx: Math.sign(toX - fromX), dy: 0 },
    { dx: 0, dy: Math.sign(toY - fromY) },
    { dx: Math.sign(toX - fromX), dy: Math.sign(toY - fromY) },
  ].filter(d => d.dx !== 0 || d.dy !== 0);

  for (const dir of directions) {
    const newX = fromX + dir.dx;
    const newY = fromY + dir.dy;
    const collision = checkCollision(newX, newY, eid);

    if (collision.canMove || collision.collisionType === 'stairs' || collision.collisionType === 'trap') {
      return dir;
    }

    if (collision.collisionType === 'player') {
      return dir;
    }
  }

  return null;
}

function getPatrolDirection(eid: number): { dx: number; dy: number } | null {
  const lastMoveX = AI.lastMoveX[eid];
  const lastMoveY = AI.lastMoveY[eid];
  const monsterX = Position.x[eid];
  const monsterY = Position.y[eid];

  if (lastMoveX !== 0 || lastMoveY !== 0) {
    const newX = monsterX + lastMoveX;
    const newY = monsterY + lastMoveY;
    const collision = checkCollision(newX, newY, eid);

    if (collision.canMove && Math.random() > 0.3) {
      return { dx: lastMoveX, dy: lastMoveY };
    }
  }

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  const validDirections: { dx: number; dy: number }[] = [];

  for (const dir of directions) {
    const newX = monsterX + dir.dx;
    const newY = monsterY + dir.dy;
    const collision = checkCollision(newX, newY, eid);

    if (collision.canMove) {
      validDirections.push(dir);
    }
  }

  if (validDirections.length > 0) {
    return validDirections[Math.floor(Math.random() * validDirections.length)];
  }

  return null;
}

function executeAIAction(eid: number, action: AIAction): void {
  setVelocity(eid, action.dx, action.dy);
  AI.lastMoveX[eid] = action.dx;
  AI.lastMoveY[eid] = action.dy;
}

export function getMonsterAIState(eid: number): number {
  return AI.state[eid];
}

export function getMonsterAIType(eid: number): number {
  return AI.type[eid];
}
