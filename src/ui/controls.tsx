import React, { useState, useEffect } from 'react';
import { Play, Save, FolderOpen, ArrowRightCircle, RotateCcw, Trash2 } from 'lucide-react';
import { saveGame, loadGame, getSaveList, deleteSave } from '../save/indexeddb';
import { handleNextFloor } from '../game/input';
import { initNewGame } from '../dungeon/generator';
import { isGameOver } from '../game/turnManager';
import { world } from '../ecs/world';

interface ControlsProps {
  onNewGame: () => void;
  onGameLoaded: () => void;
  forceUpdate?: number;
}

interface SaveInfo {
  id: number;
  timestamp: number;
  floor: number;
  turn: number;
}

export const Controls: React.FC<ControlsProps> = ({ onNewGame, onGameLoaded, forceUpdate }) => {
  const [saves, setSaves] = useState<SaveInfo[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSaves();
  }, [forceUpdate]);

  const loadSaves = async () => {
    const saveList = await getSaveList();
    setSaves(saveList);
  };

  const handleNewGame = () => {
    initNewGame();
    onNewGame();
    setShowLoadMenu(false);
  };

  const handleSave = async () => {
    if (isGameOver()) {
      showMessage('游戏已结束，无法保存');
      return;
    }
    const id = await saveGame();
    if (id) {
      showMessage(`游戏已保存 (存档 #${id})`);
      loadSaves();
    } else {
      showMessage('保存失败');
    }
  };

  const handleLoad = async (saveId: number) => {
    const success = await loadGame(saveId);
    if (success) {
      showMessage('存档加载成功');
      setShowLoadMenu(false);
      onGameLoaded();
    } else {
      showMessage('加载失败');
    }
  };

  const handleDelete = async (saveId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteSave(saveId);
    if (success) {
      showMessage('存档已删除');
      loadSaves();
    }
  };

  const handleNext = () => {
    handleNextFloor();
    onNewGame();
  };

  const showMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-[rgba(45,27,78,0.95)] border-2 border-[#ffd700] rounded-lg p-4 shadow-xl">
      <h2 className="text-[#ffd700] text-lg font-bold mb-4 text-center" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '14px' }}>
        操作面板
      </h2>

      {saveMessage && (
        <div className="mb-3 p-2 bg-[rgba(255,215,0,0.2)] border border-[#ffd700] rounded text-center text-[#ffd700] text-sm">
          {saveMessage}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleNewGame}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2ed573] to-[#26ab5f] hover:from-[#55efc4] hover:to-[#2ed573] text-white font-bold py-3 px-4 rounded transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '11px' }}
        >
          <Play className="w-4 h-4" />
          新游戏
        </button>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ffd700] to-[#e6c200] hover:from-[#ffe066] hover:to-[#ffd700] text-[#2d1b4e] font-bold py-3 px-4 rounded transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '11px' }}
        >
          <Save className="w-4 h-4" />
          保存游戏
        </button>

        <button
          onClick={() => setShowLoadMenu(!showLoadMenu)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#74b9ff] to-[#0984e3] hover:from-[#a29bfe] hover:to-[#74b9ff] text-white font-bold py-3 px-4 rounded transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '11px' }}
        >
          <FolderOpen className="w-4 h-4" />
          {showLoadMenu ? '关闭存档' : '读取存档'}
        </button>

        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#a29bfe] to-[#6c5ce7] hover:from-[#dfe6e9] hover:to-[#a29bfe] text-white font-bold py-3 px-4 rounded transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '11px' }}
        >
          <ArrowRightCircle className="w-4 h-4" />
          下一层
        </button>
      </div>

      {showLoadMenu && (
        <div className="mt-4 border-t border-[#ffd700] pt-4">
          <h3 className="text-[#ffd700] text-sm mb-3" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}>
            选择存档
          </h3>
          {saves.length === 0 ? (
            <p className="text-[#a0a0c0] text-sm text-center py-4">暂无存档</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {saves.map((save) => (
                <div
                  key={save.id}
                  onClick={() => handleLoad(save.id)}
                  className="flex items-center justify-between p-3 bg-[rgba(0,0,0,0.3)] rounded cursor-pointer hover:bg-[rgba(255,215,0,0.2)] transition-all duration-200 group"
                >
                  <div className="flex-1">
                    <div className="text-white text-sm font-bold">存档 #{save.id}</div>
                    <div className="text-[#a0a0c0] text-xs">
                      第 {save.floor} 层 · 第 {save.turn} 回合
                    </div>
                    <div className="text-[#666] text-xs">{formatDate(save.timestamp)}</div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(save.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[rgba(255,71,87,0.3)] rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-[#ff4757]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#ffd700]">
        <h3 className="text-[#ffd700] text-xs mb-2" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}>
          操作说明
        </h3>
        <div className="text-[#a0a0c0] text-xs space-y-1" style={{ fontFamily: "'VT323', monospace", fontSize: '14px' }}>
          <p>↑ W - 向上移动</p>
          <p>↓ S - 向下移动</p>
          <p>← A - 向左移动</p>
          <p>→ D - 向右移动</p>
          <p className="text-[#ffd700]">走向怪物发起攻击</p>
          <p className="text-[#ffd700]">走向宝箱打开它</p>
          <p className="text-[#ffd700]">🚪 楼梯通往下一层</p>
        </div>
      </div>
    </div>
  );
};

export default Controls;
