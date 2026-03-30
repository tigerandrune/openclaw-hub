import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ConfigContext = createContext(null);

function getActiveProfile() {
  // 1. URL param takes priority
  const params = new URLSearchParams(window.location.search);
  const urlProfile = params.get('profile');
  if (urlProfile) {
    localStorage.setItem('openclaw-hub-profile', urlProfile);
    return urlProfile;
  }
  // 2. localStorage
  return localStorage.getItem('openclaw-hub-profile') || 'default';
}

function configUrl(profile) {
  if (!profile || profile === 'default') return '/api/config';
  return `/api/config?profile=${encodeURIComponent(profile)}`;
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState(getActiveProfile);

  const loadConfig = useCallback((profileId) => {
    setLoading(true);
    fetch(configUrl(profileId))
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        setConfig({ setupComplete: false });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadConfig(activeProfile);
  }, [activeProfile, loadConfig]);

  const saveConfig = useCallback(async (updates) => {
    const merged = { ...config, ...updates };
    try {
      const res = await fetch(configUrl(activeProfile), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      const { config: saved } = await res.json();
      setConfig(saved);
      return saved;
    } catch (err) {
      console.error('Failed to save config:', err);
      throw err;
    }
  }, [config, activeProfile]);

  const switchProfile = useCallback((profileId) => {
    localStorage.setItem('openclaw-hub-profile', profileId);
    setActiveProfile(profileId);
    // loadConfig will fire via useEffect
  }, []);

  return (
    <ConfigContext.Provider value={{
      config,
      setConfig,
      saveConfig,
      loading,
      activeProfile,
      switchProfile,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
