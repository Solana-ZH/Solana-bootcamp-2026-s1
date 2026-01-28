"use client";
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface Props {
  onCheckIn: () => Promise<void>;
  canCheckIn: boolean;
  isCheckingIn?: boolean;
}

export function CheckInButton({ onCheckIn, canCheckIn, isCheckingIn }: Props) {
  return (
    <motion.button
      whileHover={canCheckIn ? { scale: 1.05 } : {}}
      whileTap={canCheckIn ? { scale: 0.95 } : {}}
      onClick={onCheckIn}
      disabled={!canCheckIn || isCheckingIn}
      className={twMerge(
        "w-48 h-48 rounded-full border-3 border-brand-dark shadow-cartoon-lg flex flex-col items-center justify-center gap-2 font-bold text-xl transition-all",
        canCheckIn 
          ? "bg-brand-pink text-brand-dark cursor-pointer hover:shadow-cartoon-hover hover:translate-x-[2px] hover:translate-y-[2px]" 
          : "bg-brand-gray text-gray-500 cursor-not-allowed shadow-none translate-y-[4px] translate-x-[4px]"
      )}
    >
      {isCheckingIn ? (
        <>
          <Loader2 className="w-10 h-10 animate-spin" />
          <span>打卡中...</span>
        </>
      ) : canCheckIn ? (
        <>
          <span className="text-4xl">✨</span>
          <span>立即打卡</span>
        </>
      ) : (
        <>
          <Check className="w-12 h-12" />
          <span>今日已完成</span>
        </>
      )}
    </motion.button>
  );
}
