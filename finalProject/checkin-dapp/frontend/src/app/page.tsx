import Link from "next/link";
import { CartoonButton } from "@/components/ui/CartoonButton";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots pointer-events-none" />
      <div className="z-10 flex flex-col items-center gap-8 max-w-2xl text-center">
        <div className="text-6xl animate-bounce">🧸</div>
        <h1 className="text-4xl md:text-6xl font-black text-brand-dark tracking-tight">
          Solana 幸运抓娃娃
          <span className="text-brand-pink block md:inline md:ml-4">赢取珍稀 NFT</span>
        </h1>
        <p className="text-xl text-gray-600 font-medium">
          每日打卡领取游戏币，挑战抓娃娃机。连续打卡时间越长，稀有 NFT 掉落率越高！
          <br/>
          <span className="text-sm opacity-80 mt-2 block">（打卡 -> 领币 -> 抓娃娃 -> 赢 NFT）</span>
        </p>
        
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/claw">
            <CartoonButton className="text-xl px-8 py-4">
               立即抓娃娃 🧸
            </CartoonButton>
          </Link>
          <Link href="/checkin">
            <CartoonButton variant="secondary" className="text-xl px-8 py-4">打卡领次数 📅</CartoonButton>
          </Link>
        </div>

        <div className="mt-12 flex items-center gap-8 opacity-70">
           <div className="flex flex-col items-center gap-2">
             <span className="text-4xl">📅</span>
             <span className="text-xs font-bold">每日打卡</span>
           </div>
           <div className="text-2xl text-brand-pink">➜</div>
           <div className="flex flex-col items-center gap-2">
             <span className="text-4xl">🎟️</span>
             <span className="text-xs font-bold">获得次数</span>
           </div>
           <div className="text-2xl text-brand-pink">➜</div>
           <div className="flex flex-col items-center gap-2">
             <span className="text-4xl">🎁</span>
             <span className="text-xs font-bold">赢取奖励</span>
           </div>
        </div>
      </div>
    </main>
  );
}
