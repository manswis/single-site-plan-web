/**
 * @file theme.js
 * @description Automatic Dark & Light mode theme manager and Centralized App Configuration for e-Plan Studio.
 * Detects browser preference by default, allows persistent user toggling via navbar icon,
 * and maintains single-source-of-truth brand identity, name, and version across all pages.
 */

// ============================================================================
// 1. SINGLE SOURCE OF TRUTH (Edit here to change across all pages)
// ============================================================================
window.APP_CONFIG = {
  BRAND_ICON: '🏛️',
  BRAND_NAME: 'e-Plan Studio',
  VERSION: '1.2.0'
};

(function () {
  const THEME_STORAGE_KEY = 'eplan_theme_preference';

  /**
   * Gets the preferred theme (User preference > Browser prefers-color-scheme > 'light').
   * @returns {string} 'dark' or 'light'
   */
  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Applies the theme to document element and updates toggle button icons.
   * @param {string} theme - 'dark' or 'light'
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.innerHTML = `<span class="material-symbols-outlined">${theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>`;
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
      btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
    });
  }

  /**
   * Dynamically populates all .app-brand-icon, .app-brand-name, and .app-version elements
   * from the single-source-of-truth window.APP_CONFIG.
   */
  function syncAppConfig() {
    const cfg = window.APP_CONFIG || {};
    const icon = cfg.BRAND_ICON || '🏛️';
    const version = cfg.VERSION || '1.2.0';
    const name = cfg.BRAND_NAME || 'e-Plan Studio';

    // 1. Synchronize Brand Icons
    document.querySelectorAll('.app-brand-icon').forEach(el => {
      el.textContent = icon;
    });

    // 2. Synchronize Brand Names
    document.querySelectorAll('.app-brand-name').forEach(el => {
      el.textContent = name;
    });

    // 3. Synchronize App Version Tags
    document.querySelectorAll('.app-version').forEach(el => {
      el.textContent = version;
    });
  }

  // Immediately apply initial theme to avoid flash of wrong theme (FOUC)
  const initialTheme = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', initialTheme);

  /**
   * Toggles theme between dark and light and saves preference.
   */
  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  // Sync theme and all App Config bindings on DOM load
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(initialTheme);
    syncAppConfig();

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  });
})();
