import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useConfig } from './context/ConfigContext';
import { useTheme } from './context/ThemeContext';
import { useI18n } from './context/I18nContext';
import SetupWizard from './pages/SetupWizard';
import Layout from './components/Layout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Services from './pages/Services';
import Activity from './pages/Activity';
import Costs from './pages/Costs';
import Alerts from './pages/Alerts';
import CommandPalette from './components/CommandPalette';

// Stub removed — all pages now implemented

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
    return <SetupWizard initialConfig={config} />;
  }

  return (
    <Layout>
      <CommandPalette />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/costs" element={<Costs />} />

        <Route path="/services" element={<Services />} />
        <Route path="/notifications" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
