import { world, playerEid, addMessage } from '../world';
import {
  AI,
  Position,
  aiQuery,
  Velocity,
  Player,
  Monster,
  Skeleton,
  Mage,
  Ghost,
  PhaseThroughWalls,
  Health,
} from '../components';
import { checkCollision, getDistance, isAdjacent } from './collision';
import { findAdjacentEnemy, findNearestEnemy, attack } from './combat';
import { setVelocity } from './movement';
import { AI_STATE, MONSTER_TYPES, AI_TYPE, MAP_WIDTH, MAP_HEIGHT } from '../../constants/gameConfig';
import {
  BTNode,
  BTContext,
  BTNodeStatus,
  Sequence,
  Selector,
  Inverter,
  Condition,
  Random,
  Action,
  IsAdjacentToPlayer,
  IsPlayerWithinRange,
  IsLowHealth,
  HasFleeChance,
  CanPhaseThroughWalls,
  IsRanged,
} from './behaviorTree';

type MonsterTypeKey = keyof typeof MONSTER_TYPES;

export interface AIAction {
  type: 'move' | 'ranged_attack' | 'flee' | 'teleport';
  dx?: number;
  dy?: number;
  targetEid?: number;
}

export function getMonsterType(eid: number): MonsterTypeKey | null {
  if (Skeleton[eid]) return 'SKELETON';
  if (Mage[eid]) return 'MAGE';
  if (Ghost[eid]) return 'GHOST';

  const aiType = AI.type[eid];
  if (aiType === AI_TYPE.PASSIVE) return 'SLIME';
  if (aiType === AI_TYPE.AGGRESSIVE) {
    const health = Health.max[eid];
    if (health > 30) return 'ORC';
    return 'GOBLIN';
  }
  return null;
}

export function processAI(world: any): AIAction[] {
  const actions: AIAction[] = [];
  const monsters = aiQuery(world);

  for (const eid of monsters) {
    const monsterType = getMonsterType(eid);
    if (!monsterType) continue;

    const context: BTContext = { eid, monsterType };
    const behaviorTree = getBehaviorTree(monsterType);
    const status = behaviorTree(context);

    if (status === 'success') {
      const action = getPendingAction(eid);
      if (action) {
        actions.push(action);
        executeAIAction(eid, action);
      }
    }

    clearPendingAction(eid);
  }

  return actions;
}

const pendingActions = new Map<number, AIAction>();

function setPendingAction(eid: number, action: AIAction): void {
  pendingActions.set(eid, action);
}

function getPendingAction(eid: number): AIAction | undefined {
  return pendingActions.get(eid);
}

function clearPendingAction(eid: number): void {
  pendingActions.delete(eid);
}

function getBehaviorTree(monsterType: MonsterTypeKey): BTNode {
  switch (monsterType) {
    case 'SKELETON':
      return createSkeletonTree();
    case 'MAGE':
      return createMageTree();
    case 'GHOST':
      return createGhostTree();
    case 'GOBLIN':
    case 'ORC':
      return createAggressiveTree();
    case 'SLIME':
      return createPassiveTree();
    default:
      return createPassiveTree();
  }
}

function createSkeletonTree(): BTNode {
  return Selector(
    Sequence(
      IsLowHealth(),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.FLEE;
        const fleeDir = getFleeDirection(context.eid);
        if (fleeDir) {
          setPendingAction(context.eid, { type: 'flee', dx: fleeDir.dx, dy: fleeDir.dy });
          return 'success';
        }
        return 'failure';
      })
    ),
    Sequence(
      IsAdjacentToPlayer(),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.ATTACK;
        return 'success';
      })
    ),
    Sequence(
      IsPlayerWithinRange(5),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.CHASE;
        const dir = getChaseDirection(context.eid);
        if (dir) {
          setPendingAction(context.eid, { type: 'move', dx: dir.dx, dy: dir.dy });
          return 'success';
        }
        return 'failure';
      })
    ),
    Action((context) => {
      AI.state[context.eid] = AI_STATE.PATROL;
      const dir = getPatrolDirection(context.eid);
      if (dir) {
        setPendingAction(context.eid, { type: 'move', dx: dir.dx, dy: dir.dy });
        return 'success';
      }
      AI.state[context.eid] = AI_STATE.IDLE;
      return 'success';
    })
  );
}

function createMageTree(): BTNode {
  return Selector(
    Sequence(
      IsLowHealth(),
      HasFleeChance(),
      Random(0.3),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.FLEE;
        const teleportPos = getRandomTeleportPosition(context.eid);
        if (teleportPos) {
          setPendingAction(context.eid, {
            type: 'teleport',
            dx: teleportPos.x - Position.x[context.eid],
            dy: teleportPos.y - Position.y[context.eid],
          });
          addMessage('法师施放了传送术逃跑了！');
          return 'success';
        }
        return 'failure';
      })
    ),
    Sequence(
      IsLowHealth(),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.FLEE;
        const fleeDir = getFleeDirection(context.eid);
        if (fleeDir) {
          setPendingAction(context.eid, { type: 'flee', dx: fleeDir.dx, dy: fleeDir.dy });
          return 'success';
        }
        return 'failure';
      })
    ),
    Sequence(
      IsAdjacentToPlayer(),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.ATTACK;
        return 'success';
      })
    ),
    Sequence(
      IsRanged(),
      IsPlayerWithinRange(3),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.ATTACK;
        setPendingAction(context.eid, {
          type: 'ranged_attack',
          targetEid: playerEid,
        });
        return 'success';
      })
    ),
    Sequence(
      IsPlayerWithinRange(6),
      Inverter(IsPlayerWithinRange(2)),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.CHASE;
        const dir = getChaseDirection(context.eid);
        if (dir) {
          setPendingAction(context.eid, { type: 'move', dx: dir.dx, dy: dir.dy });
          return 'success';
        }
        return 'failure';
      })
    ),
    Action((context) => {
      AI.state[context.eid] = AI_STATE.IDLE;
      return 'success';
    })
  );
}

function createGhostTree(): BTNode {
  return Selector(
    Sequence(
      IsLowHealth(),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.FLEE;
        const fleeDir = getFleeDirection(context.eid, true);
        if (fleeDir) {
          setPendingAction(context.eid, { type: 'flee', dx: fleeDir.dx, dy: fleeDir.dy });
          return 'success';
        }
        return 'failure';
      })
    ),
    Sequence(
      IsAdjacentToPlayer(),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.ATTACK;
        return 'success';
      })
    ),
    Sequence(
      IsPlayerWithinRange(6),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.CHASE;
        const dir = getChaseDirection(context.eid, true);
        if (dir) {
          setPendingAction(context.eid, { type: 'move', dx: dir.dx, dy: dir.dy });
          return 'success';
        }
        return 'failure';
      })
    ),
    Action((context) => {
      AI.state[context.eid] = AI_STATE.PATROL;
      const dir = getPatrolDirection(context.eid, true);
      if (dir) {
        setPendingAction(context.eid, { type: 'move', dx: dir.dx, dy: dir.dy });
        return 'success';
      }
      AI.state[context.eid] = AI_STATE.IDLE;
      return 'success';
    })
  );
}

function createAggressiveTree(): BTNode {
  return Selector(
    Sequence(
      IsAdjacentToPlayer(),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.ATTACK;
        return 'success';
      })
    ),
    Sequence(
      IsPlayerWithinRange(4),
      Action((context) => {
        AI.state[context.eid] = AI_STATE.CHASE;
        const dir = getChaseDirection(context.eid);
        if (dir) {
          setPendingAction(context.eid, { type: 'move', dx: dir.dx, dy: dir.dy });
          return 'success';
        }
        return 'failure';
      })
    ),
    Action((context) => {
      AI.state[context.eid] = AI_STATE.PATROL;
      const dir = getPatrolDirection(context.eid);
      if (dir) {
        setPendingAction(context.eid, { type: 'move', dx: dir.dx, dy: dir.dy });
        return 'success';
      }
      AI.state[context.eid] = AI_STATE.IDLE;
      return 'success';
    })
  );
}

function createPassiveTree(): BTNode {
  return Action((context) => {
    AI.state[context.eid] = AI_STATE.IDLE;
    return 'success';
  });
}

function getChaseDirection(eid: number, ignoreWalls: boolean = false): { dx: number; dy: number } | null {
  const fromX = Position.x[eid];
  const fromY = Position.y[eid];
  const toX = Position.x[playerEid];
  const toY = Position.y[playerEid];

  const directions = [
    { dx: Math.sign(toX - fromX), dy: 0 },
    { dx: 0, dy: Math.sign(toY - fromY) },
  ].filter(d => d.dx !== 0 || d.dy !== 0);

  for (const dir of directions) {
    const newX = fromX + dir.dx;
    const newY = fromY + dir.dy;
    const collision = checkCollision(newX, newY, eid, ignoreWalls);

    if (collision.canMove || collision.collisionType === 'stairs' || collision.collisionType === 'trap') {
      return dir;
    }

    if (collision.collisionType === 'player') {
      return dir;
    }
  }

  return null;
}

function getFleeDirection(eid: number, ignoreWalls: boolean = false): { dx: number; dy: number } | null {
  const fromX = Position.x[eid];
  const fromY = Position.y[eid];
  const playerX = Position.x[playerEid];
  const playerY = Position.y[playerEid];

  const directions = [
    { dx: -Math.sign(playerX - fromX), dy: 0 },
    { dx: 0, dy: -Math.sign(playerY - fromY) },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ].filter(d => d.dx !== 0 || d.dy !== 0);

  for (const dir of directions) {
    const newX = fromX + dir.dx;
    const newY = fromY + dir.dy;
    const collision = checkCollision(newX, newY, eid, ignoreWalls);

    if (collision.canMove || collision.collisionType === 'stairs' || collision.collisionType === 'trap') {
      return dir;
    }
  }

  return null;
}

function getPatrolDirection(eid: number, ignoreWalls: boolean = false): { dx: number; dy: number } | null {
  const lastMoveX = AI.lastMoveX[eid];
  const lastMoveY = AI.lastMoveY[eid];
  const monsterX = Position.x[eid];
  const monsterY = Position.y[eid];

  if (lastMoveX !== 0 || lastMoveY !== 0) {
    const newX = monsterX + lastMoveX;
    const newY = monsterY + lastMoveY;
    const collision = checkCollision(newX, newY, eid, ignoreWalls);

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
    const collision = checkCollision(newX, newY, eid, ignoreWalls);

    if (collision.canMove) {
      validDirections.push(dir);
    }
  }

  if (validDirections.length > 0) {
    return validDirections[Math.floor(Math.random() * validDirections.length)];
  }

  return null;
}

function getRandomTeleportPosition(eid: number): { x: number; y: number } | null {
  const monsterX = Position.x[eid];
  const monsterY = Position.y[eid];
  const playerX = Position.x[playerEid];
  const playerY = Position.y[playerEid];

  const validPositions: { x: number; y: number }[] = [];

  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const distToMonster = getDistance(x, y, monsterX, monsterY);
      const distToPlayer = getDistance(x, y, playerX, playerY);

      if (distToMonster >= 4 && distToPlayer >= 4) {
        const collision = checkCollision(x, y, eid);
        if (collision.canMove) {
          validPositions.push({ x, y });
        }
      }
    }
  }

  if (validPositions.length > 0) {
    return validPositions[Math.floor(Math.random() * validPositions.length)];
  }

  return null;
}

function executeAIAction(eid: number, action: AIAction): void {
  if (action.type === 'move' || action.type === 'flee') {
    if (action.dx !== undefined && action.dy !== undefined) {
      setVelocity(eid, action.dx, action.dy);
      AI.lastMoveX[eid] = action.dx;
      AI.lastMoveY[eid] = action.dy;
    }
  } else if (action.type === 'teleport') {
    if (action.dx !== undefined && action.dy !== undefined) {
      setVelocity(eid, action.dx, action.dy);
      AI.lastMoveX[eid] = action.dx;
      AI.lastMoveY[eid] = action.dy;
    }
  } else if (action.type === 'ranged_attack' && action.targetEid !== undefined) {
    attack(eid, action.targetEid);
  }
}

export function getMonsterAIState(eid: number): number {
  return AI.state[eid];
}

export function getMonsterAIType(eid: number): number {
  return AI.type[eid];
}
