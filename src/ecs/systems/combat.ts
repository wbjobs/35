import { world, addMessage } from '../world';
import { Health, Combat, Position, Player, Monster, playerQuery, monsterQuery, Renderable } from '../components';
import { removeGameEntity } from '../world';
import { isAdjacent, getDistance } from './collision';

export interface CombatResult {
  attackerEid: number;
  defenderEid: number;
  damage: number;
  defenderKilled: boolean;
  attackerKilled: boolean;
}

export function attack(attackerEid: number, defenderEid: number): CombatResult {
  const attackerAttack = Combat.attack[attackerEid];
  const defenderDefense = Combat.defense[defenderEid];

  const damageToDefender = Math.max(1, attackerAttack - defenderDefense + Math.floor(Math.random() * 5));
  const defenderCurrentHealth = Health.current[defenderEid];
  Health.current[defenderEid] = Math.max(0, defenderCurrentHealth - damageToDefender);

  const defenderKilled = Health.current[defenderEid] <= 0;

  let attackerKilled = false;

  if (defenderKilled) {
    if (Player[attackerEid]) {
      addMessage(`你对怪物造成了 ${damageToDefender} 点伤害！怪物被击败了！`);
    } else if (Monster[attackerEid]) {
      addMessage(`怪物对你造成了 ${damageToDefender} 点伤害！你被击败了...`);
    }
    removeGameEntity(defenderEid);
  } else {
    if (Player[attackerEid]) {
      addMessage(`你对怪物造成了 ${damageToDefender} 点伤害！`);
    } else if (Monster[attackerEid]) {
      addMessage(`怪物对你造成了 ${damageToDefender} 点伤害！`);
      attackerKilled = Health.current[defenderEid] <= 0;
    }
  }

  return {
    attackerEid,
    defenderEid,
    damage: damageToDefender,
    defenderKilled,
    attackerKilled,
  };
}

export function tryAttack(attackerEid: number, dx: number, dy: number): CombatResult | null {
  const attackerX = Position.x[attackerEid];
  const attackerY = Position.y[attackerEid];
  const targetX = attackerX + dx;
  const targetY = attackerY + dy;

  const targets = Player[attackerEid] ? monsterQuery(world) : playerQuery(world);

  for (const targetEid of targets) {
    if (Position.x[targetEid] === targetX && Position.y[targetEid] === targetY) {
      return attack(attackerEid, targetEid);
    }
  }

  return null;
}

export function findAdjacentEnemy(eid: number): number | null {
  const x = Position.x[eid];
  const y = Position.y[eid];
  const targets = Player[eid] ? monsterQuery(world) : playerQuery(world);

  for (const targetEid of targets) {
    if (isAdjacent(x, y, Position.x[targetEid], Position.y[targetEid])) {
      return targetEid;
    }
  }

  return null;
}

export function findNearestEnemy(eid: number, maxRange: number = 5): number | null {
  const x = Position.x[eid];
  const y = Position.y[eid];
  const targets = Player[eid] ? monsterQuery(world) : playerQuery(world);

  let nearestEid: number | null = null;
  let nearestDistance = Infinity;

  for (const targetEid of targets) {
    const distance = getDistance(x, y, Position.x[targetEid], Position.y[targetEid]);
    if (distance <= maxRange && distance < nearestDistance) {
      nearestDistance = distance;
      nearestEid = targetEid;
    }
  }

  return nearestEid;
}

export function isPlayerDead(): boolean {
  const players = playerQuery(world);
  if (players.length === 0) return true;
  return Health.current[players[0]] <= 0;
}

export function getPlayerHealth(): { current: number; max: number } {
  const players = playerQuery(world);
  if (players.length === 0) return { current: 0, max: 0 };
  return {
    current: Health.current[players[0]],
    max: Health.max[players[0]],
  };
}

export function getPlayerCombat(): { attack: number; defense: number } {
  const players = playerQuery(world);
  if (players.length === 0) return { attack: 0, defense: 0 };
  return {
    attack: Combat.attack[players[0]],
    defense: Combat.defense[players[0]],
  };
}
