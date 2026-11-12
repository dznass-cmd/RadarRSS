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
  Layers,
  Newspaper,
  FileText,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { NewsItem, NewsStory, AccentColor, ReaderViewMode, ExtractedArticle } from '../types';
import { getAccent } from '../utils/theme';
import { SafeImage } from './SafeImage';
import { summarizeBlockWithAi, translateWithAi, isNativePlatform } from '../services/apiAdapter';
import { fetchFullArticle } from '../services/readabilityService';
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
  defaultReaderMode?: ReaderViewMode;
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
  defaultReaderMode = 'full',
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
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);

  // Gesture & Swipe Tracking State
  const [swipeOffsetX, setSwipeOffsetX] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalGestureRef = useRef<boolean>(false);

  // Full Article Reader View States
  const [viewMode, setViewMode] = useState<ReaderViewMode>(defaultReaderMode);
  const [extractedArticle, setExtractedArticle] = useState<ExtractedArticle | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Focus Reader Mode States
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl' | '2xl'>('lg');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');

  useEffect(() => {
    // Reset state when article changes
    setActiveSourceIndex(0);
    setAiSummary(null);
    setTranslatedText(null);
    setIsFocusMode(false);
    setSwipeOffsetX(0);
    setIsAnimating(false);
    setScrollProgress(0);
    setExtractedArticle(null);
    setExtractionError(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    }
  }, [article]);

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
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });

      if (hasPrev && onPrevArticle) {
        onPrevArticle();
      } else {
        onClose();
      }
    }
    // Swipe Right-to-Left (diffX < -75px)
    else if (swipeOffsetX < -75) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });

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

  const story = article as NewsStory | null;
  const isMultiSource = !!story && !!story.isCluster && story.sourcesCount > 1;
  const currentSource = isMultiSource && story?.uniqueSources && story.uniqueSources[activeSourceIndex]
    ? story.uniqueSources[activeSourceIndex]
    : null;

  const displayTitle = currentSource ? currentSource.title : article?.title || '';
  const displaySnippet = currentSource ? currentSource.contentSnippet : article?.contentSnippet || '';
  const displayLink = currentSource ? currentSource.link : article?.link || '';
  const displaySourceName = currentSource ? currentSource.sourceName : article?.sourceName || '';
  const displayAuthor = currentSource ? currentSource.author : article?.author;
  const displayPubDate = currentSource ? currentSource.pubDate : article?.pubDate || '';
  const displayImage = currentSource?.imageUrl || article?.imageUrl;

  // Auto-fetch full article when viewMode is 'full'
  useEffect(() => {
    if (!displayLink || viewMode !== 'full') return;
    let isCancelled = false;

    const runExtraction = async () => {
      setIsExtracting(true);
      setExtractionError(null);
      try {
        const art = await fetchFullArticle(displayLink);
        if (!isCancelled) {
          setExtractedArticle(art);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('[ArticleReader] Extraction failed:', err?.message);
          setExtractionError(err?.message || t.reader.extractionFailed);
        }
      } finally {
        if (!isCancelled) {
          setIsExtracting(false);
        }
      }
    };

    runExtraction();

    return () => {
      isCancelled = true;
    };
  }, [displayLink, viewMode]);

  const handleToggleViewMode = (mode: ReaderViewMode) => {
    setViewMode(mode);
    if (mode === 'full' && !extractedArticle && !isExtracting && displayLink) {
      setIsExtracting(true);
      setExtractionError(null);
      fetchFullArticle(displayLink)
        .then((art) => setExtractedArticle(art))
        .catch((err) => setExtractionError(err?.message || t.reader.extractionFailed))
        .finally(() => setIsExtracting(false));
    }
  };

  const handleSelectSource = (index: number) => {
    setActiveSourceIndex(index);
    setAiSummary(null);
    setTranslatedText(null);
    setExtractionError(null);
    setExtractedArticle(null);
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
      const bodyToRead = (viewMode === 'full' && extractedArticle?.textContent)
        ? extractedArticle.textContent.slice(0, 4000)
        : displaySnippet;
      const textToRead = `${displayTitle}. ${bodyToRead}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = language === 'pt' ? 'pt-BR' : 'en-US';
      utterance.rate = 1.0;

      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingTts(true);
    }
  };

  // Generate AI Executive Summary with Gemini (Consolidated for multi-source stories)
  const handleGenerateAiSummary = async () => {
    if (!article) return;
    try {
      setIsGeneratingAi(true);
      const itemsToSummarize = isMultiSource && story?.articles && story.articles.length > 0
        ? story.articles
        : [{
            ...article,
            contentSnippet: (viewMode === 'full' && extractedArticle?.textContent)
              ? extractedArticle.textContent.slice(0, 3000)
              : displaySnippet,
          }];
      const data = await summarizeBlockWithAi(itemsToSummarize, displayTitle, isMultiSource);
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
      const textToTranslate = (viewMode === 'full' && extractedArticle?.textContent)
        ? extractedArticle.textContent.slice(0, 1500)
        : displaySnippet;
      const data = await translateWithAi(displayTitle, textToTranslate);
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
      title: displayTitle,
      text: displaySnippet,
      url: displayLink,
      dialogTitle: `${displayTitle} - RADAR RSS`,
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      const progress = (el.scrollTop / maxScroll) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    } else {
      setScrollProgress(0);
    }
  };

  if (!article) return null;

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
        {/* Reading Scroll Progress Line */}
        <div
          className={`absolute top-0 left-0 h-1 ${acc.bg} transition-all duration-75 z-40`}
          style={{ width: `${scrollProgress}%` }}
        />

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
              {displaySourceName}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 hidden sm:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              {displayPubDate}
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
        <div
          onScroll={handleScroll}
          className={`p-6 sm:p-10 overflow-y-auto space-y-6 flex-1 stories-scroll-container ${isFocusMode ? 'max-w-2xl mx-auto w-full' : ''}`}
        >

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

          {/* Multi-Source Coverage Selector Tabs */}
          {isMultiSource && story && story.uniqueSources && story.uniqueSources.length > 1 && (
            <div className={`p-3.5 rounded-2xl border ${
              theme === 'dark' ? 'bg-neutral-950/70 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${acc.textDark}`}>
                  <Layers className="w-3.5 h-3.5" />
                  {t.reader.sourcesCovering.replace('{count}', String(story.sourcesCount))}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {t.reader.switchSource}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {story.uniqueSources.map((src, idx) => {
                  const isActive = idx === activeSourceIndex;
                  return (
                    <button
                      key={`${src.sourceId}-${idx}`}
                      onClick={() => handleSelectSource(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isActive
                          ? `${acc.bg} text-black border-transparent shadow-sm font-black scale-105`
                          : theme === 'dark'
                            ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span>{src.sourceName}</span>
                      <span className="text-[10px] opacity-70">
                        {new Date(src.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Article Image Banner */}
          {!isFocusMode && displayImage && (
            <div className={`w-full aspect-video rounded-2xl overflow-hidden ${
              theme === 'dark' ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-200 border-neutral-300'
            } border`}>
              <SafeImage
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
                sourceName={displaySourceName}
              />
            </div>
          )}

          {/* Title & Author */}
          <div>
            <h2 className={`${isFocusMode ? 'text-2xl sm:text-3xl font-black' : 'text-xl sm:text-2xl font-black'} leading-tight mb-3 ${getFontFamilyClass()}`}>
              {displayTitle}
            </h2>
            {displayAuthor && (
              <p className="text-xs text-neutral-400 font-mono">
                {t.reader.by} {displayAuthor}
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
              <span>
                {isGeneratingAi
                  ? t.reader.generating
                  : isMultiSource
                    ? t.reader.generateConsolidatedSummary.replace('{count}', String(story?.sourcesCount || 2))
                    : t.reader.generateSummary}
              </span>
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

          {/* Reader View Mode Switcher (Full Article vs RSS Summary) */}
          <div className={`flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl border ${
            theme === 'dark' ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
          }`}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleViewMode('full')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'full'
                    ? `${acc.bg} text-black font-black shadow-sm`
                    : theme === 'dark'
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>{t.reader.fullArticle}</span>
                {isExtracting && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
              </button>

              <button
                onClick={() => handleToggleViewMode('snippet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'snippet'
                    ? `${acc.bg} text-black font-black shadow-sm`
                    : theme === 'dark'
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-600 hover:text-black'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.reader.rssSnippet}</span>
              </button>
            </div>

            {viewMode === 'full' && extractedArticle && !isExtracting && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 px-2 hidden sm:flex">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  {t.reader.readingTime.replace('{min}', String(extractedArticle.readingTimeMinutes))}
                </span>
                <span>•</span>
                <span>{t.reader.wordsCount.replace('{count}', String(extractedArticle.wordCount))}</span>
              </div>
            )}
          </div>

          {/* Body Content Area */}
          {viewMode === 'full' ? (
            <div className="space-y-4">
              {/* Extraction Loading Skeleton */}
              {isExtracting && (
                <div className="space-y-4 py-3 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                    <span>{t.reader.loadingArticle}</span>
                    <span className="text-[10px] text-neutral-400 ml-auto hidden sm:inline">{t.reader.cleanArticleDesc}</span>
                  </div>
                  <div className={`h-4 rounded-lg w-full ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                  <div className={`h-4 rounded-lg w-11/12 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                  <div className={`h-4 rounded-lg w-4/5 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                  <div className={`h-4 rounded-lg w-full mt-4 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                  <div className={`h-4 rounded-lg w-10/12 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                  <div className={`h-4 rounded-lg w-3/4 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                </div>
              )}

              {/* Extraction Error Notice with Snippet Fallback */}
              {!isExtracting && extractionError && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-neutral-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-amber-300">{t.reader.extractionFailed}</p>
                      <p className="text-neutral-300 leading-relaxed text-[11px]">{t.reader.extractionFailedDesc}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => displayLink && handleToggleViewMode('full')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${acc.bg} text-black hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.reader.retry}</span>
                    </button>
                    <button
                      onClick={() => setViewMode('snippet')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                    >
                      {t.reader.rssSnippet}
                    </button>
                  </div>
                  {/* Fallback to snippet below notice */}
                  <div className={`pt-3 border-t border-neutral-700/50 prose max-w-none ${getFontSizeClass()} ${getFontFamilyClass()} ${
                    theme === 'dark' ? 'prose-invert text-neutral-200' : 'text-neutral-800'
                  }`}>
                    {displaySnippet}
                  </div>
                </div>
              )}

              {/* Clean Extracted Full Article Body */}
              {!isExtracting && !extractionError && extractedArticle && (
                <div
                  className={`prose max-w-none ${getFontSizeClass()} ${getFontFamilyClass()} ${
                    theme === 'dark' ? 'prose-invert text-neutral-200' : 'text-neutral-800'
                  } prose-p:my-4 prose-p:leading-relaxed prose-headings:font-black prose-headings:my-4 prose-a:text-amber-400 prose-a:underline hover:prose-a:text-amber-300 prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-6 prose-img:max-h-[520px] prose-img:object-cover prose-img:mx-auto prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-hr:border-neutral-800`}
                  dangerouslySetInnerHTML={{ __html: extractedArticle.contentHtml }}
                />
              )}
            </div>
          ) : (
            /* Standard RSS Snippet / Description View */
            <div className={`prose max-w-none ${getFontSizeClass()} ${getFontFamilyClass()} ${
              theme === 'dark' ? 'prose-invert text-neutral-200' : 'text-neutral-800'
            }`}>
              {displaySnippet}
            </div>
          )}

          {/* Swipe Navigation Hint */}
          <div className="pt-2 text-center text-[10px] font-mono text-neutral-500 select-none">
            {t.reader.swipeHint}
          </div>

          {/* Source Link CTA Button */}
          <div className="pt-2">
            <a
              href={displayLink}
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
              <span>{t.reader.openOriginal} ({displaySourceName})</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
