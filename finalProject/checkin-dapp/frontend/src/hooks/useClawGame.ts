import { useCallback, useEffect, useMemo, useState } from "react";
import { type ArcadeService, localStorageArcadeService } from "@/lib/claw/arcade-service";
import { GameState, Prize, RoundResult } from "@/types/claw";

// 扩展奖品池，增加权重与打卡限制
const MOCK_PRIZES: Prize[] = [
  // Commons
  { id: '1', name: 'Little Bear', emoji: '🧸', rarity: 'common', color: 'bg-amber-200' },
  { id: '6', name: 'Gamepad', emoji: '🎮', rarity: 'common', color: 'bg-gray-200' },
  { id: '7', name: 'Duck', emoji: '🦆', rarity: 'common', color: 'bg-yellow-200' },
  
  // Rares
  { id: '2', name: 'Retro Bot', emoji: '🤖', rarity: 'rare', color: 'bg-blue-200' },
  { id: '5', name: 'Rocket', emoji: '🚀', rarity: 'rare', color: 'bg-red-200' },
  
  // Epics (部分需要打卡)
  { id: '3', name: 'Alien', emoji: '👾', rarity: 'epic', color: 'bg-purple-200', requiresCheckIn: true },
  { id: '4', name: 'Unicorn', emoji: '🦄', rarity: 'epic', color: 'bg-pink-200', requiresCheckIn: true },
  { id: '8', name: 'Diamond', emoji: '💎', rarity: 'epic', color: 'bg-cyan-200' }, // 所有人可抓的稀有品
];

export function useClawGame(params?: {
  address: string | null;
  checkedInToday: boolean;
  service?: ArcadeService;
}) {
  const address = params?.address ?? null;
  const checkedInToday = params?.checkedInToday ?? false;
  const service = useMemo(() => params?.service ?? localStorageArcadeService, [params?.service]);

  const [gameState, setGameState] = useState<GameState>('idle');
  const [clawX, setClawX] = useState(50); // 0-100%
  const [inventory, setInventory] = useState<Prize[]>([]);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [credits, setCredits] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  
  // 保底计数：连续失败次数 (Local state, reset on refresh is fine for prototype)
  const [pityCount, setPityCount] = useState(0);

  useEffect(() => {
    const inv = service.getInventory({ address });
    setInventory(inv);
    const h = service.getHistory({ address });
    setHistory(h);
    const quota = service.getQuota({ address, checkedInToday });
    setCredits(quota.remaining);
    setDailyLimit(quota.dailyLimit);
  }, [address, checkedInToday, service]);

  const moveClaw = (direction: 'left' | 'right') => {
    if (gameState !== 'idle') return;
    setClawX(prev => {
      const step = 2; // 2% per step
      const newPos = direction === 'left' ? prev - step : prev + step;
      return Math.max(10, Math.min(90, newPos)); // Clamp 10-90%
    });
  };

  /**
   * 根据当前状态计算本回合抓取结果。
   * 目标：将基础成功率提升到 95%，让演示体验更“爽”。
   */
  const calculateResult = useCallback(() => {
    // 基础成功率 95%（保底机制保留，但不会超过 95%）
    const baseRate = 0.95;
    const pityBonus = pityCount * 0.1;
    const successRate = Math.min(0.95, baseRate + pityBonus);
    const isSuccess = Math.random() < successRate;

    if (!isSuccess) {
      setPityCount(prev => prev + 1);
      return null;
    }

    // 成功抓取，重置保底
    setPityCount(0);

    // 筛选可用奖品池
    const availablePrizes = MOCK_PRIZES.filter(p => {
      if (p.requiresCheckIn && !checkedInToday) return false;
      return true;
    });

    // 加权随机
    // Common: 60, Rare: 30, Epic: 10
    const weightedPool: Prize[] = [];
    availablePrizes.forEach(p => {
      let weight = 1;
      if (p.rarity === 'common') weight = 60;
      if (p.rarity === 'rare') weight = 30;
      if (p.rarity === 'epic') weight = 10;
      
      for(let i=0; i<weight; i++) weightedPool.push(p);
    });

    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
  }, [pityCount, checkedInToday]);

  const startGrab = useCallback(() => {
    if (gameState !== "idle") return;
    if (credits <= 0) return;

    const quota = service.consumeQuota({ address, checkedInToday });
    setCredits(quota.remaining);
    setDailyLimit(quota.dailyLimit);
    
    setGameState('dropping');

    // Simulate Drop -> Grab -> Retract sequence
    // Timings must match CSS/Framer Motion animations
    const DROP_TIME = 1000;
    const GRAB_TIME = 500;
    const RETRACT_TIME = 1000;
    const RESOLVE_TIME = 1500;

    // 1. Drop down
    setTimeout(() => {
      setGameState('grabbing');
      
      // Calculate result immediately but show it later
      const prize = calculateResult();
      if (prize) {
        setCurrentPrize(prize);
      }

      // 2. Grab
      setTimeout(() => {
        setGameState('retracting');
        
        // 3. Retract
        setTimeout(() => {
          setGameState('resolving');
          
          // 4. Show Result
          setTimeout(() => {
            if (prize) {
                const nextInventory = service.addPrize({ address, prize });
                setInventory(nextInventory);
            }
              const nextHistory = service.addHistory({
                address,
                round: {
                  success: !!prize,
                  prize: prize || undefined,
                  timestamp: Date.now(),
                },
                max: 10,
              });
              setHistory(nextHistory);
            
            setCurrentPrize(null);
            setGameState('idle');
          }, RESOLVE_TIME);
          
        }, RETRACT_TIME);
        
      }, GRAB_TIME);
      
    }, DROP_TIME);
  }, [address, checkedInToday, credits, gameState, service, calculateResult]);

  /**
   * 重置当天的已用次数（仅影响本机 localStorage），并同步刷新 credits/dailyLimit。
   */
  const resetQuota = useCallback(() => {
    service.resetQuota({ address });
    const quota = service.getQuota({ address, checkedInToday });
    setCredits(quota.remaining);
    setDailyLimit(quota.dailyLimit);
  }, [address, checkedInToday, service]);

  return {
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
    prizes: MOCK_PRIZES,
  };
}
