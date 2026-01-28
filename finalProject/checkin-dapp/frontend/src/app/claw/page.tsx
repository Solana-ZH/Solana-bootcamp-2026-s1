'use client';

import { useClawGame } from '@/hooks/useClawGame';
import { ClawStage } from '@/components/claw-machine/ClawStage';
import { ClawControls } from '@/components/claw-machine/ClawControls';
import { StatsPanel } from '@/components/claw-machine/StatsPanel';
import { PrizeDisplay } from '@/components/claw-machine/PrizeDisplay';
import { GameHistory } from '@/components/claw-machine/GameHistory';
import { CartoonButton } from '@/components/ui/CartoonButton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import { mockCheckInService, type CheckInService } from "@/lib/mock/checkin-service";
import { createAnchorCheckInService } from "@/lib/solana/anchor-checkin-service";
import { getSolanaFrontendConfig } from "@/lib/solana/env";
import { WalletMultiButtonClient } from "@/components/solana/WalletMultiButtonClient";

export default function ClawMachinePage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const address = publicKey?.toBase58() ?? null;
  const solanaConfig = useMemo(() => getSolanaFrontendConfig(), []);
  const isDev = process.env.NODE_ENV !== "production";

  const checkInService: CheckInService = useMemo(() => {
    if (anchorWallet && solanaConfig.programId) {
      return createAnchorCheckInService({
        connection,
        wallet: anchorWallet,
        programId: solanaConfig.programId,
      });
    }
    return mockCheckInService;
  }, [anchorWallet, connection, solanaConfig.programId]);

  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setCheckedInToday(false);
      setCheckinLoading(false);
      return;
    }

    setCheckinLoading(true);
    checkInService
      .getStats(address)
      .then((stats) => setCheckedInToday(!stats.canCheckIn))
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error ?? "加载打卡状态失败");
        console.error(error);
        alert(message);
        setCheckedInToday(false);
      })
      .finally(() => setCheckinLoading(false));
  }, [address, checkInService]);

  const { 
    gameState, 
    clawX, 
    moveClaw, 
    startGrab, 
    resetQuota,
    inventory, 
    history,
    credits, 
    dailyLimit,
    currentPrize, 
    prizes,
  } = useClawGame({ address, checkedInToday });

  return (
    <main className="min-h-screen bg-cream p-4 md:p-8 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
            <Link href="/">
                <CartoonButton variant="secondary" className="flex items-center gap-2 px-4 py-2 text-sm border-2">
                    <ArrowLeft size={18} /> Back
                </CartoonButton>
            </Link>
            <h1 className="text-3xl md:text-5xl font-black text-brand-dark tracking-tighter transform -rotate-2 drop-shadow-sm">
                🕹️ CLAW ARCADE
            </h1>
            <WalletMultiButtonClient className="!bg-white !text-brand-dark !border-3 !border-brand-dark !rounded-xl !shadow-cartoon-sm !font-bold !text-sm" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Game Machine */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                <StatsPanel
                  credits={credits}
                  dailyLimit={dailyLimit}
                  gameState={gameState}
                  connected={!!address}
                  checkedInToday={checkedInToday}
                  checkinLoading={checkinLoading}
                />
                
                <div className="relative group">
                    <ClawStage 
                        clawX={clawX} 
                        gameState={gameState} 
                        currentPrize={currentPrize}
                        prizes={prizes}
                    />
                    
                    {/* Glass Reflection Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none rounded-3xl border-4 border-transparent z-10" />
                </div>

                <ClawControls 
                    onMove={moveClaw} 
                    onGrab={startGrab} 
                    disabled={gameState !== 'idle' || credits === 0}
                />
                
                {credits === 0 && (
                     <div className="text-center mt-4">
                        <p className="text-brand-pink font-bold mb-2 text-lg animate-bounce">Out of credits!</p>
                        {!address ? (
                          <p className="text-brand-dark font-bold text-sm opacity-80">
                            连接钱包后可获得每日试玩次数。
                          </p>
                        ) : checkedInToday ? (
                          <p className="text-brand-dark font-bold text-sm opacity-80">
                            今日次数已用完（按 UTC 计算），明天再来～
                          </p>
                        ) : (
                          <Link href="/checkin" className="inline-block">
                            <CartoonButton variant="success" className="text-sm py-2 px-6">
                              去打卡解锁更多次数
                            </CartoonButton>
                          </Link>
                        )}

                        {isDev && (
                          <div className="mt-3">
                            <CartoonButton
                              variant="secondary"
                              className="text-xs py-2 px-4"
                              onClick={resetQuota}
                            >
                              开发调试：清空本地次数
                            </CartoonButton>
                          </div>
                        )}
                     </div>
                )}
            </div>

            {/* Right: Inventory & Info */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 h-full">
                <div className="bg-brand-yellow p-6 rounded-3xl border-4 border-brand-dark shadow-cartoon">
                    <h2 className="text-xl font-black mb-2 uppercase flex items-center gap-2">
                        <span>📖</span> How to Play
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 font-bold opacity-80 text-sm">
                        <li>Use arrows to move the claw left/right.</li>
                        <li>Press the big <strong>DROP</strong> button to grab.</li>
                        <li>Luck determines if you catch a prize!</li>
                        <li>Collect them all in your inventory.</li>
                    </ul>
                </div>
                
                <PrizeDisplay inventory={inventory} />
                <GameHistory history={history} />
            </div>
        </div>
      </div>
    </main>
  );
}
