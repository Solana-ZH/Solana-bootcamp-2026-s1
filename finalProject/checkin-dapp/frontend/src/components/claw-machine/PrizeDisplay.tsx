import { Prize } from '@/types/claw';
import { motion, AnimatePresence } from 'framer-motion';

interface PrizeDisplayProps {
  inventory: Prize[];
}

export function PrizeDisplay({ inventory }: PrizeDisplayProps) {
  return (
    <div className="bg-white rounded-3xl border-4 border-brand-dark p-6 shadow-cartoon h-full">
      <h3 className="text-2xl font-black text-brand-dark mb-4 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
        <span>🎒</span> 
        My Prizes 
        <span className="text-sm font-bold bg-brand-blue text-brand-dark px-3 py-1 rounded-full ml-auto border-2 border-brand-dark">
          {inventory.length}
        </span>
      </h3>
      
      {inventory.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-gray-400 font-bold border-4 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <span className="text-5xl mb-3 grayscale opacity-50">🧸</span>
          <p>No prizes yet...</p>
          <p className="text-sm font-normal opacity-70 mt-1">Start grabbing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          <AnimatePresence mode='popLayout'>
            {inventory.map((prize, idx) => (
              <motion.div
                key={`${prize.id}-${idx}`}
                layout
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className={`aspect-square rounded-2xl ${prize.color} flex items-center justify-center text-4xl border-3 border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative group cursor-pointer hover:scale-105 transition-transform`}
                title={prize.name}
              >
                {prize.emoji}
                {prize.rarity !== 'common' && (
                    <span className={`absolute -top-2 -right-2 text-[10px] font-black text-white px-2 py-0.5 rounded-full uppercase border-2 border-brand-dark shadow-sm ${prize.rarity === 'epic' ? 'bg-brand-pink' : 'bg-brand-blue'}`}>
                        {prize.rarity}
                    </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
