import { world, createPlayer, createMonster, createChest, createTrap, createStairs, addMessage, resetWorld } from '../ecs/world';
import { generateBSPDungeon, getRandomEmptyTile } from './bsp';
import { MONSTER_TYPES } from '../constants/gameConfig';

interface DungeonOptions {
  monsterCount?: number;
  chestCount?: number;
  trapCount?: number;
}

export function generateFloor(options: DungeonOptions = {}): void {
  const { monsterCount = 3, chestCount = 2, trapCount = 2 } = options;

  const { map, playerStart, stairsPos } = generateBSPDungeon();
  world.map = map;

  createPlayer(playerStart.x, playerStart.y);
  createStairs(stairsPos.x, stairsPos.y);

  const usedPositions = [playerStart, stairsPos];

  const monsterTypes = Object.keys(MONSTER_TYPES) as (keyof typeof MONSTER_TYPES)[];
  for (let i = 0; i < monsterCount; i++) {
    const pos = getRandomEmptyTile(map, usedPositions);
    if (pos) {
      const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      createMonster(pos.x, pos.y, type);
      usedPositions.push(pos);
    }
  }

  for (let i = 0; i < chestCount; i++) {
    const pos = getRandomEmptyTile(map, usedPositions);
    if (pos) {
      createChest(pos.x, pos.y);
      usedPositions.push(pos);
    }
  }

  for (let i = 0; i < trapCount; i++) {
    const pos = getRandomEmptyTile(map, usedPositions);
    if (pos) {
      createTrap(pos.x, pos.y);
      usedPositions.push(pos);
    }
  }

  addMessage(`进入地牢第 ${world.floor} 层！`);
  addMessage(`使用方向键或 WASD 移动。`);
}

export function nextFloor(): void {
  if (!world.floor) world.floor = 1;
  world.floor += 1;
  if (!world.turn) world.turn = 1;

  const currentPlayerHealth = getCurrentPlayerHealth();
  const currentPlayerMaxHealth = getCurrentPlayerMaxHealth();
  const currentPlayerAttack = getCurrentPlayerAttack();
  const currentPlayerDefense = getCurrentPlayerDefense();

  resetWorld();

  world.floor = world.floor || 1;
  world.turn = 1;
  world.gamePhase = 'player';
  world.messages = [];
  world.pendingActions = [];

  const monsterCount = Math.min(3 + Math.floor(world.floor / 2), 6);
  const chestCount = Math.min(2 + Math.floor(world.floor / 3), 4);
  const trapCount = Math.min(2 + Math.floor(world.floor / 3), 4);

  const { map, playerStart, stairsPos } = generateBSPDungeon();
  world.map = map;

  const playerEid = createPlayer(playerStart.x, playerStart.y);
  import('../ecs/components').then(({ Health, Combat }) => {
    Health.current[playerEid] = Math.min(currentPlayerHealth + 10, currentPlayerMaxHealth);
    Health.max[playerEid] = currentPlayerMaxHealth;
    Combat.attack[playerEid] = currentPlayerAttack;
    Combat.defense[playerEid] = currentPlayerDefense;
  });

  createStairs(stairsPos.x, stairsPos.y);

  const usedPositions = [playerStart, stairsPos];

  const monsterTypes = Object.keys(MONSTER_TYPES) as (keyof typeof MONSTER_TYPES)[];
  for (let i = 0; i < monsterCount; i++) {
    const pos = getRandomEmptyTile(map, usedPositions);
    if (pos) {
      const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const monsterEid = createMonster(pos.x, pos.y, type);
      import('../ecs/components').then(({ Health, Combat }) => {
        const floorBonus = Math.floor(world.floor! / 2);
        Health.max[monsterEid] = Health.max[monsterEid] + floorBonus * 5;
        Health.current[monsterEid] = Health.max[monsterEid];
        Combat.attack[monsterEid] = Combat.attack[monsterEid] + floorBonus;
        Combat.defense[monsterEid] = Combat.defense[monsterEid] + Math.floor(floorBonus / 2);
      });
      usedPositions.push(pos);
    }
  }

  for (let i = 0; i < chestCount; i++) {
    const pos = getRandomEmptyTile(map, usedPositions);
    if (pos) {
      createChest(pos.x, pos.y);
      usedPositions.push(pos);
    }
  }

  for (let i = 0; i < trapCount; i++) {
    const pos = getRandomEmptyTile(map, usedPositions);
    if (pos) {
      createTrap(pos.x, pos.y);
      usedPositions.push(pos);
    }
  }

  addMessage(`进入地牢第 ${world.floor} 层！`);
  addMessage(`你恢复了一些生命值。`);
}

function getCurrentPlayerHealth(): number {
  return 100;
}

function getCurrentPlayerMaxHealth(): number {
  return 100;
}

function getCurrentPlayerAttack(): number {
  return 10;
}

function getCurrentPlayerDefense(): number {
  return 5;
}

export function initNewGame(): void {
  resetWorld();
  world.floor = 1;
  world.turn = 1;
  world.gamePhase = 'player';
  world.messages = [];
  world.pendingActions = [];

  generateFloor({
    monsterCount: 3,
    chestCount: 2,
    trapCount: 2,
  });
}
