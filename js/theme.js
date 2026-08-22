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
  VERSION: '1.2.1'
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

    // Update mobile menu theme segments
    const lightSeg = document.getElementById('themeSegmentLight');
    const darkSeg = document.getElementById('themeSegmentDark');
    if (lightSeg && darkSeg) {
      if (theme === 'dark') {
        darkSeg.classList.add('active');
        lightSeg.classList.remove('active');
      } else {
        lightSeg.classList.add('active');
        darkSeg.classList.remove('active');
      }
    }
  }

  /**
   * Dynamically populates all .app-brand-icon, .app-brand-name, and .app-version elements
   * from the single-source-of-truth window.APP_CONFIG.
   */
  function syncAppConfig() {
    const cfg = window.APP_CONFIG || {};
    const icon = cfg.BRAND_ICON || '🏛️';
    const version = cfg.VERSION || '1.2.1';
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
    window.setThemeMode(nextTheme);
  };

  /**
   * Sets explicit theme ('light' | 'dark').
   * @param {string} mode
   */
  window.setThemeMode = function (mode) {
    if (mode !== 'dark' && mode !== 'light') return;
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyTheme(mode);
  };

  /**
   * Toggles the mobile premium hamburger settings dropdown.
   */
  window.toggleMobileMenu = function (e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const dropdown = document.getElementById('mobileMenuDropdown');
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('active');
    if (isOpen) {
      window.closeMobileMenu();
    } else {
      dropdown.style.display = 'block';
      // Force reflow for CSS transition
      dropdown.offsetHeight;
      dropdown.classList.add('active');
      window.syncMobileMenuState();
    }
  };

  /**
   * Closes the mobile premium dropdown.
   */
  window.closeMobileMenu = function () {
    const dropdown = document.getElementById('mobileMenuDropdown');
    if (!dropdown) return;
    dropdown.classList.remove('active');
    setTimeout(() => {
      if (!dropdown.classList.contains('active')) {
        dropdown.style.display = 'none';
      }
    }, 200);
  };

  /**
   * Sets active language from mobile menu ('en' | 'kn').
   * @param {string} locale
   */
  window.setLanguage = function (locale) {
    if (typeof window.i18n !== 'undefined' && typeof window.i18n.applyLocale === 'function') {
      window.i18n.applyLocale(locale);
    } else if (typeof window.I18nManager !== 'undefined' && typeof window.I18nManager.setLocale === 'function') {
      window.I18nManager.setLocale(locale);
    }
    window.syncMobileMenuState();
  };

  /**
   * Synchronizes active state for mobile theme and language segmented controls.
   */
  window.syncMobileMenuState = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const lightSeg = document.getElementById('themeSegmentLight');
    const darkSeg = document.getElementById('themeSegmentDark');
    if (lightSeg && darkSeg) {
      if (currentTheme === 'dark') {
        darkSeg.classList.add('active');
        lightSeg.classList.remove('active');
      } else {
        lightSeg.classList.add('active');
        darkSeg.classList.remove('active');
      }
    }

    const currentLocale = (typeof window.i18n !== 'undefined' && window.i18n.currentLocale)
      ? window.i18n.currentLocale
      : (localStorage.getItem('eplan_locale_preference') || 'en');

    const enSeg = document.getElementById('langSegmentEn');
    const knSeg = document.getElementById('langSegmentKn');
    if (enSeg && knSeg) {
      if (currentLocale === 'kn') {
        knSeg.classList.add('active');
        enSeg.classList.remove('active');
      } else {
        enSeg.classList.add('active');
        knSeg.classList.remove('active');
      }
    }
  };

  // Sync theme and all App Config bindings on DOM load
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(initialTheme);
    syncAppConfig();
    window.syncMobileMenuState();

    // Close mobile dropdown when clicking anywhere outside
    document.addEventListener('click', function (e) {
      const dropdown = document.getElementById('mobileMenuDropdown');
      const trigger = document.getElementById('mobileMenuTrigger');
      if (dropdown && dropdown.classList.contains('active')) {
        if (!dropdown.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
          window.closeMobileMenu();
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        window.closeMobileMenu();
      }
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  });

  // Re-sync segmented controls on language change
  window.addEventListener('localeChanged', function () {
    window.syncMobileMenuState();
  });
})();

