import { CartoonCard } from "@/components/ui/CartoonCard";
import { Check } from 'lucide-react';

interface Props {
  history: { date: string; checked: boolean }[];
}

export function CheckInHistory({ history }: Props) {
  return (
    <CartoonCard className="w-full">
      <h3 className="font-bold text-lg mb-4 text-center">最近记录</h3>
      <div className="flex justify-between items-center overflow-x-auto pb-2">
        {history.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2 min-w-[3rem]">
            <div className={`w-8 h-8 rounded-full border-2 border-brand-dark flex items-center justify-center ${
              item.checked ? 'bg-brand-green' : 'bg-gray-200'
            }`}>
              {item.checked && <Check className="w-4 h-4 text-brand-dark" />}
            </div>
            <span className="text-xs font-bold text-gray-500">{item.date}</span>
          </div>
        ))}
      </div>
    </CartoonCard>
  );
}
