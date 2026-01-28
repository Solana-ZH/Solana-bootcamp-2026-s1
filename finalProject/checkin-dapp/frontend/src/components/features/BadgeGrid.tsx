import { Badge } from "@/lib/mock/checkin-service";
import { CartoonCard } from "@/components/ui/CartoonCard";
import { CartoonButton } from "@/components/ui/CartoonButton";
import { Lock } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  badges: Badge[];
  onClaim?: (level: number) => void;
  claimingLevel?: number | null;
}

export function BadgeGrid({ badges, onClaim, claimingLevel }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {badges.map((badge) => (
        <CartoonCard 
          key={badge.id} 
          className={clsx(
            "flex flex-col items-center text-center transition-all p-4",
            !badge.unlocked && "bg-gray-100 opacity-70 grayscale"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-white border-3 border-brand-dark flex items-center justify-center text-3xl mb-3 shadow-cartoon-sm relative overflow-hidden">
            {badge.unlocked ? (
              <span>{badge.imageUrl}</span>
            ) : (
              <Lock className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <h3 className="font-bold text-brand-dark">{badge.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
          {!badge.unlocked ? null : badge.claimed ? (
            <span className="mt-2 text-xs bg-brand-green text-brand-dark px-2 py-0.5 rounded-full border border-brand-dark font-bold">
              已领取
            </span>
          ) : (
            <>
              <span className="mt-2 text-xs bg-yellow-200 text-brand-dark px-2 py-0.5 rounded-full border border-brand-dark font-bold">
                可领取
              </span>
              {onClaim ? (
                <CartoonButton
                  className="mt-3 w-full"
                  onClick={() => onClaim(badge.level)}
                  disabled={claimingLevel === badge.level}
                >
                  {claimingLevel === badge.level ? "领取中..." : "领取徽章"}
                </CartoonButton>
              ) : null}
            </>
          )}
        </CartoonCard>
      ))}
    </div>
  );
}
