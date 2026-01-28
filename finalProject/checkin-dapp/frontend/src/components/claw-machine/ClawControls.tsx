import { CartoonButton } from '@/components/ui/CartoonButton';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ClawControlsProps {
  onMove: (dir: 'left' | 'right') => void;
  onGrab: () => void;
  disabled: boolean;
}

export function ClawControls({ onMove, onGrab, disabled }: ClawControlsProps) {
  return (
    <div className="flex items-center justify-center gap-8 mt-6 p-6 bg-white rounded-3xl border-4 border-brand-dark shadow-cartoon max-w-lg mx-auto">
      {/* Directional Pad */}
      <div className="flex gap-4 bg-gray-100 p-2 rounded-2xl border-2 border-gray-300">
        <CartoonButton 
            onClick={() => onMove('left')} 
            disabled={disabled}
            variant="secondary"
            className="w-16 h-16 flex items-center justify-center p-0 rounded-xl"
            aria-label="Move Left"
        >
            <ArrowLeft size={32} strokeWidth={3} />
        </CartoonButton>
        <CartoonButton 
            onClick={() => onMove('right')} 
            disabled={disabled}
            variant="secondary"
            className="w-16 h-16 flex items-center justify-center p-0 rounded-xl"
            aria-label="Move Right"
        >
            <ArrowRight size={32} strokeWidth={3} />
        </CartoonButton>
      </div>

      {/* Action Button */}
      <CartoonButton 
        onClick={onGrab} 
        disabled={disabled}
        variant="danger"
        className="w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 active:translate-x-1 border-4"
      >
        <span className="text-4xl filter drop-shadow-sm">👇</span>
        <span className="text-xs font-black uppercase tracking-wider text-white">DROP</span>
      </CartoonButton>
    </div>
  );
}
