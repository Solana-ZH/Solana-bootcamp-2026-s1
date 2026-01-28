import { CartoonCard } from "@/components/ui/CartoonCard";

interface Props {
  total: number;
  streak: number;
}

export function StatsDisplay({ total, streak }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
      <CartoonCard className="bg-brand-blue flex flex-col items-center justify-center p-4">
        <span className="text-sm font-bold opacity-80">累计打卡</span>
        <span className="text-4xl font-black mt-1">{total}</span>
        <span className="text-xs mt-1">天</span>
      </CartoonCard>
      <CartoonCard className="bg-brand-yellow flex flex-col items-center justify-center p-4">
        <span className="text-sm font-bold opacity-80">连续坚持</span>
        <span className="text-4xl font-black mt-1">{streak}</span>
        <span className="text-xs mt-1">天</span>
      </CartoonCard>
    </div>
  );
}
