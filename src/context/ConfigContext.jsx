import { createContext, useContext, useEffect, useState } from 'react';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config')
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

  const saveConfig = async (updates) => {
    const merged = { ...config, ...updates };
    try {
      const res = await fetch('/api/config', {
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
  };

  return (
    <ConfigContext.Provider value={{ config, setConfig, saveConfig, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
