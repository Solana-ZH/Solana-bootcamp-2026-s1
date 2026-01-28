interface StatsPanelProps {
  credits: number;
  dailyLimit: number;
  gameState: string;
  connected: boolean;
  checkedInToday: boolean;
  checkinLoading: boolean;
}

export function StatsPanel({
  credits,
  dailyLimit,
  gameState,
  connected,
  checkedInToday,
  checkinLoading,
}: StatsPanelProps) {
  const quotaText = dailyLimit > 0 ? `${credits} / ${dailyLimit}` : `${credits}`;
  const checkinLabel = !connected
    ? "未连接"
    : checkinLoading
      ? "加载中"
      : checkedInToday
        ? "已打卡"
        : "未打卡";
  const checkinDotClass = !connected
    ? "bg-white/40"
    : checkinLoading
      ? "bg-white/40"
      : checkedInToday
        ? "bg-brand-green shadow-[0_0_10px_#4ade80]"
        : "bg-brand-pink";

  return (
    <div className="flex justify-between items-center bg-gray-900 text-white p-5 rounded-3xl border-4 border-brand-dark shadow-cartoon mb-6 relative overflow-hidden">
      {/* Glossy Effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 pointer-events-none" />
      
      <div className="flex items-center gap-4 z-10">
        <div className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center text-3xl border-3 border-black text-black font-bold shadow-sm rotate-3">
          🪙
        </div>
        <div>
          <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-0.5">Coins Left</div>
          <div className="text-3xl font-black leading-none text-brand-yellow drop-shadow-md font-mono">
            {quotaText}
          </div>
          <div className="text-[10px] font-black opacity-60 tracking-widest mt-1">按 UTC 日计算</div>
        </div>
      </div>

      <div className="text-right z-10">
        <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">System Status</div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full border border-white/10">
           <span className={`w-2 h-2 rounded-full ${gameState === 'idle' ? 'bg-brand-green shadow-[0_0_10px_#4ade80]' : 'bg-brand-pink'}`} />
           <span className="text-xs font-bold tracking-wider">{gameState.toUpperCase()}</span>
        </div>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full border border-white/10">
          <span className={`w-2 h-2 rounded-full ${checkinDotClass}`} />
          <span className="text-xs font-bold tracking-wider">{checkinLabel}</span>
        </div>
      </div>
    </div>
  );
}
