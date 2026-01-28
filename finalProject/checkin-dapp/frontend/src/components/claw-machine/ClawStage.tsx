import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Prize } from '@/types/claw';

interface ClawStageProps {
  clawX: number;
  gameState: GameState;
  currentPrize: Prize | null;
  prizes: Prize[];
}

const EASE_OUT = [0, 0, 0.58, 1] as const;
const EASE_IN_OUT = [0.42, 0, 0.58, 1] as const;

// Simple confetti effect component
function Confetti() {
  const particles = Array.from({ length: 30 });
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex justify-center items-center overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-3 h-3 rounded-sm ${
            ['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400'][i % 5]
          }`}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400 - 50, // Bias upwards slightly
            scale: [0, 1.5, 0],
            rotate: Math.random() * 720,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.5, ease: EASE_OUT }}
        />
      ))}
    </div>
  );
}

export function ClawStage({ clawX, gameState, currentPrize, prizes }: ClawStageProps) {
  const clawVariants = {
    idle: { y: 20 },
    moving: { y: 20 },
    dropping: { 
      y: 290, 
      transition: { duration: 1, ease: EASE_IN_OUT } 
    },
    grabbing: { 
      y: 290, 
      scale: [1, 0.98, 1],
      transition: { duration: 0.2, repeat: 2 } 
    },
    retracting: { 
      y: 20, 
      transition: { duration: 1, ease: EASE_IN_OUT } 
    },
    resolving: { y: 20 },
  };

  const leftClawVariants = {
    idle: { rotate: 0 },
    moving: { rotate: 0 },
    dropping: { rotate: 35 },
    grabbing: { rotate: -15 },
    retracting: { rotate: -15 },
    resolving: { rotate: 0 },
  };

  const rightClawVariants = {
    idle: { rotate: 0 },
    moving: { rotate: 0 },
    dropping: { rotate: -35 },
    grabbing: { rotate: 15 },
    retracting: { rotate: 15 },
    resolving: { rotate: 0 },
  };

  const clawOrigin = { originX: 0.5, originY: 0.32 };

  return (
    <div className="relative w-full h-[400px] bg-sky-100 rounded-3xl border-4 border-brand-dark overflow-hidden shadow-cartoon">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10" />
      <div className="absolute bottom-0 w-full h-24 bg-blue-200/50 rounded-b-xl" />
      
      {/* Target Guide */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/20 dashed" style={{ left: `${clawX}%` }} />

      {/* Confetti Effect on Success */}
      <AnimatePresence>
        {gameState === 'resolving' && currentPrize && <Confetti />}
      </AnimatePresence>

      {/* The Claw Mechanism */}
      <motion.div 
        className="absolute top-0 w-32 h-32 z-20 pointer-events-none -ml-16"
        style={{ left: `${clawX}%` }}
        animate={gameState}
        variants={clawVariants}
      >
        {/* The String */}
        <div className="absolute bottom-[calc(100%-40px)] left-1/2 w-1.5 h-[1000px] bg-gray-800 -translate-x-1/2" />
        
        {/* The Claw Body */}
        <div className="w-full h-full relative flex justify-center">
            {/* Center Hub */}
            <div className="absolute top-4 w-12 h-10 bg-gray-800 rounded-xl z-20 shadow-sm border-2 border-gray-600" />
            
            <svg width="140" height="140" viewBox="0 0 140 140" className="overflow-visible mt-2">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              {/* Left Claw */}
              <motion.g 
                initial={{ rotate: 0 }}
                variants={leftClawVariants}
                transition={{ duration: 0.3 }}
                style={clawOrigin}
              >
                <path 
                  d="M65 45 Q 35 45 35 85 Q 35 110 55 115" 
                  fill="none" 
                  stroke="#374151" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                <circle cx="55" cy="115" r="5" fill="#374151" />
              </motion.g>

              {/* Right Claw */}
              <motion.g 
                initial={{ rotate: 0 }}
                variants={rightClawVariants}
                transition={{ duration: 0.3 }}
                style={clawOrigin}
              >
                <path 
                  d="M75 45 Q 105 45 105 85 Q 105 110 85 115" 
                  fill="none" 
                  stroke="#374151" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                <circle cx="85" cy="115" r="5" fill="#374151" />
              </motion.g>
              
              {/* Hinge Pin */}
              <circle cx="70" cy="45" r="4" fill="#9CA3AF" />
            </svg>
            
            {/* Attached Prize */}
            {(gameState === 'retracting' || gameState === 'resolving') && currentPrize && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 text-5xl z-0 drop-shadow-md"
                >
                    {currentPrize.emoji}
                </motion.div>
            )}
        </div>
      </motion.div>

      {/* Prize Pool (Visual Floor) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-8 flex-wrap">
        {prizes.slice(0, 5).map((p, i) => (
           <motion.div 
            key={i} 
            className={`w-12 h-12 rounded-full ${p.color} flex items-center justify-center text-2xl shadow-md border-2 border-brand-dark/20 opacity-80`}
            title={p.name}
           >
              {p.emoji}
           </motion.div>
        ))}
        {prizes.length > 5 && (
            <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold border-2 border-brand-dark/20">
                +{prizes.length - 5}
            </div>
        )}
      </div>
    </div>
  );
}
