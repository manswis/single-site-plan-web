/**
 * @file theme.js
 * @description Automatic Dark & Light mode theme manager and Centralized App Brand Configuration for e-Plan Studio.
 * Detects browser preference by default, allows persistent user toggling via navbar icon,
 * and maintains a centralized brand icon and identity across all pages.
 */

// ============================================================================
// 1. CENTRALIZED BRAND CONFIGURATION (Change here to effect everywhere)
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
   * Synchronizes centralized brand icon to all .app-brand-icon elements across the DOM
   */
  function syncBrandIcons() {
    const icon = (window.APP_CONFIG && window.APP_CONFIG.BRAND_ICON) ? window.APP_CONFIG.BRAND_ICON : '🏛️';
    const brandElements = document.querySelectorAll('.app-brand-icon');
    brandElements.forEach(el => {
      el.textContent = icon;
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

  // Sync toggle icons and brand icons on DOM ready and listen for OS system theme changes
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(initialTheme);
    syncBrandIcons();

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  });
})();
