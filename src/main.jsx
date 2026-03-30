import React from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import ReactDOM from 'react-dom/client';

// Expose React globally for plugin modules
window.React = React;
window.ReactJSXRuntime = ReactJSXRuntime;
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ConfigProvider } from './context/ConfigContext';
import { I18nProvider } from './context/I18nContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider>
        <ThemeProvider>
          <I18nProvider>
            <App />
          </I18nProvider>
        </ThemeProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
