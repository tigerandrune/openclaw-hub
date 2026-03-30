import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useConfig } from './context/ConfigContext';
import { useTheme } from './context/ThemeContext';
import { useI18n } from './context/I18nContext';
import SetupWizard from './pages/SetupWizard';
import Layout from './components/Layout';
import Home from './pages/Home';

// Stub pages — Phase 2
function StubPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-fade-in">
      <div className="text-4xl opacity-20">🚧</div>
      <h2 className="text-xl font-semibold text-muted">{title}</h2>
      <p className="text-sm text-muted opacity-60">Coming in Phase 2</p>
    </div>
  );
}

export default function App() {
  const { config, loading } = useConfig();
  const { applyFromConfig } = useTheme();
  const { setLang } = useI18n();

  useEffect(() => {
    if (config) applyFromConfig(config);
  }, [config]);

  useEffect(() => {
    if (config?.language) setLang(config.language);
  }, [config?.language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted">Loading OpenClaw Hub…</span>
        </div>
      </div>
    );
  }

  if (!config?.setupComplete) {
    return <SetupWizard />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activity" element={<StubPage title="Activity" />} />
        <Route path="/costs" element={<StubPage title="Costs" />} />
        <Route path="/kanban" element={<StubPage title="Tasks" />} />
        <Route path="/services" element={<StubPage title="Services" />} />
        <Route path="/notifications" element={<StubPage title="Notifications" />} />
        <Route path="/settings" element={<StubPage title="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
