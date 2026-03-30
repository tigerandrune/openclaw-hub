import { useState, useEffect } from 'react';
import { useTheme, useConfig, useTranslations } from '@openclaw-hub/api';

const i18n = {
  en: { title: 'Clock', format12: '12-hour', format24: '24-hour' },
  sv: { title: 'Klocka', format12: '12-timmar', format24: '24-timmar' },
  de: { title: 'Uhr', format12: '12-Stunden', format24: '24-Stunden' },
  fr: { title: 'Horloge', format12: '12 heures', format24: '24 heures' },
  es: { title: 'Reloj', format12: '12 horas', format24: '24 horas' },
  pt: { title: 'Relógio', format12: '12 horas', format24: '24 horas' },
  ja: { title: '時計', format12: '12時間', format24: '24時間' },
  zh: { title: '时钟', format12: '12小时', format24: '24小时' },
};

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [config] = useConfig('clock');
  const theme = useTheme();
  const t = useTranslations(i18n);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatted = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: config.format === '12h',
  });

  const dateStr = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <div style={{
        color: theme.accent,
        fontSize: '2rem',
        fontWeight: 'bold',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.05em',
      }}>
        {formatted}
      </div>
      <div style={{
        color: theme.muted,
        fontSize: '0.75rem',
        marginTop: '0.25rem',
      }}>
        {dateStr}
      </div>
    </div>
  );
}
