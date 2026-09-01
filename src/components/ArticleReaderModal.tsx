import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Share2,
  Check,
  Languages,
  BookOpen,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { NewsItem, AccentColor } from '../types';
import { getAccent } from '../utils/theme';
import { SafeImage } from './SafeImage';
import { summarizeBlockWithAi, translateWithAi, isNativePlatform } from '../services/apiAdapter';
import { shareArticle } from '../services/shareService';
import { Language, getTranslation } from '../i18n/translations';
import { showError } from '../utils/errorHandler';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ArticleReaderModalProps {
  article: NewsItem | null;
  onClose: () => void;
  onToggleBookmark: (item: NewsItem) => void;
  isBookmarked: boolean;
  theme: 'dark' | 'light';
  accentColor?: AccentColor;
  language?: Language;
  onNextArticle?: () => void;
  onPrevArticle?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
  isBookmarked,
  theme,
  accentColor,
  language = 'en',
  onNextArticle,
  onPrevArticle,
  hasPrev = false,
  hasNext = false,
}) => {
  const acc = getAccent(accentColor);
  const t = getTranslation(language);
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Gesture & Swipe Tracking State
  const [swipeOffsetX, setSwipeOffsetX] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalGestureRef = useRef<boolean>(false);

  // Focus Reader Mode States
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl' | '2xl'>('lg');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');

  useEffect(() => {
    // Reset state when article changes
    setAiSummary(null);
    setTranslatedText(null);
    setIsFocusMode(false);
    setSwipeOffsetX(0);
    setIsAnimating(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    }
  }, [article]);

  if (!article) return null;

  // --- Touch & Swipe Gesture Handlers (Left-to-Right & Right-to-Left) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalGestureRef.current = false;
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Check if primarily a horizontal gesture
    if (Math.abs(diffX) > 12 && Math.abs(diffX) > Math.abs(diffY) * 1.1) {
      isHorizontalGestureRef.current = true;
      const dampenedX = diffX > 0 ? Math.min(diffX * 0.85, 240) : Math.max(diffX * 0.85, -240);
      setSwipeOffsetX(dampenedX);
    }
  };

  const handleTouchEnd = () => {
    if (!isHorizontalGestureRef.current) {
      setSwipeOffsetX(0);
      return;
    }

    setIsAnimating(true);

    // Swipe Left-to-Right (diffX > 75px)
    if (swipeOffsetX > 75) {
      try {
        Haptics.impact({ style: ImpactStyle.Light });
      } catch (_) { }

      if (hasPrev && onPrevArticle) {
        onPrevArticle();
      } else {
        onClose();
      }
    }
    // Swipe Right-to-Left (diffX < -75px)
    else if (swipeOffsetX < -75) {
      try {
        Haptics.impact({ style: ImpactStyle.Light });
      } catch (_) { }

      if (hasNext && onNextArticle) {
        onNextArticle();
      } else {
        setSwipeOffsetX(0);
      }
    } else {
      setSwipeOffsetX(0);
    }

    isHorizontalGestureRef.current = false;
  };

  // Web Speech API Text-to-Speech
  const handleToggleTts = () => {
    if (!('speechSynthesis' in window)) {
      showError(t.reader.ttsNotSupported);
      return;
    }

    if (isPlayingTts) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    } else {
      const textToRead = `${article.title}. ${article.contentSnippet}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = language === 'pt' ? 'pt-BR' : 'en-US';
      utterance.rate = 1.0;

      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingTts(true);
    }
  };

  // Generate AI Executive Summary with Gemini
  const handleGenerateAiSummary = async () => {
    try {
      setIsGeneratingAi(true);
      const data = await summarizeBlockWithAi([article], article.title);
      if (data.success && data.summary) {
        setAiSummary(data.summary);
      } else {
        showError(data.error || t.reader.summaryFailed);
      }
    } catch (err: any) {
      showError(t.reader.summaryFailed);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Gemini AI Translate
  const handleTranslate = async () => {
    try {
      setIsTranslating(true);
      const data = await translateWithAi(article.title, article.contentSnippet);
      if (data.success && data.translation) {
        setTranslatedText(data.translation);
      } else {
        showError(data.error || t.reader.translationFailed);
      }
    } catch (err) {
      showError(t.reader.translationFailed);
    } finally {
      setIsTranslating(false);
    }
  };

  // Share / Copy Link
  const handleShare = async () => {
    const res = await shareArticle({
      title: article.title,
      text: article.contentSnippet,
      url: article.link,
      dialogTitle: `${article.title} - RADAR RSS`,
    });
    if (res.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const increaseFontSize = () => {
    if (fontSize === 'sm') setFontSize('base');
    else if (fontSize === 'base') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('xl');
    else if (fontSize === 'xl') setFontSize('2xl');
  };

  const decreaseFontSize = () => {
    if (fontSize === '2xl') setFontSize('xl');
    else if (fontSize === 'xl') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('base');
    else if (fontSize === 'base') setFontSize('sm');
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm leading-relaxed';
      case 'base': return 'text-base leading-relaxed';
      case 'lg': return 'text-lg leading-loose';
      case 'xl': return 'text-xl leading-loose';
      case '2xl': return 'text-2xl leading-loose';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'sans': return 'font-sans';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden touch-none"
      onClick={onClose}
    >
      {/* Swipe Left/Right Visual Indicator Overlay */}
      {swipeOffsetX !== 0 && (
        <div className="absolute inset-0 pointer-events-none z-60 flex items-center justify-between px-6">
          {swipeOffsetX > 30 && (
            <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 px-4 py-2 rounded-2xl text-xs font-bold text-amber-400 backdrop-blur-md shadow-xl animate-in fade-in">
              <ArrowLeft className="w-4 h-4" />
              <span>{hasPrev ? t.reader.prevStory : t.reader.close}</span>
            </div>
          )}
          {swipeOffsetX < -30 && hasNext && (
            <div className="ml-auto flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 px-4 py-2 rounded-2xl text-xs font-bold text-amber-400 backdrop-blur-md shadow-xl animate-in fade-in">
              <span>{t.reader.nextStory}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {/* Main Story Modal Container with gesture tracking */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffsetX}px)`,
          opacity: 1 - Math.abs(swipeOffsetX) / 700,
          transition: isAnimating ? 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.25s ease' : 'none',
        }}
        className={`relative w-full ${isFocusMode ? 'max-w-3xl h-[95vh]' : 'max-w-2xl max-h-[90vh]'} rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
        }`}
      >

        {/* Top Header Bar */}
        <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            {/* Story Navigation Prev */}
            {hasPrev && onPrevArticle && (
              <button
                onClick={onPrevArticle}
                title={`${t.reader.prevStory} (←)`}
                className={`p-1.5 rounded-xl border transition-colors ${
                  theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700 text-neutral-300' : 'hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${acc.bg} text-black tracking-wider shrink-0`}>
              {article.sourceName}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 hidden sm:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              {article.pubDate}
            </span>

            {/* Story Navigation Next */}
            {hasNext && onNextArticle && (
              <button
                onClick={onNextArticle}
                title={`${t.reader.nextStory} (→)`}
                className={`p-1.5 rounded-xl border transition-colors ${
                  theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700 text-neutral-300' : 'hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Focus Reader Toggle */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              title={isFocusMode ? 'Exit Focus Mode' : t.reader.focusMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                isFocusMode
                  ? `${acc.bg} text-black ${acc.border} shadow-md`
                  : theme === 'dark' ? `bg-neutral-800 border-neutral-700 ${acc.textDark} hover:bg-neutral-700` : `bg-neutral-200 border-neutral-300 ${acc.textLight} hover:bg-neutral-300`
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xs:inline">{isFocusMode ? 'Exit' : t.reader.focusMode}</span>
            </button>

            {/* Font Size & Type Controls */}
            {isFocusMode && (
              <div className={`flex items-center p-0.5 rounded-xl border ${
                theme === 'dark' ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-200 border-neutral-300'
              }`}>
                <button
                  onClick={decreaseFontSize}
                  title="Smaller font"
                  className={`p-1.5 ${acc.textHover} transition-colors`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1 uppercase text-neutral-400">
                  {fontSize}
                </span>
                <button
                  onClick={increaseFontSize}
                  title="Larger font"
                  className={`p-1.5 ${acc.textHover} transition-colors`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <div className={`h-4 w-px mx-1 ${
                  theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-300'
                }`} />

                <button
                  onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : fontFamily === 'sans' ? 'mono' : 'serif')}
                  title="Toggle typography"
                  className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${acc.textHover} transition-colors`}
                >
                  {fontFamily}
                </button>
              </div>
            )}

            {!isFocusMode && (
              <>
                <button
                  onClick={handleShare}
                  title={t.reader.share}
                  className={`p-2 rounded-xl border transition-colors ${
                    copied ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-200 border-neutral-300'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => onToggleBookmark(article)}
                  title={t.block.bookmark}
                  className={`p-2 rounded-xl border transition-colors ${
                    isBookmarked ? `${acc.bgLight} ${acc.borderLight} ${acc.textDark}` : theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-200 border-neutral-300'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? `${acc.fill}` : ''}`} />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-200 border-neutral-300'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body with horizontal gesture containment */}
        <div className={`p-6 sm:p-10 overflow-y-auto space-y-6 flex-1 stories-scroll-container ${isFocusMode ? 'max-w-2xl mx-auto w-full' : ''}`}>

          {/* Focus Mode Indicator Banner */}
          {isFocusMode && (
            <div className={`flex items-center justify-between text-[11px] font-mono ${acc.textDark} ${acc.bgLight} px-4 py-2 rounded-2xl border ${acc.borderLight}`}>
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
                <BookOpen className={`w-4 h-4 ${acc.text}`} />
                {t.reader.focusMode}
              </span>
              <span className="text-neutral-400 text-[10px]">Distraction free</span>
            </div>
          )}

          {/* Article Image Banner */}
          {!isFocusMode && article.imageUrl && (
            <div className={`w-full aspect-video rounded-2xl overflow-hidden ${
              theme === 'dark' ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-200 border-neutral-300'
            } border`}>
              <SafeImage
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                sourceName={article.sourceName}
              />
            </div>
          )}

          {/* Title & Author */}
          <div>
            <h2 className={`${isFocusMode ? 'text-2xl sm:text-3xl font-black' : 'text-xl sm:text-2xl font-black'} leading-tight mb-3 ${getFontFamilyClass()}`}>
              {article.title}
            </h2>
            {article.author && (
              <p className="text-xs text-neutral-400 font-mono">
                {t.reader.by} {article.author}
              </p>
            )}
          </div>

          {/* Interactive AI & Audio Toolbar */}
          <div className={`flex flex-wrap items-center gap-2 pt-2 border-t border-b ${
            theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
          } py-3`}>

            {/* Audio TTS Button */}
            <button
              onClick={handleToggleTts}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                isPlayingTts
                  ? `${acc.bg} text-black ${acc.border} animate-pulse`
                  : theme === 'dark'
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {isPlayingTts ? <VolumeX className="w-4 h-4 text-black" /> : <Volume2 className={`w-4 h-4 ${acc.textDark}`} />}
              <span>{isPlayingTts ? t.reader.stopReading : t.reader.readAloud}</span>
            </button>

            {/* AI Summary Button */}
            <button
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${acc.bg} text-black ${acc.bgHover} transition-all cursor-pointer`}
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? t.reader.generating : t.reader.generateSummary}</span>
            </button>

            {/* AI Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-200'
                  : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-800'
              }`}
            >
              <Languages className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
              <span>{isTranslating ? t.reader.translating : t.reader.translate}</span>
            </button>
          </div>

          {/* AI Generated Summary Box */}
          {aiSummary && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              theme === 'dark' ? `${acc.bgLight} ${acc.borderLight} text-neutral-200` : `${acc.bgLight} ${acc.borderLight} text-neutral-900`
            }`}>
              <div className={`flex items-center gap-2 font-black uppercase ${acc.textDark} mb-2 tracking-wider`}>
                <Sparkles className="w-4 h-4" />
                <span>{t.reader.aiSummaryTitle}:</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{aiSummary}</div>
            </div>
          )}

          {/* Translation Box */}
          {translatedText && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              theme === 'dark' ? 'border-neutral-700 bg-neutral-800/80 text-neutral-200' : 'border-neutral-200 bg-neutral-100 text-neutral-900'
            }`}>
              <div className={`font-black uppercase ${acc.textDark} mb-2 tracking-wider`}>
                {t.reader.translate}:
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{translatedText}</div>
            </div>
          )}

          {/* Article Snippet / Description */}
          <div className={`prose max-w-none ${getFontSizeClass()} ${getFontFamilyClass()} ${
            theme === 'dark' ? 'prose-invert text-neutral-200' : 'text-neutral-800'
          }`}>
            {article.contentSnippet}
          </div>

          {/* Swipe Navigation Hint */}
          <div className="pt-2 text-center text-[10px] font-mono text-neutral-500 select-none">
            {t.reader.swipeHint}
          </div>

          {/* Source Link CTA Button */}
          <div className="pt-2">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isNativePlatform()) {
                  e.preventDefault();
                  window.open(article.link, '_system');
                }
              }}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black uppercase tracking-wider text-xs ${acc.bg} ${acc.bgHover} text-black shadow-xl transition-all`}
            >
              <span>{t.reader.openOriginal} ({article.sourceName})</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
