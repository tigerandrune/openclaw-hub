import { useConfig } from '../context/ConfigContext';
import { useI18n } from '../context/I18nContext';
import SystemHealthWidget from '../components/widgets/SystemHealthWidget';
import GatewayWidget from '../components/widgets/GatewayWidget';
import NotesWidget from '../components/widgets/NotesWidget';
import RecentActivityWidget from '../components/widgets/RecentActivityWidget';

const WIDGET_MAP = {
  health:   SystemHealthWidget,
  gateway:  GatewayWidget,
  notes:    NotesWidget,
  activity: RecentActivityWidget,
};

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 5)  return 'greeting.night';
  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  if (h < 21) return 'greeting.evening';
  return 'greeting.night';
}

export default function Home() {
  const { config } = useConfig();
  const { t, lang } = useI18n();
  const widgetOrder = config?.widgetOrder ?? config?.homeWidgets ?? ['health', 'gateway', 'notes', 'activity'];
  const enabledWidgets = widgetOrder.filter(id => WIDGET_MAP[id]);

  const greeting = config?.name
    ? `${t(getGreetingKey())}, ${config.name}`
    : t(getGreetingKey());

  const subline = new Date().toLocaleDateString(lang, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex flex-col gap-1 pt-2">
        <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
          {greeting} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {subline} · {t('home.subtitle')}
        </p>
      </div>

      {/* Widget grid */}
      <div className="widget-grid">
        {enabledWidgets.map(id => {
          const Widget = WIDGET_MAP[id];
          return <Widget key={id} />;
        })}
      </div>

      {enabledWidgets.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border"
          style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No widgets enabled.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Go to Settings → re-run setup to pick widgets.
          </p>
        </div>
      )}
    </div>
  );
}
