import { openDB, IDBPDatabase } from 'idb';
import { world, playerEid, resetWorld } from '../ecs/world';
import {
  Position,
  Renderable,
  Health,
  Combat,
  AI,
  Player,
  Monster,
  Chest,
  Trap,
  Stairs,
  playerQuery,
  monsterQuery,
  chestQuery,
  trapQuery,
  stairsQuery,
} from '../ecs/components';
import { createPlayer, createMonster, createChest, createTrap, createStairs } from '../ecs/world';
import { SAVE_VERSION, MONSTER_TYPES } from '../constants/gameConfig';

interface SaveData {
  id?: number;
  version: string;
  timestamp: number;
  floor: number;
  turn: number;
  gamePhase: string;
  messages: string[];
  map: number[][];
  entities: EntitySaveData[];
}

interface EntitySaveData {
  id: number;
  type: 'player' | 'monster' | 'chest' | 'trap' | 'stairs';
  monsterType?: string;
  position: { x: number; y: number };
  renderable: { color: number; visible: number; emojiIndex: number };
  health?: { current: number; max: number };
  combat?: { attack: number; defense: number };
  ai?: { type: number; state: number; lastMoveX: number; lastMoveY: number };
}

const DB_NAME = 'RoguelikeGameDB';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

let db: IDBPDatabase | null = null;

async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('floor', 'floor', { unique: false });
      }
    },
  });

  return db;
}

export async function saveGame(): Promise<number | null> {
  try {
    const database = await initDB();

    const entities: EntitySaveData[] = [];

    const players = playerQuery(world);
    for (const eid of players) {
      entities.push(serializeEntity(eid, 'player'));
    }

    const monsters = monsterQuery(world);
    for (const eid of monsters) {
      const monsterType = getMonsterType(eid);
      entities.push(serializeEntity(eid, 'monster', monsterType));
    }

    const chests = chestQuery(world);
    for (const eid of chests) {
      entities.push(serializeEntity(eid, 'chest'));
    }

    const traps = trapQuery(world);
    for (const eid of traps) {
      entities.push(serializeEntity(eid, 'trap'));
    }

    const stairs = stairsQuery(world);
    for (const eid of stairs) {
      entities.push(serializeEntity(eid, 'stairs'));
    }

    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      floor: world.floor || 1,
      turn: world.turn || 1,
      gamePhase: world.gamePhase || 'player',
      messages: world.messages || [],
      map: world.map || [],
      entities,
    };

    const id = await database.add(STORE_NAME, saveData);
    return id as number;
  } catch (error) {
    console.error('Failed to save game:', error);
    return null;
  }
}

export async function loadGame(saveId: number): Promise<boolean> {
  try {
    const database = await initDB();
    const saveData = await database.get(STORE_NAME, saveId);

    if (!saveData) {
      console.error('Save not found');
      return false;
    }

    resetWorld();

    world.floor = saveData.floor;
    world.turn = saveData.turn;
    world.gamePhase = saveData.gamePhase;
    world.messages = saveData.messages;
    world.map = saveData.map;

    for (const entityData of saveData.entities) {
      deserializeEntity(entityData);
    }

    return true;
  } catch (error) {
    console.error('Failed to load game:', error);
    return false;
  }
}

export async function getSaveList(): Promise<Array<{ id: number; timestamp: number; floor: number; turn: number }>> {
  try {
    const database = await initDB();
    const saves = await database.getAllFromIndex(STORE_NAME, 'timestamp');

    return saves
      .reverse()
      .slice(0, 10)
      .map(save => ({
        id: save.id,
        timestamp: save.timestamp,
        floor: save.floor,
        turn: save.turn,
      }));
  } catch (error) {
    console.error('Failed to get save list:', error);
    return [];
  }
}

export async function deleteSave(saveId: number): Promise<boolean> {
  try {
    const database = await initDB();
    await database.delete(STORE_NAME, saveId);
    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
}

function serializeEntity(
  eid: number,
  type: EntitySaveData['type'],
  monsterType?: string
): EntitySaveData {
  const data: EntitySaveData = {
    id: eid,
    type,
    position: {
      x: Position.x[eid],
      y: Position.y[eid],
    },
    renderable: {
      color: Renderable.color[eid],
      visible: Renderable.visible[eid],
      emojiIndex: Renderable.emojiIndex[eid],
    },
  };

  if (monsterType) {
    data.monsterType = monsterType;
  }

  if (Health[eid]) {
    data.health = {
      current: Health.current[eid],
      max: Health.max[eid],
    };
  }

  if (Combat[eid]) {
    data.combat = {
      attack: Combat.attack[eid],
      defense: Combat.defense[eid],
    };
  }

  if (AI[eid]) {
    data.ai = {
      type: AI.type[eid],
      state: AI.state[eid],
      lastMoveX: AI.lastMoveX[eid],
      lastMoveY: AI.lastMoveY[eid],
    };
  }

  return data;
}

function deserializeEntity(data: EntitySaveData): void {
  let eid: number;

  switch (data.type) {
    case 'player':
      eid = createPlayer(data.position.x, data.position.y);
      break;
    case 'monster':
      const monsterType = (data.monsterType as keyof typeof MONSTER_TYPES) || 'GOBLIN';
      eid = createMonster(data.position.x, data.position.y, monsterType);
      break;
    case 'chest':
      eid = createChest(data.position.x, data.position.y);
      break;
    case 'trap':
      eid = createTrap(data.position.x, data.position.y);
      break;
    case 'stairs':
      eid = createStairs(data.position.x, data.position.y);
      break;
    default:
      return;
  }

  Renderable.color[eid] = data.renderable.color;
  Renderable.visible[eid] = data.renderable.visible;
  Renderable.emojiIndex[eid] = data.renderable.emojiIndex;

  if (data.health && Health[eid]) {
    Health.current[eid] = data.health.current;
    Health.max[eid] = data.health.max;
  }

  if (data.combat && Combat[eid]) {
    Combat.attack[eid] = data.combat.attack;
    Combat.defense[eid] = data.combat.defense;
  }

  if (data.ai && AI[eid]) {
    AI.type[eid] = data.ai.type;
    AI.state[eid] = data.ai.state;
    AI.lastMoveX[eid] = data.ai.lastMoveX;
    AI.lastMoveY[eid] = data.ai.lastMoveY;
  }
}

function getMonsterType(eid: number): string {
  const emojiIndex = Renderable.emojiIndex[eid];
  const emojiToType: Record<number, string> = {
    5: 'GOBLIN',
    6: 'ORC',
    7: 'SLIME',
    8: 'SKELETON',
    9: 'MAGE',
    10: 'GHOST',
  };
  return emojiToType[emojiIndex] || 'GOBLIN';
}

export async function closeDB(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}
