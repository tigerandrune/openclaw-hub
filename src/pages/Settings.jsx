import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { version as APP_VERSION } from '../../package.json';
import { languages } from '../i18n';
import { Check, ChevronUp, ChevronDown, RotateCcw, Palette, Zap, Plus, Trash2, Users, Download, Upload, Puzzle, AlertTriangle, Eye } from 'lucide-react';

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

  const handleDashboardTitleChange = (dashboardTitle) => {
    handleSave({ dashboardTitle }, 'profile');
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
          {t('settings.configureDesc')}
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
              {t('settings.name')}
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
              placeholder={t('settings.name.placeholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              {t('settings.dashboardTitle')}
            </label>
            <input
              type="text"
              value={config.dashboardTitle || ''}
              onChange={(e) => handleDashboardTitleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
              placeholder={t('settings.dashboardTitle.placeholder')}
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

      {/* Budget Section */}
      <SettingsSection
        title={t('settings.budget')}
        saved={savedIndicator === 'budget'}
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.budget?.enabled || false}
              onChange={(e) => handleSave({
                budget: { ...(config.budget || {}), enabled: e.target.checked }
              }, 'budget')}
              className="w-4 h-4"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {t('settings.budget.enable')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('settings.budget.desc')}
              </div>
            </div>
          </label>

          {config.budget?.enabled && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                {t('settings.budget.amount')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={config.budget?.monthly || ''}
                  onChange={(e) => handleSave({
                    budget: { ...(config.budget || {}), monthly: parseFloat(e.target.value) || 0 }
                  }, 'budget')}
                  className="w-32 px-3 py-2 rounded-lg border bg-transparent"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)'
                  }}
                  placeholder="50"
                />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('settings.budget.perMonth')}
                </span>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Profiles Section */}
      <ProfilesSection t={t} savedIndicator={savedIndicator} />

      {/* Plugins Section */}
      <PluginsSection t={t} config={config} saveConfig={saveConfig} />

      {/* System Section */}
      <SettingsSection title={t('settings.system')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                {t('settings.redoWizard')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('settings.redoWizard.desc')}
              </div>
            </div>
            <button
              onClick={handleRedoSetup}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:bg-opacity-80"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <RotateCcw size={16} />
              {t('settings.redoWizard.button')}
            </button>
          </div>
          
          {/* Export / Import Config */}
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                {t('settings.exportImport')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('settings.exportImportDesc')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `openclaw-hub-config-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <Download size={14} />
                {t('settings.export')}
              </button>
              <label
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <Upload size={14} />
                {t('settings.import')}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const imported = JSON.parse(ev.target.result);
                        if (typeof imported === 'object' && imported !== null) {
                          saveConfig(imported);
                          window.location.reload();
                        }
                      } catch {
                        alert(t('settings.importError'));
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                {t('settings.appVersion')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('settings.appEdition')}
              </div>
            </div>
            <span className="text-sm px-2 py-1 rounded" style={{ background: 'rgba(var(--accent-rgb), 0.12)', color: 'var(--accent)' }}>
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function ProfilesSection({ t }) {
  const { activeProfile, switchProfile } = useConfig();
  const [profiles, setProfiles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadProfiles = () => {
    fetch('/api/profiles')
      .then(r => r.json())
      .then(data => setProfiles(data.profiles || []))
      .catch(() => {});
  };

  useEffect(() => { loadProfiles(); }, [activeProfile]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const id = newName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 32);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName.trim() }),
      });
      if (res.ok) {
        setNewName('');
        setShowCreate(false);
        loadProfiles();
        switchProfile(id);
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleting(null);
        loadProfiles();
      }
    } catch { /* ignore */ }
  };

  // Only show this section if profiles exist (they always will after first load)
  return (
    <SettingsSection title={t('profiles.title')}>
      <div className="space-y-3">
        {profiles.map(p => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-lg border"
            style={{
              background: p.id === activeProfile ? 'var(--surface2)' : 'var(--surface)',
              borderColor: p.id === activeProfile ? 'var(--accent)' : 'var(--border)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: p.id === activeProfile ? 'var(--accent)' : 'var(--border)',
                color: p.id === activeProfile ? '#000' : 'var(--text-muted)',
              }}
            >
              {p.avatar || p.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {p.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {p.id === activeProfile ? t('profiles.active') : p.id}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.id !== activeProfile && (
                <button
                  onClick={() => switchProfile(p.id)}
                  className="text-xs px-2 py-1 rounded border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {t('profiles.switch')}
                </button>
              )}
              {p.id !== 'default' && p.id !== activeProfile && (
                deleting === p.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: '#ef4444', color: '#fff' }}
                    >
                      {t('profiles.delete')}
                    </button>
                    <button
                      onClick={() => setDeleting(null)}
                      className="text-xs px-2 py-1 rounded border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      {t('profiles.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleting(p.id)}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title={t('profiles.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                )
              )}
            </div>
          </div>
        ))}

        {/* Create new profile */}
        {showCreate ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t('profiles.namePlaceholder')}
              className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              {t('profiles.create')}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(''); }}
              className="px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {t('profiles.cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed transition-colors cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <Plus size={16} />
            <span className="text-sm">{t('profiles.new')}</span>
          </button>
        )}
      </div>
    </SettingsSection>
  );
}

function PluginsSection({ t, config, saveConfig }) {
  const { data: plugins, loading } = useApi('/api/plugins', { refreshInterval: 10000 });
  const widgetOrder = config?.widgetOrder || config?.homeWidgets || [];

  const isOnHome = (pluginId) => widgetOrder.includes(`plugin:${pluginId}`);

  const togglePlugin = (pluginId) => {
    const key = `plugin:${pluginId}`;
    if (widgetOrder.includes(key)) {
      // Remove from home
      const newOrder = widgetOrder.filter(id => id !== key);
      saveConfig({ widgetOrder: newOrder, homeWidgets: newOrder });
    } else {
      // Add to home
      const newOrder = [...widgetOrder, key];
      saveConfig({ widgetOrder: newOrder, homeWidgets: newOrder });
    }
  };

  return (
    <SettingsSection title={t('settings.plugins')}>
      {/* Warning banner */}
      <div
        className="flex items-start gap-3 p-3 rounded-lg border mb-4"
        style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
      >
        <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('plugins.warning')}
        </p>
      </div>

      {loading && !plugins ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : !plugins?.length ? (
        <div className="text-center py-8">
          <Puzzle size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('plugins.none')}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            {t('plugins.installHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plugins.map(plugin => {
            const active = isOnHome(plugin.id);
            return (
              <div
                key={plugin.id}
                className="p-4 rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: active ? 'var(--accent)' : 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)' }}
                  >
                    {plugin.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {plugin.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        v{plugin.version}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {plugin.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                        {plugin.author}
                      </span>
                      {plugin.permissions.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                          {plugin.permissions.length} permission{plugin.permissions.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {plugin.permissions.length === 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                          {t('plugins.noPermissions')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                    style={{
                      background: active ? 'rgba(239,68,68,0.1)' : 'rgba(var(--accent-rgb), 0.15)',
                      color: active ? '#ef4444' : 'var(--accent)',
                    }}
                  >
                    {active ? t('plugins.remove') : t('plugins.addToHome')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SettingsSection>
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