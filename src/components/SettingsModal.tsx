import React, { useState } from 'react';
import { X, Settings, RotateCcw, Volume2, Clock, LayoutGrid, Bell, BellRing, Sparkles, AlertTriangle, Send, Info, Sun, Moon, Palette } from 'lucide-react';
import { AppSettings, AccentColor } from '../types';

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
  label: string;
  colorBg: string;
  activeBorder: string;
  bgLight: string;
  ringColor: string;
}[] = [
  { id: 'orange', label: 'Laranja', colorBg: 'bg-orange-500', activeBorder: 'border-orange-500 text-orange-400', bgLight: 'bg-orange-500/10', ringColor: 'ring-orange-500/50' },
  { id: 'emerald', label: 'Esmeralda', colorBg: 'bg-emerald-500', activeBorder: 'border-emerald-500 text-emerald-400', bgLight: 'bg-emerald-500/10', ringColor: 'ring-emerald-500/50' },
  { id: 'cyan', label: 'Ciano', colorBg: 'bg-cyan-500', activeBorder: 'border-cyan-500 text-cyan-400', bgLight: 'bg-cyan-500/10', ringColor: 'ring-cyan-500/50' },
  { id: 'purple', label: 'Roxo', colorBg: 'bg-purple-500', activeBorder: 'border-purple-500 text-purple-400', bgLight: 'bg-purple-500/10', ringColor: 'ring-purple-500/50' },
  { id: 'red', label: 'Vermelho', colorBg: 'bg-red-500', activeBorder: 'border-red-500 text-red-400', bgLight: 'bg-red-500/10', ringColor: 'ring-red-500/50' },
  { id: 'amber', label: 'Âmbar', colorBg: 'bg-amber-500', activeBorder: 'border-amber-500 text-amber-400', bgLight: 'bg-amber-500/10', ringColor: 'ring-amber-500/50' },
  { id: 'blue', label: 'Azul', colorBg: 'bg-blue-500', activeBorder: 'border-blue-500 text-blue-400', bgLight: 'bg-blue-500/10', ringColor: 'ring-blue-500/50' },
  { id: 'pink', label: 'Rosa', colorBg: 'bg-pink-500', activeBorder: 'border-pink-500 text-pink-400', bgLight: 'bg-pink-500/10', ringColor: 'ring-pink-500/50' },
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
              title: 'Notificações Negadas',
              message: 'O navegador ou sistema bloqueou as notificações nativas. Ativando alertas no app.',
              type: 'warning',
            });
          }
          onUpdateSettings({ ...settings, browserNotifications: false });
          return;
        }
      } catch (err) {
        console.warn('Erro ao solicitar permissão de notificação:', err);
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
            const notif = new Notification('⚡ RADAR RSS: Teste de Notificação', {
              body: 'Notificação do sistema funcionando perfeitamente!',
              icon: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=120&q=80',
              tag: 'radar-rss-test-' + Date.now(),
            });
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
            nativeTriggered = true;
          } catch (e) {
            console.warn('Falha na construção da notificação nativa (restrição de iframe/dispositivo):', e);
          }
        }
      } catch (err) {
        console.warn('Erro na API de notificações:', err);
      }
    }

    // Always trigger in-app toast for guaranteed feedback
    if (onTriggerToast) {
      onTriggerToast({
        title: '⚡ RADAR RSS: Notificação de Teste',
        message: nativeTriggered
          ? 'Notificação nativa e alerta no app ativados com sucesso!'
          : 'Alerta no app ativado com sucesso! (Notificação nativa indisponível no ambiente iFrame/dispositivo)',
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
            <h3 className="font-black text-sm uppercase tracking-wider">Configurações do Radar RSS</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-neutral-800">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Theme & Accent Color Section */}
          <div className={`p-4 rounded-2xl border space-y-3.5 ${
            settings.theme === 'dark' ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50/80'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-orange-500" />
                Tema & Modo Visual
              </label>

              {/* Light / Dark Mode Toggle Buttons */}
              <div className={`flex items-center border rounded-xl p-1 gap-1 ${
                settings.theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
              }`}>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    settings.theme === 'dark' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  Escuro
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    settings.theme === 'light' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Claro
                </button>
              </div>
            </div>

            {/* Accent Color Palette Selector */}
            <div className="pt-2 border-t border-neutral-800/60">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">
                Cor de Destaque da Interface:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_COLORS.map((acc) => {
                  const isSelected = (settings.accentColor || 'orange') === acc.id;
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
                      <span className="text-[10px] font-bold truncate">{acc.label}</span>
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
              Intervalo Global de Sincronização
            </label>
            <select
              value={settings.globalRefreshSec ?? 60}
              onChange={(e) => onUpdateSettings({ ...settings, globalRefreshSec: Number(e.target.value) })}
              className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${
                settings.theme === 'dark' ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <option value={30}>A cada 30 segundos (Tempo Real)</option>
              <option value={60}>A cada 1 minuto (Recomendado)</option>
              <option value={120}>A cada 2 minutos</option>
              <option value={300}>A cada 5 minutos</option>
              <option value={0}>Manual apenas (Desativado)</option>
            </select>
          </div>

          {/* Browser Notifications Section */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider">Notificações Nativas do Navegador</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Disparar alerta do SO ao detectar Breaking News</span>
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
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px]">
              <span className="flex items-center gap-1 font-mono text-neutral-400">
                Status:
                {permissionState === 'granted' && <span className="text-emerald-400 font-bold">● Concedido</span>}
                {permissionState === 'denied' && <span className="text-red-400 font-bold">● Negado pelo SO</span>}
                {permissionState === 'default' && <span className="text-amber-400 font-bold">● Pendente</span>}
                {permissionState === 'unsupported' && <span className="text-neutral-500 font-bold">● Não suportado</span>}
              </span>

              <button
                type="button"
                onClick={handleTestNotification}
                className="px-2.5 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30 font-bold text-[10px] flex items-center gap-1 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Testar Notificação</span>
              </button>
            </div>
          </div>

          {/* Breaking News Keywords Manager */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Palavras-chave de "Breaking News"
            </label>
            <p className="text-[10px] text-neutral-400 mb-2 font-mono">
              Notícias contendo estas palavras acionam o alerta urgente e notificação nativa:
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
                placeholder="Ex: Exclusivo, Mercado, STF..."
                className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl border outline-none ${
                  settings.theme === 'dark' ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500' : 'bg-neutral-50 border-neutral-200'
                }`}
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-orange-500 text-black font-black text-xs uppercase tracking-wider hover:bg-orange-400 transition-colors"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Sound Alert Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-orange-500 shrink-0" />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider">Alertas Sonoros</span>
                <span className="text-[10px] text-neutral-400 font-mono">Tocar efeito sonoro ao atualizar feeds</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundAlerts ?? true}
              onChange={(e) => onUpdateSettings({ ...settings, soundAlerts: e.target.checked })}
              className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
            />
          </div>

          {/* Layout Grid Columns */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-orange-500" />
              Colunas da Grade de Blocos (Desktop)
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
                  {cols} {cols === 1 ? 'Coluna' : 'Colunas'}
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
                <span className="font-extrabold text-xs uppercase tracking-wider">RSS RADAR</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 font-bold border border-neutral-700/50">
                build 106
              </span>
            </div>

            <p className="text-xs text-neutral-400 font-mono pl-6">
              Versão 1.0.6
            </p>

            <a
              href="https://t.me/Ahderiva"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold text-xs transition-all shadow-sm group cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>Desenvolvedor · @Ahderiva</span>
            </a>
          </div>

          {/* Reset Defaults */}
          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={onResetToDefaults}
              className="w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Redefinir Blocos e Feeds para o Padrão</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

