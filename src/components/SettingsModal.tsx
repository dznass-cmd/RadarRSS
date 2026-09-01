import React, { useState } from 'react';
import { X, Settings, RotateCcw, Volume2, Clock, LayoutGrid, BellRing, Sparkles, AlertTriangle, Send, Info, Sun, Moon, Palette, Globe } from 'lucide-react';
import { AppSettings, AccentColor } from '../types';
import { getTranslation } from '../i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetToDefaults: () => void;
  onTriggerToast?: (toast: { title: string; message: string; type?: 'breaking' | 'info' | 'success' | 'warning' }) => void;
}

const ACCENT_COLORS: {
  id: AccentColor;
  colorBg: string;
  activeBorder: string;
  bgLight: string;
  ringColor: string;
}[] = [
  { id: 'orange', colorBg: 'bg-orange-500', activeBorder: 'border-orange-500 text-orange-400', bgLight: 'bg-orange-500/10', ringColor: 'ring-orange-500/50' },
  { id: 'emerald', colorBg: 'bg-emerald-500', activeBorder: 'border-emerald-500 text-emerald-400', bgLight: 'bg-emerald-500/10', ringColor: 'ring-emerald-500/50' },
  { id: 'cyan', colorBg: 'bg-cyan-500', activeBorder: 'border-cyan-500 text-cyan-400', bgLight: 'bg-cyan-500/10', ringColor: 'ring-cyan-500/50' },
  { id: 'purple', colorBg: 'bg-purple-500', activeBorder: 'border-purple-500 text-purple-400', bgLight: 'bg-purple-500/10', ringColor: 'ring-purple-500/50' },
  { id: 'red', colorBg: 'bg-red-500', activeBorder: 'border-red-500 text-red-400', bgLight: 'bg-red-500/10', ringColor: 'ring-red-500/50' },
  { id: 'amber', colorBg: 'bg-amber-500', activeBorder: 'border-amber-500 text-amber-400', bgLight: 'bg-amber-500/10', ringColor: 'ring-amber-500/50' },
  { id: 'blue', colorBg: 'bg-blue-500', activeBorder: 'border-blue-500 text-blue-400', bgLight: 'bg-blue-500/10', ringColor: 'ring-blue-500/50' },
  { id: 'pink', colorBg: 'bg-pink-500', activeBorder: 'border-pink-500 text-pink-400', bgLight: 'bg-pink-500/10', ringColor: 'ring-pink-500/50' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetToDefaults,
  onTriggerToast,
}) => {
  const [keywordInput, setKeywordInput] = useState('');
  const t = getTranslation(settings.language);

  if (!isOpen) return null;

  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function';
  const permissionState = notificationSupported ? Notification.permission : 'unsupported';

  const handleToggleNotification = async (enabled: boolean) => {
    if (enabled && notificationSupported && Notification.permission !== 'granted') {
      try {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          if (onTriggerToast) {
            onTriggerToast({
              title: t.toast.notificationsDenied,
              message: t.toast.notificationsDeniedMsg,
              type: 'warning',
            });
          }
          onUpdateSettings({ ...settings, browserNotifications: false });
          return;
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
    onUpdateSettings({ ...settings, browserNotifications: enabled });
  };

  const handleTestNotification = async () => {
    let nativeTriggered = false;

    if (notificationSupported) {
      try {
        let perm = Notification.permission;
        if (perm === 'default') {
          perm = await Notification.requestPermission();
        }
        if (perm === 'granted') {
          try {
            const notif = new Notification(t.toast.testTitle, {
              body: t.toast.testMessage,
              icon: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=120&q=80',
              tag: 'radar-rss-test-' + Date.now(),
            });
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
            nativeTriggered = true;
          } catch (e) {
            console.warn('Native notification failed:', e);
          }
        }
      } catch (err) {
        console.warn('Notification API error:', err);
      }
    }

    if (onTriggerToast) {
      onTriggerToast({
        title: t.toast.testTitle,
        message: t.toast.testMessage,
        type: 'info',
      });
    }
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordInput.trim()) return;
    const kw = keywordInput.trim();
    if (!settings.breakingKeywords.includes(kw)) {
      onUpdateSettings({
        ...settings,
        breakingKeywords: [...settings.breakingKeywords, kw],
      });
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    onUpdateSettings({
      ...settings,
      breakingKeywords: settings.breakingKeywords.filter((kw) => kw !== kwToRemove),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        settings.theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          settings.theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">{t.settings.title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              settings.theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700 text-neutral-300' : 'hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Language Selector */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            settings.theme === 'dark' ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50/80'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-orange-500" />
                {t.settings.language}
              </label>

              <div className={`flex items-center border rounded-xl p-1 gap-1 ${
                settings.theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
              }`}>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    (settings.language || 'en') === 'en' ? 'bg-orange-500 text-black shadow-xs' : settings.theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, language: 'pt' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    settings.language === 'pt' ? 'bg-orange-500 text-black shadow-xs' : settings.theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  🇧🇷 Português
                </button>
              </div>
            </div>
          </div>

          {/* Theme & Accent Color Section */}
          <div className={`p-4 rounded-2xl border space-y-3.5 ${
            settings.theme === 'dark' ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50/80'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-orange-500" />
                {t.settings.theme}
              </label>

              {/* Light / Dark Mode Toggle Buttons */}
              <div className={`flex items-center border rounded-xl p-1 gap-1 ${
                settings.theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
              }`}>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    settings.theme === 'dark' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  {t.settings.themeDark}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    settings.theme === 'light' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : settings.theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  {t.settings.themeLight}
                </button>
              </div>
            </div>

            {/* Accent Color Palette Selector */}
            <div className={`pt-2 border-t ${
              settings.theme === 'dark' ? 'border-neutral-800/60' : 'border-neutral-200'
            }`}>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">
                {t.settings.accentColor}:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_COLORS.map((acc) => {
                  const isSelected = (settings.accentColor || 'orange') === acc.id;
                  const label = t.settings.colors[acc.id] || acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, accentColor: acc.id })}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? `${acc.activeBorder} ${acc.bgLight} font-black ring-1 ${acc.ringColor}`
                          : settings.theme === 'dark'
                          ? 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 text-neutral-400'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-600'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${acc.colorBg} shrink-0 shadow-sm`} />
                      <span className="text-[10px] font-bold truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Global Auto Refresh Interval */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              {t.settings.globalRefresh}
            </label>
            <select
              value={settings.globalRefreshSec ?? 60}
              onChange={(e) => onUpdateSettings({ ...settings, globalRefreshSec: Number(e.target.value) })}
              className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${
                settings.theme === 'dark' ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <option value={30}>30s (Real-time)</option>
              <option value={60}>1 min (Recommended)</option>
              <option value={120}>2 min</option>
              <option value={300}>5 min</option>
              <option value={0}>Manual only</option>
            </select>
          </div>

          {/* Browser Notifications Section */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            settings.theme === 'dark' ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50/80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider">{t.settings.notifications}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{t.settings.notificationsDesc}</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.browserNotifications ?? false}
                onChange={(e) => handleToggleNotification(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
            </div>

            {/* Permission status bar & Test button */}
            <div className={`flex items-center justify-between pt-2 border-t text-[10px] ${
              settings.theme === 'dark' ? 'border-neutral-800/80' : 'border-neutral-200'
            }`}>
              <span className="flex items-center gap-1 font-mono text-neutral-400">
                Status:
                {permissionState === 'granted' && <span className="text-emerald-400 font-bold">● Active</span>}
                {permissionState === 'denied' && <span className="text-red-400 font-bold">● Blocked by OS</span>}
                {permissionState === 'default' && <span className="text-amber-400 font-bold">● Pending</span>}
                {permissionState === 'unsupported' && <span className="text-neutral-500 font-bold">● Unsupported</span>}
              </span>

              <button
                type="button"
                onClick={handleTestNotification}
                className="px-2.5 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30 font-bold text-[10px] flex items-center gap-1 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>{t.settings.testNotification}</span>
              </button>
            </div>
          </div>

          {/* Breaking News Keywords Manager */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              {t.settings.breakingKeywords}
            </label>
            <p className="text-[10px] text-neutral-400 mb-2 font-mono">
              {t.settings.breakingKeywordsDesc}
            </p>
            
            <div className="flex flex-wrap gap-1.5 mb-2">
              {settings.breakingKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-bold"
                >
                  {kw}
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-red-400 ml-0.5 text-xs font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder={t.settings.keywordPlaceholder}
                className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl border outline-none ${
                  settings.theme === 'dark' ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500' : 'bg-neutral-50 border-neutral-200'
                }`}
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-orange-500 text-black font-black text-xs uppercase tracking-wider hover:bg-orange-400 transition-colors"
              >
                + {t.settings.addKeyword}
              </button>
            </form>
          </div>

          {/* Sound Alert Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${
            settings.theme === 'dark' ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50/80'
          }`}>
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-orange-500 shrink-0" />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider">{t.settings.soundAlerts}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{t.settings.soundAlertsDesc}</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundAlerts ?? true}
              onChange={(e) => onUpdateSettings({ ...settings, soundAlerts: e.target.checked })}
              className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
            />
          </div>

          {/* Google Gemini AI API Key */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            settings.theme === 'dark' ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50/80'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider">{t.settings.geminiApiKey}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{t.settings.geminiApiKeyDesc}</span>
              </div>
            </div>
            <input
              type="password"
              value={settings.geminiApiKey || ''}
              onChange={(e) => onUpdateSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder={t.settings.geminiApiKeyPlaceholder}
              className={`w-full px-3 py-2.5 text-xs font-mono rounded-xl border outline-none transition-all ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-200 focus:border-purple-500'
                  : 'bg-white border-neutral-300 text-neutral-800 focus:border-purple-500'
              }`}
            />
          </div>

          {/* Layout Grid Columns */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-orange-500" />
              {t.settings.layoutCols}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, layoutCols: cols })}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                    settings.layoutCols === cols
                      ? 'bg-orange-500 text-black border-orange-500'
                      : settings.theme === 'dark'
                      ? 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                  }`}
                >
                  {cols} {cols === 1 ? 'Column' : 'Columns'}
                </button>
              ))}
            </div>
          </div>

          {/* App Info & Developer Link */}
          <div className={`p-4 rounded-2xl border ${
            settings.theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          } space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-500" />
                <span className="font-extrabold text-xs uppercase tracking-wider">RADAR RSS</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                v0.0.7
              </span>
            </div>

            <p className="text-xs text-neutral-400 font-mono pl-6">
              Version 0.0.7 · Global Real-Time News (English Default)
            </p>

            <a
              href="https://t.me/Ahderiva"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold text-xs transition-all shadow-sm group cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>Developer · @Ahderiva</span>
            </a>
          </div>

          {/* Reset Defaults */}
          <div className={`pt-4 border-t ${
            settings.theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            <button
              onClick={() => {
                if (window.confirm(t.settings.resetConfirm)) {
                  onResetToDefaults();
                }
              }}
              className="w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.settings.resetButton}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
