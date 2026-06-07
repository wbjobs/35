import { getDistance } from './collision';
import { world, playerEid } from '../world';
import { Position, Health } from '../components';
import { MONSTER_TYPES } from '../../constants/gameConfig';

export type BTNodeStatus = 'success' | 'failure' | 'running';

export interface BTContext {
  eid: number;
  monsterType: keyof typeof MONSTER_TYPES;
}

export type BTNode = (context: BTContext) => BTNodeStatus;

export function Sequence(...children: BTNode[]): BTNode {
  return (context: BTContext): BTNodeStatus => {
    for (const child of children) {
      const status = child(context);
      if (status !== 'success') {
        return status;
      }
    }
    return 'success';
  };
}

export function Selector(...children: BTNode[]): BTNode {
  return (context: BTContext): BTNodeStatus => {
    for (const child of children) {
      const status = child(context);
      if (status !== 'failure') {
        return status;
      }
    }
    return 'failure';
  };
}

export function Inverter(child: BTNode): BTNode {
  return (context: BTContext): BTNodeStatus => {
    const status = child(context);
    if (status === 'success') return 'failure';
    if (status === 'failure') return 'success';
    return status;
  };
}

export function Condition(predicate: (context: BTContext) => boolean): BTNode {
  return (context: BTContext): BTNodeStatus => {
    return predicate(context) ? 'success' : 'failure';
  };
}

export function Random(probability: number): BTNode {
  return (): BTNodeStatus => {
    return Math.random() < probability ? 'success' : 'failure';
  };
}

export function Action(action: (context: BTContext) => BTNodeStatus): BTNode {
  return (context: BTContext): BTNodeStatus => {
    return action(context);
  };
}

export function IsAdjacentToPlayer(): BTNode {
  return Condition((context) => {
    const { eid } = context;
    const mx = Position.x[eid];
    const my = Position.y[eid];
    const px = Position.x[playerEid];
    const py = Position.y[playerEid];
    const dist = getDistance(mx, my, px, py);
    return dist === 1;
  });
}

export function IsPlayerWithinRange(range: number): BTNode {
  return Condition((context) => {
    const { eid } = context;
    const mx = Position.x[eid];
    const my = Position.y[eid];
    const px = Position.x[playerEid];
    const py = Position.y[playerEid];
    const dist = getDistance(mx, my, px, py);
    return dist <= range;
  });
}

export function IsLowHealth(): BTNode {
  return Condition((context) => {
    const { eid, monsterType } = context;
    const current = Health.current[eid];
    const config = MONSTER_TYPES[monsterType];
    const threshold = (config as any).lowHealthThreshold || Math.floor(Health.max[eid] * 0.3);
    return current <= threshold;
  });
}

export function HasFleeChance(): BTNode {
  return Condition((context) => {
    const { monsterType } = context;
    const config = MONSTER_TYPES[monsterType];
    return (config as any).fleeChance > 0;
  });
}

export function CanPhaseThroughWalls(): BTNode {
  return Condition((context) => {
    const { monsterType } = context;
    const config = MONSTER_TYPES[monsterType];
    return (config as any).canPhaseThroughWalls === true;
  });
}

export function IsRanged(): BTNode {
  return Condition((context) => {
    const { monsterType } = context;
    const config = MONSTER_TYPES[monsterType];
    return (config as any).isRanged === true;
  });
}

export function RandomChance(probability: number): BTNode {
  return Random(probability);
}

export function AlwaysSucceed(): BTNode {
  return () => 'success';
}

export function AlwaysFail(): BTNode {
  return () => 'failure';
}
