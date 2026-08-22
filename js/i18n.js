/**
 * @file i18n.js
 * @description Single-Responsibility Internationalization (i18n) Engine for e-Plan Studio.
 * Provides ARB-style message lookup, parameter interpolation, declarative DOM binding,
 * and synchronized language switcher state management across desktop and mobile viewports.
 */

import { en } from './i18n/en.js';
import { kn } from './i18n/kn.js';

export const LOCALE_STORAGE_KEY = 'eplan_locale_preference';
export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'kn'];

export class I18nManager {
  constructor() {
    this.catalog = { en, kn };
    this.currentLocale = this._resolveInitialLocale();
  }

  /**
   * Initializes the manager, performs initial DOM translation, and binds event listeners.
   */
  init() {
    this.applyLocale(this.currentLocale, false);
    this._bindLanguageToggles();
  }

  /**
   * Translates a message key into the active locale with optional parameter interpolation.
   * Gracefully falls back to English, then to the key itself if not found.
   * 
   * @param {string} key - Dot-delimited ARB key (e.g. 'step1.ownerName.label')
   * @param {Record<string, string|number>} [params] - Replacement variables (e.g. {time: '12:00'})
   * @returns {string} The translated and interpolated text string.
   */
  t(key, params = {}) {
    if (!key || typeof key !== 'string') return '';

    const localeMessages = this.catalog[this.currentLocale] || this.catalog[DEFAULT_LOCALE];
    const fallbackMessages = this.catalog[DEFAULT_LOCALE];

    let template = localeMessages[key] !== undefined ? localeMessages[key] : fallbackMessages[key];
    if (template === undefined) {
      template = key;
    }

    if (params && typeof params === 'object') {
      Object.keys(params).forEach(paramKey => {
        template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      });
    }

    return template;
  }

  /**
   * Switches the active language, translates the DOM, updates UI toggles, and persists setting.
   * 
   * @param {string} locale - Target locale ('en' | 'kn')
   * @param {boolean} [persist=true] - Whether to save to localStorage
   */
  applyLocale(locale, persist = true) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      locale = DEFAULT_LOCALE;
    }

    this.currentLocale = locale;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale);
    }

    if (persist && typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch (err) {
        console.warn('Could not persist locale preference:', err);
      }
    }

    if (typeof document !== 'undefined') {
      this.translateDOM();
      this._updateToggleButtonsUI();
    }

    // Broadcast change for other CAD components (Wizard, Renderer, UI)
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: this.currentLocale } }));
    }
  }

  /**
   * Scans and updates all declarative translation elements in the DOM.
   * 
   * @param {Element|Document} [root] - Subtree to translate
   */
  translateDOM(root) {
    if (!root) {
      if (typeof document !== 'undefined') {
        root = document;
      } else {
        return;
      }
    }
    if (typeof root.querySelectorAll !== 'function') return;

    // 1. Text Content
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // 2. Placeholders
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // 3. Tooltips & Titles
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // 4. HTML Content (Safe markup)
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        el.innerHTML = this.t(key);
      }
    });
  }

  /**
   * Toggles between English and Kannada.
   */
  toggleLanguage() {
    const nextLocale = this.currentLocale === 'en' ? 'kn' : 'en';
    this.applyLocale(nextLocale, true);
  }

  // --- Private Helpers ---

  _resolveInitialLocale() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (saved && SUPPORTED_LOCALES.includes(saved)) {
          return saved;
        }
      } catch (e) {
        // Storage unavailable
      }
    }

    const browserLang = (typeof navigator !== 'undefined' ? (navigator.language || navigator.userLanguage || '') : '').toLowerCase();
    return browserLang.startsWith('kn') ? 'kn' : DEFAULT_LOCALE;
  }

  _bindLanguageToggles() {
    if (typeof document === 'undefined') return;

    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.onclick = () => this.toggleLanguage();
    });

    // Bind contextual helper chips if present
    document.querySelectorAll('.assistant-lang-switch').forEach(btn => {
      btn.onclick = () => this.toggleLanguage();
    });
  }

  _updateToggleButtonsUI() {
    if (typeof document === 'undefined') return;

    const isEn = this.currentLocale === 'en';
    const targetLabel = isEn ? 'ಕನ್ನಡ' : 'English';
    const targetTitle = isEn ? 'Switch to Kannada (ಕನ್ನಡ)' : 'Switch to English';

    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.setAttribute('title', targetTitle);
      btn.setAttribute('aria-label', targetTitle);
      const labelEl = btn.querySelector('.lang-btn-text');
      if (labelEl) {
        labelEl.textContent = targetLabel;
      }
    });

    // Update Step 1 Contextual Assistant Banner
    const assistantPrompt = document.getElementById('assistantLangPrompt');
    const assistantAction = document.getElementById('assistantLangAction');
    if (assistantPrompt && assistantAction) {
      assistantPrompt.textContent = this.t(isEn ? 'assistant.kannadaPrompt' : 'assistant.englishPrompt');
      assistantAction.textContent = this.t(isEn ? 'assistant.kannadaAction' : 'assistant.englishAction');
    }
  }
}

// Global Singleton Instance
export const i18n = new I18nManager();
if (typeof window !== 'undefined') {
  window.i18n = i18n;
  window.t = (key, params) => i18n.t(key, params);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
  });
}
