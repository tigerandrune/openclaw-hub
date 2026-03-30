import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { languages } from '../i18n';
import { Check, ChevronUp, ChevronDown, RotateCcw, Palette, Zap } from 'lucide-react';

const THEMES = [
  {
    id: 'dark',
    label: 'Dark',
    desc: 'Deep navy, easy on the eyes',
    bg: '#1a1a2e',
    surface: '#16213e',
    accent: '#D4A853',
    text: '#e2e8f0',
  },
  {
    id: 'light',
    label: 'Light',
    desc: 'Clean and bright',
    bg: '#f0f4f8',
    surface: '#ffffff',
    accent: '#7c3aed',
    text: '#0f172a',
  },
  {
    id: 'norse',
    label: 'Norse',
    desc: 'Runic gold and frost',
    bg: '#1a1a1f',
    surface: '#24242b',
    accent: '#D4A853',
    text: '#e8e8f0',
    frost: '#7EB8DA',
  },
];

const PRESET_COLORS = ['#D4A853', '#7c3aed', '#06b6d4', '#22c55e', '#f97316', '#ec4899'];

const PAGE_OPTIONS = [
  { id: 'activity', key: 'nav.activity' },
  { id: 'costs', key: 'nav.costs' },
  { id: 'kanban', key: 'nav.tasks' },
  { id: 'services', key: 'nav.services' },
  { id: 'notifications', key: 'nav.alerts' },
];

export default function Settings() {
  const { config, saveConfig } = useConfig();
  const { t, setLang } = useI18n();
  const { setTheme, setAccentColor } = useTheme();
  const { data: availableActions } = useApi('/api/actions');
  const [savedIndicator, setSavedIndicator] = useState('');

  const showSaved = (section) => {
    setSavedIndicator(section);
    setTimeout(() => setSavedIndicator(''), 2000);
  };

  const handleSave = async (updates, section) => {
    try {
      await saveConfig(updates);
      showSaved(section);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleNameChange = (name) => {
    handleSave({ name }, 'profile');
  };

  const handleLanguageChange = (language) => {
    setLang(language);
    handleSave({ language }, 'profile');
  };

  const handleThemeChange = (themeId) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      setTheme(themeId);
      setAccentColor(theme.accent);
      handleSave({ theme: themeId, accentColor: theme.accent }, 'appearance');
    }
  };

  const handleAccentColorChange = (color) => {
    setAccentColor(color);
    handleSave({ accentColor: color }, 'appearance');
  };

  const handleSidebarStyleChange = (sidebarStyle) => {
    handleSave({ sidebarStyle }, 'layout');
  };

  const handleWidgetOrderChange = (widgets) => {
    handleSave({ widgetOrder: widgets, homeWidgets: widgets }, 'layout');
  };

  const handlePageToggle = (pageId, enabled) => {
    const enabledPages = config?.enabledPages || ['home'];
    const newEnabledPages = enabled 
      ? [...enabledPages, pageId]
      : enabledPages.filter(p => p !== pageId);
    handleSave({ enabledPages: newEnabledPages }, 'layout');
  };

  const handleQuickActionToggle = (actionId, enabled) => {
    const quickActions = config?.quickActions || [];
    const newQuickActions = enabled 
      ? [...quickActions, actionId]
      : quickActions.filter(a => a !== actionId);
    handleSave({ quickActions: newQuickActions }, 'layout');
  };

  const handleRedoSetup = async () => {
    if (confirm(t('settings.redoWizard.confirm'))) {
      await saveConfig({ setupComplete: false });
      window.location.reload();
    }
  };

  const moveWidget = (fromIndex, toIndex) => {
    const widgets = [...(config?.widgetOrder || [])];
    const [moved] = widgets.splice(fromIndex, 1);
    widgets.splice(toIndex, 0, moved);
    handleWidgetOrderChange(widgets);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          {t('settings.title')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Configure your OpenClaw Hub experience
        </p>
      </div>

      {/* Profile Section */}
      <SettingsSection 
        title={t('settings.profile')}
        saved={savedIndicator === 'profile'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              Name
            </label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              Language
            </label>
            <select
              value={config.language || 'en'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
            >
              {Object.entries(languages).map(([code, { name, flag }]) => (
                <option key={code} value={code}>
                  {flag} {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection 
        title={t('settings.appearance')}
        saved={savedIndicator === 'appearance'}
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              Theme
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: config.theme === theme.id ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--surface)',
                    borderColor: config.theme === theme.id ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {/* Mini theme preview */}
                  <div
                    className="flex-shrink-0 rounded-md overflow-hidden"
                    style={{ width: 40, height: 28, background: theme.bg, border: `1px solid ${theme.surface}` }}
                  >
                    <div style={{ height: 8, background: theme.surface, borderBottom: `1px solid ${theme.accent}22` }} />
                    <div className="flex gap-1 p-1">
                      <div style={{ width: 8, height: 3, background: theme.accent, borderRadius: 1 }} />
                      <div style={{ width: 12, height: 3, background: `${theme.text}33`, borderRadius: 1 }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                      {t(`theme.${theme.id}`)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t(`theme.${theme.id}.desc`)}
                    </div>
                  </div>
                  {config.theme === theme.id && (
                    <Check size={16} style={{ color: 'var(--accent)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              {t('settings.accentColor')}
            </h4>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleAccentColorChange(color)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: color,
                    borderColor: config.accentColor === color ? 'var(--text)' : 'transparent',
                  }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={config.accentColor || '#D4A853'}
                onChange={(e) => handleAccentColorChange(e.target.value)}
                className="w-8 h-8 rounded-full border-0 cursor-pointer ml-2"
                title="Custom color"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Layout Section */}
      <SettingsSection 
        title={t('settings.layout')}
        saved={savedIndicator === 'layout'}
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              Sidebar Style
            </h4>
            <div className="flex gap-4">
              {['full', 'compact'].map(style => (
                <button
                  key={style}
                  onClick={() => handleSidebarStyleChange(style)}
                  className="flex items-center gap-3 p-3 rounded-lg border-2"
                  style={{
                    background: config.sidebarStyle === style ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--surface)',
                    borderColor: config.sidebarStyle === style ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {t(`sidebar.${style}`)}
                  </span>
                  {config.sidebarStyle === style && (
                    <Check size={16} style={{ color: 'var(--accent)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              {t('settings.widgetOrder')}
            </h4>
            <div className="space-y-2">
              {(config.widgetOrder || []).map((widgetId, index) => (
                <div
                  key={widgetId}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>
                    {t(`widget.${widgetId}`) || widgetId}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveWidget(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 rounded disabled:opacity-30"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveWidget(index, index + 1)}
                      disabled={index === config.widgetOrder.length - 1}
                      className="p-1 rounded disabled:opacity-30"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              {t('settings.togglePages')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PAGE_OPTIONS.map(({ id, key }) => {
                const enabled = (config.enabledPages || []).includes(id);
                return (
                  <label
                    key={id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handlePageToggle(id, e.target.checked)}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {t(key)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* System Section */}
      <SettingsSection title={t('settings.system')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                {t('settings.redoWizard')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Restart setup with current values pre-filled
              </div>
            </div>
            <button
              onClick={handleRedoSetup}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:bg-opacity-80"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <RotateCcw size={16} />
              Redo Setup
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                App Version
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                OpenClaw Hub Phase 2
              </div>
            </div>
            <span className="text-sm px-2 py-1 rounded" style={{ background: 'rgba(var(--accent-rgb), 0.12)', color: 'var(--accent)' }}>
              v2.0.0
            </span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children, saved = false }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        {saved && (
          <span className="text-sm px-2 py-1 rounded-full flex items-center gap-1 animate-fade-in" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
            <Check size={12} />
            {saved && 'Saved'}
          </span>
        )}
      </div>
      <div className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {children}
      </div>
    </div>
  );
}