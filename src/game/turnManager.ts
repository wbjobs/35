import { world, playerEid, addMessage } from '../ecs/world';
import { Position } from '../ecs/components';
import { setVelocity, processMovement } from '../ecs/systems/movement';
import { attack, isPlayerDead, findAdjacentEnemy } from '../ecs/systems/combat';
import { processAI } from '../ecs/systems/ai';
import { checkCollision } from '../ecs/systems/collision';
import { GAME_PHASE } from '../constants/gameConfig';
import { nextFloor } from '../dungeon/generator';
import { monsterQuery } from '../ecs/components';

export interface TurnResult {
  success: boolean;
  gameOver?: boolean;
  reachedStairs?: boolean;
  message?: string;
}

export function isPlayerTurn(): boolean {
  return world.gamePhase === GAME_PHASE.PLAYER_TURN;
}

export function isGameOver(): boolean {
  return world.gamePhase === GAME_PHASE.GAME_OVER;
}

export function playerMove(dx: number, dy: number): TurnResult {
  if (!isPlayerTurn() || isGameOver()) {
    return { success: false };
  }

  const playerX = Position.x[playerEid];
  const playerY = Position.y[playerEid];
  const targetX = playerX + dx;
  const targetY = playerY + dy;

  const adjacentEnemy = findAdjacentEnemy(playerEid);
  if (adjacentEnemy !== null) {
    const enemyX = Position.x[adjacentEnemy];
    const enemyY = Position.y[adjacentEnemy];
    if (enemyX === targetX && enemyY === targetY) {
      const result = attack(playerEid, adjacentEnemy);
      if (result.attackerKilled) {
        world.gamePhase = GAME_PHASE.GAME_OVER;
        return { success: true, gameOver: true };
      }
      endPlayerTurn();
      return { success: true };
    }
  }

  const checkResult = checkCollision(targetX, targetY, playerEid);

  if (!checkResult.canMove && checkResult.collisionType === 'monster' && checkResult.targetEid !== undefined) {
    const result = attack(playerEid, checkResult.targetEid);
    if (result.attackerKilled) {
      world.gamePhase = GAME_PHASE.GAME_OVER;
      return { success: true, gameOver: true };
    }
    endPlayerTurn();
    return { success: true };
  }

  if (!checkResult.canMove && checkResult.collisionType === 'chest' && checkResult.targetEid !== undefined) {
    setVelocity(playerEid, dx, dy);
    processMovement(world);
    endPlayerTurn();
    return { success: true };
  }

  if (checkResult.canMove || checkResult.collisionType === 'trap' || checkResult.collisionType === 'stairs') {
    setVelocity(playerEid, dx, dy);
    const moveResult = processMovement(world);

    if (isPlayerDead()) {
      world.gamePhase = GAME_PHASE.GAME_OVER;
      return { success: true, gameOver: true };
    }

    if (moveResult.reachedStairs) {
      return { success: true, reachedStairs: true };
    }

    endPlayerTurn();
    return { success: true };
  }

  return { success: false, message: '无法移动到该位置' };
}

function endPlayerTurn(): void {
  if (isPlayerDead()) {
    world.gamePhase = GAME_PHASE.GAME_OVER;
    return;
  }

  world.gamePhase = GAME_PHASE.MONSTER_TURN;
  setTimeout(() => {
    monsterTurn();
  }, 200);
}

function monsterTurn(): void {
  if (isPlayerDead()) {
    world.gamePhase = GAME_PHASE.GAME_OVER;
    return;
  }

  processAI(world);

  const monsters = monsterQuery(world);
  for (const eid of monsters) {
    const adjacentEnemy = findAdjacentEnemy(eid);
    if (adjacentEnemy !== null) {
      attack(eid, adjacentEnemy);
      if (isPlayerDead()) {
        world.gamePhase = GAME_PHASE.GAME_OVER;
        return;
      }
    }
  }

  processMovement(world);

  if (isPlayerDead()) {
    world.gamePhase = GAME_PHASE.GAME_OVER;
    return;
  }

  if (world.turn !== undefined) {
    world.turn += 1;
  }
  world.gamePhase = GAME_PHASE.PLAYER_TURN;
}

export function goToNextFloor(): void {
  const currentHealth = Position.x[playerEid] >= 0 ? 100 : 100;
  const currentMaxHealth = 100;
  const currentAttack = 10;
  const currentDefense = 5;

  import('../ecs/components').then(({ Health, Combat, playerQuery }) => {
    const players = playerQuery(world);
    if (players.length > 0) {
      const pEid = players[0];
      const savedHealth = Health.current[pEid];
      const savedMaxHealth = Health.max[pEid];
      const savedAttack = Combat.attack[pEid];
      const savedDefense = Combat.defense[pEid];

      nextFloor();

      import('../ecs/components').then(({ Health: H2, Combat: C2, playerQuery: pq2 }) => {
        const newPlayers = pq2(world);
        if (newPlayers.length > 0) {
          const newPEid = newPlayers[0];
          H2.current[newPEid] = Math.min(savedHealth + 10, savedMaxHealth);
          H2.max[newPEid] = savedMaxHealth;
          C2.attack[newPEid] = savedAttack;
          C2.defense[newPEid] = savedDefense;
        }
      });
    } else {
      nextFloor();
    }
  });

  world.gamePhase = GAME_PHASE.PLAYER_TURN;
  if (world.floor !== undefined) {
    addMessage(`你来到了地牢第 ${world.floor} 层！`);
  }
}

export function getTurn(): number {
  return world.turn || 1;
}

export function getFloor(): number {
  return world.floor || 1;
}

export function getGamePhase(): string {
  return world.gamePhase || GAME_PHASE.PLAYER_TURN;
}
