import React from 'react';
import { useStore } from '@nanostores/react';
import { activeCategory } from '../../store/spaosStore';
import classNames from 'classnames';

export default function Navigation() {
  const current = useStore(activeCategory);

  const navs = [
    { id: 'hamam', label: 'HAMAM' },
    { id: 'masaj', label: 'MASAJLAR' },
    { id: 'cilt', label: 'CİLT BAKIMI' },
  ];

  return (
    <nav className="relative z-50 flex justify-center gap-12 mt-8">
      {navs.map((nav) => (
        <button
          key={nav.id}
          onClick={() => activeCategory.set(nav.id)}
          className={classNames(
            "relative pb-2 text-[11px] font-medium tracking-[0.25em] transition-colors duration-500 uppercase",
            current === nav.id ? "text-[#f5f5f7]" : "text-[#888891] hover:text-[#f5f5f7]"
          )}
        >
          {nav.label}
          {/* Gold active underline indicator */}
          <span 
            className={classNames(
                "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-[#d4af37] transition-all duration-500",
                current === nav.id ? "w-full" : "w-0"
            )}
          />
        </button>
      ))}
    </nav>
  );
}
