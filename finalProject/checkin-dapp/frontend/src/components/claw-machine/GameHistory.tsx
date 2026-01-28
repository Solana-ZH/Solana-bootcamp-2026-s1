import { RoundResult } from "@/types/claw";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface GameHistoryProps {
  history: RoundResult[];
}

export function GameHistory({ history }: GameHistoryProps) {
  if (!Array.isArray(history) || history.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border-4 border-brand-dark p-6 shadow-cartoon h-full">
      <h3 className="text-xl font-black text-brand-dark mb-4 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
        <span>📜</span> 
        游戏记录
      </h3>
      
      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {history.map((round, index) => (
          <div 
            key={round.timestamp + '-' + index} 
            className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
              round.success 
                ? 'bg-brand-green/10 border-brand-green/30' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {/* Status Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
              round.success
                ? 'bg-brand-green text-white border-brand-dark'
                : 'bg-gray-200 text-gray-500 border-gray-400'
            }`}>
              {round.success ? '🎉' : '💨'}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${round.success ? 'text-brand-dark' : 'text-gray-500'}`}>
                  {round.success ? '抓取成功' : '抓取失败'}
                </span>
                {round.prize && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black uppercase border border-black/10 ${
                    round.prize.rarity === 'epic' ? 'bg-brand-pink text-white' :
                    round.prize.rarity === 'rare' ? 'bg-brand-blue text-white' :
                    'bg-brand-yellow text-brand-dark'
                  }`}>
                    {round.prize.rarity}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">
                {formatDistanceToNow(round.timestamp, { addSuffix: true, locale: zhCN })}
              </div>
            </div>

            {/* Prize Preview */}
            {round.prize && (
              <div className={`w-10 h-10 rounded-lg ${round.prize.color} border-2 border-brand-dark/20 flex items-center justify-center text-xl`}>
                {round.prize.emoji}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
