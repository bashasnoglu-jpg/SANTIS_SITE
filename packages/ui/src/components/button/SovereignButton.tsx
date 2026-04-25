import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

// SADECE BOYUT VE GÖRSEL DURUM (Figma Variants)
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-sm font-medium transition-all duration-500 disabled:opacity-50 disabled:pointer-events-none tracking-widest uppercase",
  {
    variants: {
      variant: {
        primary: "bg-[#c6a96b] text-[#141416] hover:bg-[#b5995f] border border-transparent", // Mat Pirinç
        ghost: "bg-transparent text-[#c6a96b] border border-[#c6a96b] hover:bg-[#c6a96b]/10", // İsli Griye uygun
      },
      size: {
        sm: "h-8 px-4 text-[10px]",
        md: "h-11 px-8 text-[12px]",
        lg: "h-14 px-10 text-[14px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// FİGMA COMPONENT PROPERTIES (İçerik Esnekliği)
export interface SovereignButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  label: string;              // Figma Text Property
  hasIcon?: boolean;          // Figma Boolean Property
  iconNode?: React.ReactNode; // Figma Instance Swap
}

export const SovereignButton = React.forwardRef<HTMLButtonElement, SovereignButtonProps>(
  ({ className, variant, size, label, hasIcon = false, iconNode, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {hasIcon && iconNode && <span className="mr-3">{iconNode}</span>}
        {label}
      </button>
    );
  }
);

SovereignButton.displayName = "SovereignButton";
