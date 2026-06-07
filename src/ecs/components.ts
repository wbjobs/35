import {
  defineComponent,
  Types,
  defineQuery,
  defineSerializer,
  defineDeserializer,
} from 'bitecs';

export const Position = defineComponent({
  x: Types.ui8,
  y: Types.ui8,
});

export const Renderable = defineComponent({
  color: Types.ui32,
  visible: Types.ui8,
  emojiIndex: Types.ui8,
});

export const Health = defineComponent({
  current: Types.ui8,
  max: Types.ui8,
});

export const Combat = defineComponent({
  attack: Types.ui8,
  defense: Types.ui8,
});

export const AI = defineComponent({
  type: Types.ui8,
  state: Types.ui8,
  targetEid: Types.eid,
  lastMoveX: Types.i8,
  lastMoveY: Types.i8,
});

export const Velocity = defineComponent({
  x: Types.i8,
  y: Types.i8,
});

export const Player = defineComponent();
export const Monster = defineComponent();
export const Chest = defineComponent();
export const Trap = defineComponent();
export const Stairs = defineComponent();
export const Wall = defineComponent();

export const EmojiIndex = {
  PLAYER: 0,
  MONSTER: 1,
  CHEST: 2,
  TRAP: 3,
  STAIRS: 4,
  GOBLIN: 5,
  ORC: 6,
  SLIME: 7,
} as const;

export const playerQuery = defineQuery([Player, Position, Health, Combat]);
export const monsterQuery = defineQuery([Monster, Position, Health, Combat, AI]);
export const chestQuery = defineQuery([Chest, Position]);
export const trapQuery = defineQuery([Trap, Position]);
export const stairsQuery = defineQuery([Stairs, Position]);
export const renderableQuery = defineQuery([Position, Renderable]);
export const aiQuery = defineQuery([AI, Position, Monster]);
export const velocityQuery = defineQuery([Velocity, Position]);

export const serialize = defineSerializer([
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
]);

export const deserialize = defineDeserializer([
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
]);
