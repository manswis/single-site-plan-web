/**
 * @file theme.js
 * @description Automatic Dark & Light mode theme manager for BBMP e-Plan Studio.
 * Detects browser preference by default and allows persistent user toggling via navbar icon.
 */

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

  // Sync toggle icons on DOM ready and listen for OS system theme changes
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(initialTheme);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  });
})();
