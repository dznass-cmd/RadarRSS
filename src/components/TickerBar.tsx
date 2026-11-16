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
    <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className={`w-full overflow-hidden text-xs py-2 px-4 rounded-2xl border transition-all shadow-sm flex items-center gap-3 backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-[var(--surface-panel)]/90 border-neutral-800/80 text-neutral-200'
          : 'bg-white/90 border-neutral-200 text-neutral-900 shadow-xs'
      }`}>
        
        {/* Left Label Prefix with radar live indicator */}
        <div className="flex items-center gap-2 shrink-0 pr-3.5 border-r border-neutral-300 dark:border-neutral-800 z-10 select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="font-black tracking-wider uppercase text-[11px] text-red-600 dark:text-red-400">
            {t.ticker.breaking}
          </span>
        </div>

        {/* Horizontal Scrolling Headlines with soft gradient edge mask */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex-1 overflow-x-auto no-scrollbar stories-scroll-container whitespace-nowrap flex items-center gap-5 py-0.5 px-3"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%)',
          }}
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
                theme === 'dark' ? 'text-neutral-100 group-hover:text-accent-400' : 'text-neutral-900 group-hover:text-accent-700'
              }`}>
                {item.title}
              </span>
              <span className={`text-[11px] font-bold font-mono ${
                theme === 'dark' ? 'text-accent-400/90' : 'text-accent-700'
              }`}>
                [{item.sourceName}]
              </span>
              <span className="text-accent-500/60 font-bold ml-3 text-sm select-none">•</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
