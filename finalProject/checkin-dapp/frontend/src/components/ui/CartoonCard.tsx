import { twMerge } from 'tailwind-merge';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CartoonCard({ children, className, ...props }: Props) {
  return (
    <div 
      className={twMerge(
        "bg-white rounded-2xl border-3 border-brand-dark shadow-cartoon p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
