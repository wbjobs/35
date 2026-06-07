import { MAP_WIDTH, MAP_HEIGHT, TILE } from '../constants/gameConfig';

interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left?: BSPNode;
  right?: BSPNode;
  room?: Room;
}

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

const MIN_ROOM_SIZE = 3;
const MAX_DEPTH = 3;

export function generateBSPDungeon(): {
  map: number[][];
  rooms: Room[];
  playerStart: { x: number; y: number };
  stairsPos: { x: number; y: number };
} {
  const map: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[y][x] = TILE.WALL;
    }
  }

  const root: BSPNode = {
    x: 0,
    y: 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  };

  splitNode(root, 0);
  const rooms: Room[] = [];
  createRooms(root, rooms);
  carveRooms(map, rooms);
  connectRooms(map, root);

  const playerStart = {
    x: rooms[0].centerX,
    y: rooms[0].centerY,
  };

  const stairsPos = {
    x: rooms[rooms.length - 1].centerX,
    y: rooms[rooms.length - 1].centerY,
  };

  return { map, rooms, playerStart, stairsPos };
}

function splitNode(node: BSPNode, depth: number): void {
  if (depth >= MAX_DEPTH) return;

  const canSplitH = node.height >= MIN_ROOM_SIZE * 2;
  const canSplitV = node.width >= MIN_ROOM_SIZE * 2;

  if (!canSplitH && !canSplitV) return;

  let splitHorizontally = false;
  if (canSplitH && canSplitV) {
    splitHorizontally = Math.random() > 0.5;
  } else if (canSplitH) {
    splitHorizontally = true;
  } else if (canSplitV) {
    splitHorizontally = false;
  }

  if (splitHorizontally) {
    const splitMin = node.y + MIN_ROOM_SIZE;
    const splitMax = node.y + node.height - MIN_ROOM_SIZE;
    if (splitMax <= splitMin) return;

    const splitY = Math.floor(Math.random() * (splitMax - splitMin + 1)) + splitMin;

    node.left = {
      x: node.x,
      y: node.y,
      width: node.width,
      height: splitY - node.y,
    };

    node.right = {
      x: node.x,
      y: splitY,
      width: node.width,
      height: node.y + node.height - splitY,
    };
  } else {
    const splitMin = node.x + MIN_ROOM_SIZE;
    const splitMax = node.x + node.width - MIN_ROOM_SIZE;
    if (splitMax <= splitMin) return;

    const splitX = Math.floor(Math.random() * (splitMax - splitMin + 1)) + splitMin;

    node.left = {
      x: node.x,
      y: node.y,
      width: splitX - node.x,
      height: node.height,
    };

    node.right = {
      x: splitX,
      y: node.y,
      width: node.x + node.width - splitX,
      height: node.height,
    };
  }

  splitNode(node.left, depth + 1);
  splitNode(node.right, depth + 1);
}

function createRooms(node: BSPNode, rooms: Room[]): void {
  if (node.left || node.right) {
    if (node.left) createRooms(node.left, rooms);
    if (node.right) createRooms(node.right, rooms);
  } else {
    const roomWidth = Math.max(MIN_ROOM_SIZE, Math.floor(node.width * 0.7));
    const roomHeight = Math.max(MIN_ROOM_SIZE, Math.floor(node.height * 0.7));

    const roomX =
      node.x + Math.floor(Math.random() * (node.width - roomWidth));
    const roomY =
      node.y + Math.floor(Math.random() * (node.height - roomHeight));

    node.room = {
      x: Math.max(1, roomX),
      y: Math.max(1, roomY),
      width: Math.min(roomWidth, MAP_WIDTH - 2),
      height: Math.min(roomHeight, MAP_HEIGHT - 2),
      centerX: 0,
      centerY: 0,
    };

    node.room.centerX = Math.floor(node.room.x + node.room.width / 2);
    node.room.centerY = Math.floor(node.room.y + node.room.height / 2);

    rooms.push(node.room);
  }
}

function carveRooms(map: number[][], rooms: Room[]): void {
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
          map[y][x] = TILE.FLOOR;
        }
      }
    }
  }
}

function connectRooms(map: number[][], node: BSPNode): void {
  if (node.left && node.right) {
    const leftRoom = getLeafRoom(node.left);
    const rightRoom = getLeafRoom(node.right);

    if (leftRoom && rightRoom) {
      createCorridor(map, leftRoom.centerX, leftRoom.centerY, rightRoom.centerX, rightRoom.centerY);
    }

    connectRooms(map, node.left);
    connectRooms(map, node.right);
  }
}

function getLeafRoom(node: BSPNode): Room | undefined {
  if (node.room) return node.room;
  if (node.left) {
    const leftRoom = getLeafRoom(node.left);
    if (leftRoom) return leftRoom;
  }
  if (node.right) {
    const rightRoom = getLeafRoom(node.right);
    if (rightRoom) return rightRoom;
  }
  return undefined;
}

function createCorridor(
  map: number[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  let x = x1;
  let y = y1;

  const horizontalFirst = Math.random() > 0.5;

  if (horizontalFirst) {
    while (x !== x2) {
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        map[y][x] = TILE.FLOOR;
      }
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        map[y][x] = TILE.FLOOR;
      }
      y += y < y2 ? 1 : -1;
    }
  } else {
    while (y !== y2) {
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        map[y][x] = TILE.FLOOR;
      }
      y += y < y2 ? 1 : -1;
    }
    while (x !== x2) {
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        map[y][x] = TILE.FLOOR;
      }
      x += x < x2 ? 1 : -1;
    }
  }

  if (x2 >= 0 && x2 < MAP_WIDTH && y2 >= 0 && y2 < MAP_HEIGHT) {
    map[y2][x2] = TILE.FLOOR;
  }
}

export function getEmptyFloorTiles(
  map: number[][],
  excludePositions: { x: number; y: number }[] = []
): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [];
  const excludeSet = new Set(excludePositions.map(p => `${p.x},${p.y}`));

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x] === TILE.FLOOR && !excludeSet.has(`${x},${y}`)) {
        tiles.push({ x, y });
      }
    }
  }

  return tiles;
}

export function getRandomEmptyTile(
  map: number[][],
  excludePositions: { x: number; y: number }[] = []
): { x: number; y: number } | null {
  const tiles = getEmptyFloorTiles(map, excludePositions);
  if (tiles.length === 0) return null;
  return tiles[Math.floor(Math.random() * tiles.length)];
}
