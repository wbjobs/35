import React, { useEffect, useRef } from 'react';
import { world } from '../ecs/world';
import { MessageSquare } from 'lucide-react';

interface MessageLogProps {
  forceUpdate?: number;
}

export const MessageLog: React.FC<MessageLogProps> = ({ forceUpdate }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [world.messages, forceUpdate]);

  const messages = world.messages || [];
  const recentMessages = messages.slice(-15);

  const getMessageColor = (message: string): string => {
    if (message.includes('伤害') || message.includes('击败') || message.includes('陷阱')) {
      return '#ff4757';
    }
    if (message.includes('恢复') || message.includes('宝箱')) {
      return '#2ed573';
    }
    if (message.includes('进入') || message.includes('来到')) {
      return '#ffd700';
    }
    if (message.includes('回合') || message.includes('移动')) {
      return '#a0a0c0';
    }
    return '#ffffff';
  };

  return (
    <div className="bg-[rgba(45,27,78,0.95)] border-2 border-[#ffd700] rounded-lg p-4 shadow-xl h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-[#ffd700]" />
        <h2 className="text-[#ffd700] text-lg font-bold" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '12px' }}>
          消息日志
        </h2>
      </div>

      <div
        ref={logRef}
        className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-[#ffd700] scrollbar-track-[rgba(0,0,0,0.3)]"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#ffd700 rgba(0,0,0,0.3)',
        }}
      >
        {recentMessages.length === 0 ? (
          <p className="text-[#a0a0c0] text-sm italic">等待游戏开始...</p>
        ) : (
          recentMessages.map((message, index) => (
            <p
              key={`${index}-${message}`}
              className="text-sm py-1 px-2 rounded transition-all duration-200 hover:bg-[rgba(255,215,0,0.1)]"
              style={{ color: getMessageColor(message), fontFamily: "'VT323', monospace", fontSize: '16px' }}
            >
              <span className="text-[#666] mr-2">›</span>
              {message}
            </p>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageLog;
