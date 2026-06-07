import { world, addMessage } from '../world';
import { Position, Velocity, velocityQuery, Player, Monster, Chest, Trap, Stairs, Renderable, Health, playerQuery, Ghost, PhaseThroughWalls } from '../components';
import { checkCollision, CollisionResult } from './collision';
import { removeGameEntity } from '../world';
import { MONSTER_TYPES } from '../../constants/gameConfig';
import { getMonsterType } from './ai';

export function processMovement(world: any): {
  triggeredTrap?: number;
  reachedStairs?: boolean;
  openedChest?: number;
} {
  const entities = velocityQuery(world);
  let result: {
    triggeredTrap?: number;
    reachedStairs?: boolean;
    openedChest?: number;
  } = {};

  for (const eid of entities) {
    const vx = Velocity.x[eid];
    const vy = Velocity.y[eid];

    if (vx === 0 && vy === 0) continue;

    const newX = Position.x[eid] + vx;
    const newY = Position.y[eid] + vy;

    const canPhaseThroughWalls = PhaseThroughWalls[eid] !== undefined;
    const collision = checkCollision(newX, newY, eid, canPhaseThroughWalls);

    const canMove = collision.canMove || (canPhaseThroughWalls && collision.collisionType === 'wall');

    if (canMove) {
      Position.x[eid] = newX;
      Position.y[eid] = newY;

      if (Monster[eid]) {
        const monsterType = getMonsterType(eid);
        if (monsterType) {
          const config = MONSTER_TYPES[monsterType] as any;
          if (config.moveHealthCost && config.moveHealthCost > 0) {
            const currentHealth = Health.current[eid];
            const newHealth = Math.max(0, currentHealth - config.moveHealthCost);
            Health.current[eid] = newHealth;

            if (monsterType === 'GHOST') {
              addMessage(`幽灵穿墙移动，损失 ${config.moveHealthCost} 点生命值。`);
            }

            if (newHealth <= 0) {
              addMessage(`怪物因移动消耗过度而死亡！`);
              removeGameEntity(eid);
              Velocity.x[eid] = 0;
              Velocity.y[eid] = 0;
              continue;
            }
          }
        }
      }

      if (collision.collisionType === 'trap' && collision.targetEid !== undefined) {
        result.triggeredTrap = collision.targetEid;
        handleTrapTrigger(eid, collision.targetEid);
      } else if (collision.collisionType === 'stairs') {
        result.reachedStairs = true;
      }
    } else if (collision.collisionType === 'chest' && collision.targetEid !== undefined) {
      if (Player[eid]) {
        result.openedChest = collision.targetEid;
        handleChestOpen(collision.targetEid);
      }
    }

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;
  }

  return result;
}

function handleTrapTrigger(triggerEid: number, trapEid: number): void {
  const trapDamage = 10 + Math.floor(Math.random() * 10);

  if (Player[triggerEid]) {
    const health = Health.current[triggerEid];
    Health.current[triggerEid] = Math.max(0, health - trapDamage);
    addMessage(`你触发了陷阱！受到 ${trapDamage} 点伤害。`);

    if (Renderable.visible[trapEid] === 0) {
      Renderable.visible[trapEid] = 1;
    }
  } else if (Monster[triggerEid]) {
    const health = Health.current[triggerEid];
    Health.current[triggerEid] = Math.max(0, health - trapDamage);
    addMessage(`怪物触发了陷阱！`);

    if (Health.current[triggerEid] <= 0) {
      addMessage(`怪物被陷阱杀死了！`);
      removeGameEntity(triggerEid);
    }
  }

  removeGameEntity(trapEid);
}

function handleChestOpen(chestEid: number): void {
  const healAmount = 15 + Math.floor(Math.random() * 20);
  const players = playerQuery(world);

  if (players.length > 0) {
    const playerEid = players[0];
    const maxHealth = Health.max[playerEid];
    const currentHealth = Health.current[playerEid];
    const actualHeal = Math.min(healAmount, maxHealth - currentHealth);

    Health.current[playerEid] = Math.min(maxHealth, currentHealth + healAmount);

    if (actualHeal > 0) {
      addMessage(`打开宝箱！恢复了 ${actualHeal} 点生命值。`);
    } else {
      addMessage(`打开宝箱！但生命值已满。`);
    }
  }

  removeGameEntity(chestEid);
}

export function setVelocity(eid: number, dx: number, dy: number): void {
  Velocity.x[eid] = dx;
  Velocity.y[eid] = dy;
}
