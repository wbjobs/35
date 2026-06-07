import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameLoop from './game/loop';
import { initInput, cleanupInput, setInputCallback, TurnResult } from './game/input';
import { HUD } from './ui/hud';
import { MessageLog } from './ui/messageLog';
import { Controls } from './ui/controls';
import { initNewGame } from './dungeon/generator';
import { isGameOver } from './game/turnManager';
import { addMessage } from './ecs/world';
import './style.css';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [showNextFloorPrompt, setShowNextFloorPrompt] = useState(false);

  const forceUpdate = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (canvasRef.current && !gameLoopRef.current) {
      gameLoopRef.current = new GameLoop(canvasRef.current);
      gameLoopRef.current.setOnUpdateCallback(() => {
        if (Math.random() < 0.1) {
          forceUpdate();
        }
      });
      gameLoopRef.current.start();
    }

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.destroy();
        gameLoopRef.current = null;
      }
    };
  }, [forceUpdate]);

  useEffect(() => {
    const handleInput = (result: TurnResult) => {
      forceUpdate();

      if (result.reachedStairs) {
        setShowNextFloorPrompt(true);
      }

      if (gameLoopRef.current) {
        gameLoopRef.current.forceRender();
      }
    };

    setInputCallback(handleInput);
    initInput();

    return () => {
      cleanupInput();
    };
  }, [forceUpdate]);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 500);

    return () => clearInterval(interval);
  }, [forceUpdate]);

  const handleNewGame = useCallback(() => {
    setShowNextFloorPrompt(false);
    setGameStarted(true);
    initNewGame();
    forceUpdate();
    if (gameLoopRef.current) {
      gameLoopRef.current.forceRender();
    }
  }, [forceUpdate]);

  const handleGameLoaded = useCallback(() => {
    setShowNextFloorPrompt(false);
    setGameStarted(true);
    forceUpdate();
    if (gameLoopRef.current) {
      gameLoopRef.current.forceRender();
    }
  }, [forceUpdate]);

  const handleConfirmNextFloor = useCallback(() => {
    setShowNextFloorPrompt(false);
    import('./game/turnManager').then(({ goToNextFloor }) => {
      goToNextFloor();
      forceUpdate();
      if (gameLoopRef.current) {
        gameLoopRef.current.forceRender();
      }
    });
  }, [forceUpdate]);

  const handleCancelNextFloor = useCallback(() => {
    setShowNextFloorPrompt(false);
  }, []);

  const gameOver = isGameOver();

  return (
    <div className="game-container">
      <h1 className="game-title">⚔️ 地牢探险 ⚔️</h1>

      <div className="game-content">
        <div className="game-main">
          <div className="game-canvas-wrapper">
            <canvas ref={canvasRef} className="game-canvas" />

            {!gameStarted && !gameOver && (
              <div className="game-over-overlay">
                <div className="game-over-title" style={{ color: '#ffd700' }}>
                  地牢探险
                </div>
                <p className="text-[#a0a0c0] mb-6 text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>
                  点击"新游戏"开始你的冒险！
                </p>
                <button
                  onClick={handleNewGame}
                  className="bg-gradient-to-r from-[#2ed573] to-[#26ab5f] hover:from-[#55efc4] hover:to-[#2ed573] text-white font-bold py-3 px-8 rounded transition-all duration-200 hover:scale-105"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '12px' }}
                >
                  开始游戏
                </button>
              </div>
            )}

            {showNextFloorPrompt && (
              <div className="game-over-overlay">
                <div className="game-over-title" style={{ color: '#2ed573', fontSize: '20px' }}>
                  发现楼梯！
                </div>
                <p className="text-[#a0a0c0] mb-6 text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                  要进入下一层吗？
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleConfirmNextFloor}
                    className="bg-gradient-to-r from-[#2ed573] to-[#26ab5f] hover:from-[#55efc4] hover:to-[#2ed573] text-white font-bold py-2 px-6 rounded transition-all duration-200 hover:scale-105"
                    style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                  >
                    进入
                  </button>
                  <button
                    onClick={handleCancelNextFloor}
                    className="bg-gradient-to-r from-[#636e72] to-[#2d3436] hover:from-[#b2bec3] hover:to-[#636e72] text-white font-bold py-2 px-6 rounded transition-all duration-200 hover:scale-105"
                    style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="game-over-overlay">
                <div className="game-over-title">游戏结束</div>
                <p className="text-[#a0a0c0] mb-6 text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                  你在地牢中倒下了...
                </p>
                <button
                  onClick={handleNewGame}
                  className="bg-gradient-to-r from-[#ff4757] to-[#e17055] hover:from-[#ff6b81] hover:to-[#ff4757] text-white font-bold py-3 px-8 rounded transition-all duration-200 hover:scale-105"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '12px' }}
                >
                  重新开始
                </button>
              </div>
            )}
          </div>

          <div className="game-bottom">
            <div className="message-log-container">
              <MessageLog forceUpdate={updateCounter} />
            </div>
          </div>
        </div>

        <div className="game-sidebar">
          <HUD forceUpdate={updateCounter} />
          <Controls
            onNewGame={handleNewGame}
            onGameLoaded={handleGameLoaded}
            forceUpdate={updateCounter}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
