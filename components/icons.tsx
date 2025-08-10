import * as React from 'react';

interface StormIconProps {
  category: number;
  type: 'Hurricane' | 'Tropical Storm' | 'Invest';
  className?: string;
}

const getCategoryColor = (category: number, type: 'Hurricane' | 'Tropical Storm' | 'Invest') => {
  if (type === 'Invest') return 'text-blue-400';
  if (type === 'Tropical Storm') return 'text-green-400';
  switch (category) {
    case 1: return 'text-yellow-300';
    case 2: return 'text-yellow-400';
    case 3: return 'text-orange-400';
    case 4: return 'text-red-500';
    case 5: return 'text-red-700';
    default: return 'text-green-400';
  }
};

export const StormCategoryIcon: React.FC<StormIconProps> = ({ category, type, className = '' }) => {
  const colorClass = getCategoryColor(category, type);
  const text = type === 'Invest' ? 'L' : type === 'Tropical Storm' ? 'S' : category > 0 ? `${category}` : 'S';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className={`w-full h-full animate-spin-slow ${colorClass}`}>
        <path d="M50,1 A49,49 0 0,1 50,99 A49,49 0 0,1 50,1 M50,12 A38,38 0 0,1 50,88 A38,38 0 0,1 50,12" fill="none" stroke="currentColor" strokeWidth="6" />
        <path d="M50,12 C65,20 80,35 88,50 C80,65 65,80 50,88 C35,80 20,65 12,50 C20,35 35,20 50,12" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5 5"/>
      </svg>
      <span className={`absolute font-bold text-slate-100 text-sm md:text-base`}>
        {text}
      </span>
    </div>
  );
};