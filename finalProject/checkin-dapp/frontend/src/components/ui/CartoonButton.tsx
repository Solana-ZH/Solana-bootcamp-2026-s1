"use client";
import { motion, HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface Props extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  children: React.ReactNode;
}

export function CartoonButton({ children, className, variant = 'primary', ...props }: Props) {
  const variants = {
    primary: "bg-brand-blue text-brand-dark",
    secondary: "bg-brand-yellow text-brand-dark",
    danger: "bg-brand-pink text-brand-dark",
    success: "bg-brand-green text-brand-dark",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={twMerge(
        "px-6 py-3 rounded-xl border-3 border-brand-dark shadow-cartoon font-bold text-lg transition-colors",
        variants[variant],
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-[4px] disabled:translate-x-[4px]",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
