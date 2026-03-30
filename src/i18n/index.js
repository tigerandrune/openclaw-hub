import en from './en.json';
import sv from './sv.json';
import de from './de.json';
import fr from './fr.json';
import es from './es.json';
import pt from './pt.json';
import ja from './ja.json';
import zh from './zh.json';

export const languages = {
  en: { name: 'English', flag: '🇬🇧', strings: en },
  sv: { name: 'Svenska', flag: '🇸🇪', strings: sv },
  de: { name: 'Deutsch', flag: '🇩🇪', strings: de },
  fr: { name: 'Français', flag: '🇫🇷', strings: fr },
  es: { name: 'Español', flag: '🇪🇸', strings: es },
  pt: { name: 'Português', flag: '🇧🇷', strings: pt },
  ja: { name: '日本語', flag: '🇯🇵', strings: ja },
  zh: { name: '中文', flag: '🇨🇳', strings: zh },
};

export const languageCodes = Object.keys(languages);

/**
 * Detect browser language, return matching code or 'en'
 */
export function detectLanguage() {
  const browserLang = navigator.language?.split('-')[0] ?? 'en';
  return languageCodes.includes(browserLang) ? browserLang : 'en';
}

/**
 * Get a translated string. Falls back to English, then to the key itself.
 */
export function getString(lang, key) {
  return languages[lang]?.strings[key] ?? languages.en.strings[key] ?? key;
}
