import { useState, useEffect, useRef } from 'react';
import { FileText, Save, Check } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { useI18n } from '../../context/I18nContext';

export default function NotesWidget() {
  const { config, saveConfig } = useConfig();
  const { t } = useI18n();
  const [text, setText] = useState(config?.notes ?? '');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setText(config?.notes ?? '');
  }, [config?.notes]);

  const handleChange = (val) => {
    setText(val);
    setDirty(true);
    setSaved(false);
    // Auto-save after 1.2s of no typing
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSave(val);
    }, 1200);
  };

  const doSave = async (val) => {
    try {
      await saveConfig({ notes: val });
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div className="widget-card surface p-5 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(var(--accent-rgb), 0.12)' }}>
            <FileText size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('widget.notes')}</span>
        </div>
        <div className="flex items-center gap-1">
          {saved && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <Check size={12} /> {t('widget.notes.saved')}
            </span>
          )}
          {dirty && !saved && (
            <button
              onClick={() => doSave(text)}
              className="p-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--accent)' }}
              title="Save now"
            >
              <Save size={13} />
            </button>
          )}
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder={t('widget.notes.placeholder')}
        className="resize-none text-sm leading-relaxed outline-none bg-transparent w-full font-mono"
        style={{
          color: 'var(--text)',
          minHeight: 100,
          caretColor: 'var(--accent)',
        }}
        rows={5}
      />

      <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
        {t('widget.notes.autosave')}
      </p>
    </div>
  );
}
