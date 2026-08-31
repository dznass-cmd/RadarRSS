import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ListPlus,
  Loader2,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';
import { RssFeed } from '../types';
import { validateRssFeed } from '../services/apiAdapter';
import { Language, getTranslation } from '../i18n/translations';

interface ManageFeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: RssFeed[];
  onToggleFeed: (feedId: string) => void;
  onAddCustomFeed: (newFeed: RssFeed) => void;
  onRemoveFeed: (feedId: string) => void;
  onExportConfig: () => void;
  onImportConfig: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: 'dark' | 'light';
  language?: Language;
}

export const ManageFeedsModal: React.FC<ManageFeedsModalProps> = ({
  isOpen,
  onClose,
  feeds,
  onToggleFeed,
  onAddCustomFeed,
  onRemoveFeed,
  onExportConfig,
  onImportConfig,
  theme,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<RssFeed['category']>('custom');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const data = await validateRssFeed(customUrl.trim());

      if (data.success) {
        const feedToAdd: RssFeed = {
          id: `custom_${Date.now()}`,
          title: customTitle.trim() || data.title || (language === 'pt' ? 'Feed Personalizado' : 'Custom Feed'),
          url: customUrl.trim(),
          category: customCategory,
          icon: '🔗',
          active: true,
          status: 'ok',
        };
        onAddCustomFeed(feedToAdd);
        setCustomUrl('');
        setCustomTitle('');
      } else {
        setValidationError(data.error || t.manageFeeds.invalidFeed);
      }
    } catch (err: any) {
      setValidationError(t.manageFeeds.connectionError);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
        theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-orange-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">{t.manageFeeds.title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700 text-neutral-300' : 'hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Add Custom Feed Form */}
          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <h4 className="font-black text-xs uppercase tracking-widest text-orange-500 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              {t.manageFeeds.addFeed}
            </h4>
            <form onSubmit={handleValidateAndAdd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder={t.manageFeeds.urlPlaceholder}
                  className={`sm:col-span-7 px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-neutral-900 border-neutral-800 focus:border-orange-500' : 'bg-white border-neutral-300'
                  }`}
                />
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={t.manageFeeds.feedNamePlaceholder}
                  className={`sm:col-span-5 px-3.5 py-2.5 text-xs font-bold rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-neutral-900 border-neutral-800 focus:border-orange-500' : 'bg-white border-neutral-300'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-300'
                  }`}
                >
                  <option value="tech">💻 {t.createBlock.categories.tech}</option>
                  <option value="world">🌍 {t.createBlock.categories.world}</option>
                  <option value="ai">🤖 {t.createBlock.categories.ai}</option>
                  <option value="finance">📈 {t.createBlock.categories.finance}</option>
                  <option value="brazil">🇧🇷 {t.createBlock.categories.brazil}</option>
                  <option value="sports">⚽ {t.createBlock.categories.sports}</option>
                  <option value="entertainment">🎬 {t.createBlock.categories.entertainment}</option>
                  <option value="custom">🔗 {t.createBlock.categories.custom}</option>
                </select>

                <button
                  type="submit"
                  disabled={isValidating || !customUrl}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-orange-500 hover:bg-orange-400 text-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isValidating ? t.manageFeeds.validating : t.manageFeeds.validateAndAdd}</span>
                </button>
              </div>

              {validationError && (
                <p className="text-xs text-red-400 font-bold flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationError}
                </p>
              )}
            </form>
          </div>

          {/* Active / Inactive Feed Catalog */}
          <div>
            <h4 className={`font-black text-xs uppercase tracking-widest mb-3 ${
              theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              {t.manageFeeds.activeFeeds} ({feeds.length})
            </h4>
            <div className={`divide-y max-h-60 overflow-y-auto pr-1 ${
              theme === 'dark' ? 'divide-neutral-800/80' : 'divide-neutral-200'
            }`}>
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{feed.icon || '📰'}</span>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-xs uppercase tracking-wider truncate flex items-center gap-2">
                        {feed.title}
                        <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          theme === 'dark' ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600'
                        }`}>
                          {feed.category}
                        </span>
                      </h5>
                      <p className="text-[10px] font-mono text-neutral-500 truncate">{feed.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleFeed(feed.id)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        feed.active
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : theme === 'dark'
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-500'
                            : 'bg-neutral-200 border-neutral-300 text-neutral-500'
                      }`}
                    >
                      {feed.active ? (language === 'pt' ? 'Ativo' : 'Active') : (language === 'pt' ? 'Inativo' : 'Inactive')}
                    </button>

                    {feed.id.startsWith('custom_') && (
                      <button
                        onClick={() => onRemoveFeed(feed.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title={t.manageFeeds.deleteFeed}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import / Export Config */}
          <div className={`pt-2 border-t flex items-center justify-between gap-3 ${
            theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            <button
              onClick={onExportConfig}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                  : 'border-neutral-300 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-orange-500" />
              <span>{t.manageFeeds.exportConfig}</span>
            </button>

            <label className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                : 'border-neutral-300 hover:bg-neutral-200 text-neutral-700'
            }`}>
              <Upload className="w-3.5 h-3.5 text-orange-500" />
              <span>{t.manageFeeds.importConfig}</span>
              <input
                type="file"
                accept=".json"
                onChange={onImportConfig}
                className="hidden"
              />
            </label>
          </div>

        </div>

      </div>
    </div>
  );
};
