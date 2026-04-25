import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

// 1. Figma Variants (Sadece State)
const cardVariants = cva(
  "relative flex flex-col justify-between p-6 rounded-md cursor-pointer transition-all duration-500 overflow-hidden group text-left",
  {
    variants: {
      state: {
        default: "bg-[#141416] border border-[#333333] hover:border-[#c6a96b]/50", 
        selected: "bg-[#1a1a1c] border border-[#c6a96b] shadow-[0_0_15px_rgba(198,169,107,0.15)]", 
      }
    },
    defaultVariants: {
      state: "default",
    }
  }
);

// 2. Figma Component Properties (İçerik Esnekliği)
export interface SovereignCardProps extends React.HTMLAttributes<HTMLButtonElement>, VariantProps<typeof cardVariants> {
  title: string;
  price: number | string;
  category: string;
  durationMin: number | string;
}

export const SovereignCard = React.forwardRef<HTMLButtonElement, SovereignCardProps>(
  ({ className, state, title, price, category, durationMin, onClick, ...props }, ref) => {
    return (
      <button 
        ref={ref} 
        onClick={onClick} 
        className={twMerge(cardVariants({ state, className }))} 
        {...props}
      >
        {/* Üst Bilgi: Kategori ve Süre */}
        <div className="flex justify-between items-start mb-8 w-full">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8e8e93] font-medium">
            {category}
          </span>
          <span className="text-[10px] text-[#c6a96b] font-mono tracking-widest">
            {durationMin} MIN
          </span>
        </div>
        
        {/* Alt Bilgi: Başlık ve Fiyat */}
        <div className="w-full">
          <h3 className="text-lg font-light text-[#e5e5ea] mb-2 font-serif tracking-wide block w-full text-left">
            {title}
          </h3>
          <p className="text-[#c6a96b] font-mono text-sm tracking-wider w-full text-left">
            ${Number(price).toLocaleString('en-US')}
          </p>
        </div>
      </button>
    );
  }
);

SovereignCard.displayName = "SovereignCard";
