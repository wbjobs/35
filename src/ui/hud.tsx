import React from 'react';
import { Heart, Swords, Shield, MapPin, Clock, Skull } from 'lucide-react';
import { getPlayerHealth, getPlayerCombat } from '../ecs/systems/combat';
import { getTurn, getFloor, getGamePhase, isGameOver } from '../game/turnManager';
import { COLORS } from '../constants/gameConfig';

interface HUDProps {
  forceUpdate?: number;
}

export const HUD: React.FC<HUDProps> = ({ forceUpdate }) => {
  const health = getPlayerHealth();
  const combat = getPlayerCombat();
  const turn = getTurn();
  const floor = getFloor();
  const gamePhase = getGamePhase();
  const gameOver = isGameOver();

  const healthPercentage = health.max > 0 ? (health.current / health.max) * 100 : 0;

  let healthColor = '#2ed573';
  if (healthPercentage < 30) {
    healthColor = '#ff4757';
  } else if (healthPercentage < 60) {
    healthColor = '#ffa502';
  }

  const phaseText = gamePhase === 'player' ? '你的回合' : gamePhase === 'monster' ? '怪物回合' : '游戏结束';

  return (
    <div className="bg-[rgba(45,27,78,0.95)] border-2 border-[#ffd700] rounded-lg p-4 shadow-xl">
      <h2 className="text-[#ffd700] text-lg font-bold mb-4 text-center" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '14px' }}>
        状态面板
      </h2>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5 text-[#ff4757]" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#a0a0c0]">生命值</span>
              <span className="text-white">{health.current} / {health.max}</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{ width: `${healthPercentage}%`, backgroundColor: healthColor }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] p-2 rounded">
            <Swords className="w-4 h-4 text-[#ff6b6b]" />
            <div>
              <div className="text-[10px] text-[#a0a0c0]">攻击力</div>
              <div className="text-white text-sm font-bold">{combat.attack}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] p-2 rounded">
            <Shield className="w-4 h-4 text-[#4ecdc4]" />
            <div>
              <div className="text-[10px] text-[#a0a0c0]">防御力</div>
              <div className="text-white text-sm font-bold">{combat.defense}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] p-2 rounded">
            <MapPin className="w-4 h-4 text-[#95e1d3]" />
            <div>
              <div className="text-[10px] text-[#a0a0c0]">楼层</div>
              <div className="text-white text-sm font-bold">{floor}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] p-2 rounded">
            <Clock className="w-4 h-4 text-[#f38181]" />
            <div>
              <div className="text-[10px] text-[#a0a0c0]">回合</div>
              <div className="text-white text-sm font-bold">{turn}</div>
            </div>
          </div>
        </div>

        <div className={`text-center py-2 px-3 rounded ${gameOver ? 'bg-[rgba(255,71,87,0.3)]' : 'bg-[rgba(0,0,0,0.3)]'}`}>
          <div className="flex items-center justify-center gap-2">
            {gameOver && <Skull className="w-4 h-4 text-[#ff4757]" />}
            <span className={`text-sm font-bold ${gameOver ? 'text-[#ff4757]' : 'text-[#ffd700]'}`}>
              {phaseText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
