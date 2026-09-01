import React, { useRef, useEffect, useState } from 'react';
import { NewsItem, AccentColor } from '../types';
import { getAccent } from '../utils/theme';
import { Language, getTranslation } from '../i18n/translations';

interface TickerBarProps {
  items: NewsItem[];
  onSelectArticle: (item: NewsItem) => void;
  theme: 'dark' | 'light';
  accentColor?: AccentColor;
  language?: Language;
}

export const TickerBar: React.FC<TickerBarProps> = ({ items, onSelectArticle, theme, accentColor, language = 'en' }) => {
  if (!items || items.length === 0) return null;

  const t = getTranslation(language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Take top 12 newest articles, doubled for seamless loop
  const breakingItems = items.slice(0, 12);
  const doubledItems = [...breakingItems, ...breakingItems];

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused || isHovered) return;

    let animId: number;
    let scrollPos = el.scrollLeft;
    const speed = 0.5; // px per frame

    const tick = () => {
      scrollPos += speed;
      // Reset when we've scrolled through the first set
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, isHovered, breakingItems.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className={`w-full overflow-hidden text-xs py-2.5 px-4 rounded-2xl border transition-all shadow-md flex items-center gap-3 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-amber-950/40 via-[#19150d] to-amber-950/40 border-amber-500/40 text-neutral-200'
          : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        
        {/* Left Label Prefix */}
        <div className="flex items-center gap-1.5 shrink-0 text-amber-400 font-extrabold tracking-wider uppercase text-xs">
          <span className="text-amber-400 font-black">{t.ticker.breaking}</span>
        </div>

        {/* Horizontal Scrolling Headlines with auto-scroll */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex-1 overflow-x-auto no-scrollbar stories-scroll-container whitespace-nowrap flex items-center gap-5 py-0.5"
        >
          {doubledItems.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => onSelectArticle(item)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="inline-flex items-center gap-2 group cursor-pointer text-left transition-colors shrink-0"
            >
              <span className={`font-semibold text-xs transition-colors max-w-sm sm:max-w-md truncate ${
                theme === 'dark' ? 'text-neutral-100 group-hover:text-amber-400' : 'text-neutral-900 group-hover:text-amber-700'
              }`}>
                {item.title}
              </span>
              <span className={`text-[11px] font-bold font-mono ${
                theme === 'dark' ? 'text-amber-400/90' : 'text-amber-700'
              }`}>
                [{item.sourceName}]
              </span>
              <span className="text-amber-500/60 font-bold ml-3 text-sm select-none">•</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
