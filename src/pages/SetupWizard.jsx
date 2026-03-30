import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { languages, detectLanguage } from '../i18n';
import {
  ArrowRight, ArrowLeft, Check, Cpu, Activity,
  DollarSign, Layout, Server, FileText, Zap,
  AlignLeft, AlignJustify, Sparkles, Radio,
} from 'lucide-react';

// ── Step data ─────────────────────────────────────────────────────────────────

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

const WIDGETS = [
  { id: 'health',   label: 'System Health',    icon: Cpu,        desc: 'CPU, memory, disk usage' },
  { id: 'gateway',  label: 'Gateway Status',   icon: Zap,        desc: 'AI gateway online/offline' },
  { id: 'activity', label: 'Recent Activity',  icon: Activity,   desc: 'Last sessions and events' },
  { id: 'notes',    label: 'Quick Notes',      icon: FileText,   desc: 'Personal scratchpad' },
  { id: 'costs',    label: 'Cost Summary',     icon: DollarSign, desc: 'Spending at a glance' },
  { id: 'services', label: 'Services',         icon: Server,     desc: 'PM2 processes and plugins' },
  { id: 'bookmarks', label: 'Bookmarks',       icon: FileText,   desc: 'Quick-access links' },
  { id: 'heatmap',   label: 'Activity Heatmap', icon: Activity,   desc: 'GitHub-style activity grid' },
  { id: 'channels',  label: 'Active Channels',  icon: Radio,      desc: 'Connected messaging platforms' },
  { id: 'model',     label: 'Current Model',    icon: Cpu,        desc: 'AI model and fallback chain' },
];

// ── Wizard slide variants ─────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
};

const transition = { type: 'spring', stiffness: 380, damping: 38 };

// ── Sub-components ────────────────────────────────────────────────────────────

function StepShell({ children, title, subtitle }) {
  return (
    <div className="w-full max-w-lg mx-auto px-2">
      <div className="mb-8">
        <h2
          className="text-2xl font-bold mb-2 leading-tight"
          style={{ color: 'var(--text)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// Step 1 – Name
function StepName({ value, onChange }) {
  const { t } = useI18n();
  const greetingKey = `greeting.${getTimeOfDay()}`;
  return (
    <StepShell
      title={t('setup.step1.title')}
      subtitle={t('setup.step1.subtitle')}
    >
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t('setup.step1.placeholder') + '…'}
          autoFocus
          className="w-full px-5 py-4 text-lg rounded-xl border-2 bg-transparent outline-none transition-all"
          style={{
            background: 'var(--surface)',
            borderColor: value ? 'var(--accent)' : 'var(--border)',
            color: 'var(--text)',
            fontFamily: 'Inter, sans-serif',
          }}
          maxLength={40}
        />
        {value && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--accent)' }}
          >
            <Check size={18} />
          </span>
        )}
      </div>
      {value && (
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t(greetingKey)},{' '}
          <strong style={{ color: 'var(--accent)' }}>{value}</strong>. {t('setup.step1.preview')}
        </p>
      )}
    </StepShell>
  );
}

// Step 2 – Language
function StepLanguage({ value, onChange }) {
  const { setLang, t } = useI18n();

  const handleSelect = (code) => {
    onChange(code);
    setLang(code);
  };

  return (
    <StepShell
      title={t('setup.step2.title')}
      subtitle={t('setup.step2.subtitle')}
    >
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(languages).map(([code, { name, flag }]) => {
          const active = value === code;
          return (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]"
              style={{
                background: active ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{flag}</span>
              <span className="text-sm font-medium flex-1" style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                {name}
              </span>
              {active && (
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
                  <Check size={10} color="#000" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

// Step 3 – Theme
function StepTheme({ value, accentColor, onTheme, onAccent }) {
  const { t } = useI18n();
  return (
    <StepShell
      title={t('setup.step3.title')}
      subtitle={t('setup.step3.subtitle')}
    >
      <div className="flex flex-col gap-3">
        {THEMES.map(th => (
          <button
            key={th.id}
            onClick={() => onTheme(th.id, th.accent)}
            className="relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01]"
            style={{
              background: value === th.id ? `${th.surface}` : 'var(--surface)',
              borderColor: value === th.id ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer',
            }}
          >
            {/* Mini theme preview */}
            <div
              className="flex-shrink-0 rounded-lg overflow-hidden"
              style={{ width: 52, height: 36, background: th.bg, border: `1px solid ${th.surface}` }}
            >
              <div style={{ height: 10, background: th.surface, borderBottom: `1px solid ${th.accent}22` }} />
              <div className="flex gap-1 p-1">
                <div style={{ width: 12, height: 4, background: th.accent, borderRadius: 2 }} />
                <div style={{ width: 18, height: 4, background: `${th.text}33`, borderRadius: 2 }} />
              </div>
              <div className="px-1">
                <div style={{ width: '80%', height: 3, background: `${th.text}22`, borderRadius: 2 }} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{t(`theme.${th.id}`)}</span>
                {th.frost && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${th.frost}20`, color: th.frost, fontSize: 10 }}>
                    {t('theme.norse')}
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t(`theme.${th.id}.desc`)}</span>
            </div>
            {value === th.id && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <Check size={12} color="#000" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Accent color */}
      <div className="mt-5 flex items-center gap-3">
        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {t('setup.step3.accent')}
        </label>
        <div className="flex items-center gap-2">
          {['#D4A853', '#7c3aed', '#06b6d4', '#22c55e', '#f97316', '#ec4899'].map(c => (
            <button
              key={c}
              onClick={() => onAccent(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: accentColor === c ? 'var(--text)' : 'transparent',
              }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={e => onAccent(e.target.value)}
            className="w-6 h-6 rounded-full border-0 cursor-pointer"
            style={{ background: 'transparent', padding: 0 }}
            title="Custom color"
          />
        </div>
      </div>
    </StepShell>
  );
}

// Step 3 – Widgets
function StepWidgets({ enabled, onToggle }) {
  const { t } = useI18n();
  const WIDGET_KEYS = {
    health: 'widget.health',
    gateway: 'widget.gateway.label',
    activity: 'widget.activity',
    notes: 'widget.notesLabel',
    costs: 'widget.costs',
    services: 'widget.services',
  };
  const WIDGET_DESC_KEYS = {
    health: 'widget.health.desc',
    gateway: 'widget.gateway.desc',
    activity: 'widget.activity.desc',
    notes: 'widget.notes.desc',
    costs: 'widget.costs.desc',
    services: 'widget.services.desc',
  };
  return (
    <StepShell
      title={t('setup.step4.title')}
      subtitle={t('setup.step4.subtitle')}
    >
      <div className="grid grid-cols-2 gap-3">
        {WIDGETS.map(w => {
          const Icon = w.icon;
          const active = enabled.includes(w.id);
          return (
            <button
              key={w.id}
              onClick={() => onToggle(w.id)}
              className="flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]"
              style={{
                background: active ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: active ? 'rgba(var(--accent-rgb), 0.15)' : 'var(--surface2)' }}
                >
                  <Icon size={15} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                </div>
                {active && (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                    <Check size={10} color="#000" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                  {t(WIDGET_KEYS[w.id]) || w.label}
                </div>
                <div className="text-xs leading-tight mt-0.5" style={{ color: 'var(--text-muted)', fontSize: 11, opacity: 0.8 }}>
                  {t(WIDGET_DESC_KEYS[w.id]) || w.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

// Step 4 – Sidebar style
function StepSidebar({ value, onChange }) {
  const { t } = useI18n();
  const options = [
    {
      id: 'full',
      label: t('sidebar.full'),
      desc: t('sidebar.full.desc'),
      icon: AlignJustify,
      preview: (
        <div className="flex flex-col gap-1 p-2" style={{ width: 90, background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
          {['Home', 'Activity', 'Tasks'].map(l => (
            <div key={l} className="flex items-center gap-1.5 px-1.5 py-1 rounded" style={{ background: l === 'Home' ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l === 'Home' ? 'var(--accent)' : 'var(--text-muted)', opacity: l === 'Home' ? 1 : 0.4 }} />
              <div style={{ width: 30, height: 4, borderRadius: 2, background: l === 'Home' ? 'var(--text)' : 'var(--text-muted)', opacity: l === 'Home' ? 0.8 : 0.3 }} />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'compact',
      label: t('sidebar.compact'),
      desc: t('sidebar.compact.desc'),
      icon: AlignLeft,
      preview: (
        <div className="flex flex-col gap-1 p-2" style={{ width: 44, background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
          {[true, false, false].map((active, i) => (
            <div key={i} className="flex items-center justify-center p-1.5 rounded" style={{ background: active ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: active ? 'var(--accent)' : 'var(--text-muted)', opacity: active ? 1 : 0.4 }} />
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <StepShell
      title={t('setup.step5.title')}
      subtitle={t('setup.step5.subtitle')}
    >
      <div className="flex gap-4">
        {options.map(opt => {
          const Icon = opt.icon;
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className="flex-1 flex flex-col items-center gap-4 p-5 rounded-xl border-2 transition-all"
              style={{
                background: active ? 'rgba(var(--accent-rgb), 0.06)' : 'var(--surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center justify-center">{opt.preview}</div>
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <span className="text-sm font-semibold" style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                    {opt.label}
                  </span>
                  {active && <Check size={13} style={{ color: 'var(--accent)' }} />}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

// Step 5 – Summary
function StepProfiles({ value, onChange }) {
  const { t } = useI18n();
  const options = [
    {
      id: false,
      label: t('setup.profiles.justMe'),
      desc: t('setup.profiles.justMeDesc'),
      icon: '👤',
    },
    {
      id: true,
      label: t('setup.profiles.multiUser'),
      desc: t('setup.profiles.multiUserDesc'),
      icon: '👥',
    },
  ];

  return (
    <StepShell
      title={t('setup.profiles.title')}
      subtitle={t('setup.profiles.subtitle')}
    >
      <div className="flex flex-col gap-3">
        {options.map(opt => {
          const selected = value === opt.id;
          return (
            <button
              key={String(opt.id)}
              onClick={() => onChange(opt.id)}
              className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left cursor-pointer bg-transparent"
              style={{
                borderColor: selected ? 'var(--accent)' : 'var(--border)',
                background: selected ? 'rgba(var(--accent-rgb), 0.06)' : 'var(--surface)',
              }}
            >
              <span className="text-2xl flex-shrink-0">{opt.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {opt.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {opt.desc}
                </div>
              </div>
              {selected && (
                <Check size={18} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
        {t('setup.profiles.changeLater')}
      </p>
    </StepShell>
  );
}

function StepSummary({ wizardState }) {
  const { t } = useI18n();
  const enabledWidgets = WIDGETS.filter(w => wizardState.widgets.includes(w.id));
  const WIDGET_KEYS = {
    health: 'widget.health',
    gateway: 'widget.gateway.label',
    activity: 'widget.activity',
    notes: 'widget.notesLabel',
    costs: 'widget.costs',
    services: 'widget.services',
  };

  return (
    <StepShell
      title={t('setup.step7.title')}
      subtitle={t('setup.step7.subtitle')}
    >
      <div className="flex flex-col gap-3">
        <SummaryRow label={t('setup.summary.name')} value={wizardState.name} />
        <SummaryRow label={t('setup.summary.language')} value={languages[wizardState.language]?.name ?? wizardState.language} />
        <SummaryRow label={t('setup.summary.theme')} value={t(`theme.${wizardState.theme}`)} />
        <SummaryRow label={t('setup.summary.sidebar')} value={wizardState.sidebarStyle === 'full' ? t('sidebar.full') : t('sidebar.compact')} />
        <SummaryRow
          label={t('setup.summary.widgets')}
          value={
            <div className="flex flex-wrap gap-1.5">
              {enabledWidgets.map(w => (
                <span
                  key={w.id}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(var(--accent-rgb), 0.12)', color: 'var(--accent)' }}
                >
                  {t(WIDGET_KEYS[w.id]) || w.label}
                </span>
              ))}
            </div>
          }
        />
      </div>

      <div className="mt-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(var(--accent-rgb), 0.06)', border: '1px solid rgba(var(--accent-rgb), 0.15)' }}>
        <Sparkles size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('setup.step7.privacy')}
        </p>
      </div>
    </StepShell>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs font-medium w-16 flex-shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-sm font-medium flex-1" style={{ color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

// ── Main wizard ───────────────────────────────────────────────────────────────

const STEPS = ['Name', 'Language', 'Theme', 'Widgets', 'Sidebar', 'Profiles', 'Summary'];

export default function SetupWizard({ initialConfig = null }) {
  const { saveConfig, config } = useConfig();
  const { setTheme, setAccentColor } = useTheme();
  
  // Use initial config (for redo flow) or current config or defaults
  const initial = initialConfig || config || {};

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  const [wizState, setWizState] = useState({
    name: initial.name || '',
    language: initial.language || detectLanguage(),
    theme: initial.theme || 'dark',
    accentColor: initial.accentColor || '#D4A853',
    widgets: initial.homeWidgets || initial.widgetOrder || ['health', 'gateway', 'notes', 'activity', 'bookmarks', 'heatmap', 'channels', 'model'],
    sidebarStyle: initial.sidebarStyle || 'full',
    multiUser: false,
  });

  const canAdvance = () => {
    if (step === 0) return wizState.name.trim().length > 0;
    return true;
  };

  const go = (delta) => {
    setDir(delta);
    setStep(s => s + delta);
  };

  const handleTheme = (id, defaultAccent) => {
    setWizState(s => ({ ...s, theme: id, accentColor: defaultAccent }));
    setTheme(id);
    setAccentColor(defaultAccent);
  };

  const handleAccent = (color) => {
    setWizState(s => ({ ...s, accentColor: color }));
    setAccentColor(color);
  };

  const handleWidget = (id) => {
    setWizState(s => ({
      ...s,
      widgets: s.widgets.includes(id)
        ? s.widgets.filter(w => w !== id)
        : [...s.widgets, id],
    }));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveConfig({
        name: wizState.name.trim(),
        language: wizState.language,
        theme: wizState.theme,
        accentColor: wizState.accentColor,
        sidebarStyle: wizState.sidebarStyle,
        homeWidgets: wizState.widgets,
        widgetOrder: wizState.widgets,
        enabledPages: ['home', 'activity', 'costs', 'services', 'notifications'],
        setupComplete: true,
        notes: '',
        quickActions: [],
        bookmarks: [],
      });

      // If multi-user enabled, ensure profiles are set up
      if (wizState.multiUser) {
        try {
          // Create default profile with current user's name
          await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'default', name: wizState.name.trim() }),
          });
        } catch { /* profile may already exist */ }
      }
      // ConfigContext reload will re-render App → main layout
      window.location.reload();
    } catch {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <StepName
          value={wizState.name}
          onChange={v => setWizState(s => ({ ...s, name: v }))}
        />
      );
      case 1: return (
        <StepLanguage
          value={wizState.language}
          onChange={v => setWizState(s => ({ ...s, language: v }))}
        />
      );
      case 2: return (
        <StepTheme
          value={wizState.theme}
          accentColor={wizState.accentColor}
          onTheme={handleTheme}
          onAccent={handleAccent}
        />
      );
      case 3: return (
        <StepWidgets
          enabled={wizState.widgets}
          onToggle={handleWidget}
        />
      );
      case 4: return (
        <StepSidebar
          value={wizState.sidebarStyle}
          onChange={v => setWizState(s => ({ ...s, sidebarStyle: v }))}
        />
      );
      case 5: return (
        <StepProfiles
          value={wizState.multiUser}
          onChange={v => setWizState(s => ({ ...s, multiUser: v }))}
        />
      );
      case 6: return <StepSummary wizardState={wizState} />;
      default: return null;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="w-full max-w-lg mx-auto mb-10">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-mono uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            OpenClaw Hub
          </span>
        </div>
        <div className="accent-line w-24" />
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg" style={{ minHeight: 340, position: 'relative' }}>
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 my-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              background: i === step ? 'var(--accent)' : i < step ? 'rgba(var(--accent-rgb), 0.4)' : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <NavButtons step={step} totalSteps={STEPS.length} canAdvance={canAdvance()} saving={saving} onBack={() => go(-1)} onNext={() => canAdvance() && go(1)} onFinish={handleFinish} />
    </div>
  );
}

function NavButtons({ step, totalSteps, canAdvance, saving, onBack, onNext, onFinish }) {
  const { t } = useI18n();
  return (
    <div className="w-full max-w-lg flex items-center justify-between">
      {step > 0 ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={15} />
          {t('setup.back')}
        </button>
      ) : (
        <div />
      )}

      {step < totalSteps - 1 ? (
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: canAdvance ? 'var(--accent)' : 'var(--surface2)',
            color: canAdvance ? '#000' : 'var(--text-muted)',
            cursor: canAdvance ? 'pointer' : 'not-allowed',
            opacity: canAdvance ? 1 : 0.5,
          }}
        >
          {t('setup.continue')}
          <ArrowRight size={15} />
        </button>
      ) : (
        <button
          onClick={onFinish}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{
            background: saving ? 'var(--surface2)' : 'var(--accent)',
            color: saving ? 'var(--text-muted)' : '#000',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('setup.saving')}
            </>
          ) : (
            <>
              <Sparkles size={15} />
              {t('setup.letsgo')}
            </>
          )}
        </button>
      )}
    </div>
  );
}
