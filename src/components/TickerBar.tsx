import React from 'react';
import { Flame, Clock, ChevronRight } from 'lucide-react';
import { NewsItem, AccentColor } from '../types';
import { getAccent } from '../utils/theme';

interface TickerBarProps {
  items: NewsItem[];
  onSelectArticle: (item: NewsItem) => void;
  theme: 'dark' | 'light';
  accentColor?: AccentColor;
}

export const TickerBar: React.FC<TickerBarProps> = ({ items, onSelectArticle, theme, accentColor }) => {
  if (!items || items.length === 0) return null;

  const acc = getAccent(accentColor);
  // Take top 10 newest articles
  const breakingItems = items.slice(0, 10);

  return (
    <div className={`w-full border-b overflow-hidden text-xs py-2.5 px-4 transition-colors ${
      theme === 'dark'
        ? 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
        : 'bg-neutral-100 border-neutral-300 text-neutral-800'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        
        {/* Label Badge */}
        <div className={`flex items-center gap-1.5 font-black text-black uppercase tracking-widest shrink-0 ${acc.bg} px-2.5 py-1 rounded-md text-[10px]`}>
          <Flame className="w-3.5 h-3.5 text-black animate-pulse" />
          <span>BREAKING LIVE</span>
        </div>

        {/* Horizontal Ticker Items Container */}
        <div className="flex-1 overflow-x-auto no-scrollbar whitespace-nowrap flex items-center gap-6 py-0.5">
          {breakingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectArticle(item)}
              className={`inline-flex items-center gap-2 group cursor-pointer text-left transition-colors ${acc.textHover} shrink-0`}
            >
              <span className={`font-bold uppercase tracking-wide ${acc.text} text-[10px]`}>
                [{item.sourceName}]
              </span>
              <span className={`font-semibold text-xs max-w-xs sm:max-w-md truncate group-${acc.textHover}`}>
                {item.title}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-500" />
                {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <ChevronRight className={`w-3 h-3 text-neutral-500 group-hover:translate-x-0.5 group-${acc.textHover} transition-all`} />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
