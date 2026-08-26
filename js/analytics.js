/**
 * @file analytics.js
 * @description Zero-privacy-intrusion live stats counter for e-Plan Studio.
 * Features multi-tier edge API sync, local client caching, and CountAPI fallback.
 * Automatically displays cached/baseline metrics immediately to prevent blank dashes.
 * @author Senior Systems Architect
 */

const VISITS_KEY = 'bbmp_eplan_studio_visits_2026';
const PLANS_KEY = 'bbmp_eplan_studio_plans_2026';
const COUNTAPI_BASE = 'https://countapi.mileshilliard.com/api/v1';
const CACHE_STORAGE_KEY = 'bbmp_eplan_cached_stats_v1';
const SESSION_TRACK_KEY = 'eplan_visit_session_tracked';

// Baseline fallback counts to display instantly before network resolution
const DEFAULT_BASELINE = {
  visits: 195,
  plans: 178
};

/**
 * Checks if the current page is running in a local / sandbox / test environment.
 * Prevents inflating production visitor and plan counters during development.
 * 
 * @function isLocalEnvironment
 * @returns {boolean}
 */
function isLocalEnvironment() {
  if (typeof window === 'undefined' || !window.location) return true;
  const hostname = window.location.hostname || '';
  const protocol = window.location.protocol || '';

  return (
    hostname === '127.0.0.1' ||
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname === '' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local') ||
    protocol === 'file:'
  );
}

/**
 * Retrieves cached stats from localStorage with fallback defaults.
 * @returns {{ visits: number, plans: number }}
 */
function getCachedStats() {
  if (typeof localStorage === 'undefined') return DEFAULT_BASELINE;
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.visits === 'number' && typeof parsed.plans === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return DEFAULT_BASELINE;
}

/**
 * Saves latest stats to localStorage cache.
 * @param {number} visits 
 * @param {number} plans 
 */
function setCachedStats(visits, plans) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ visits, plans, updated: Date.now() }));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Updates text content of all DOM elements matching target IDs.
 * 
 * @function updateStatElements
 * @param {string} id - Target DOM element ID ('statVisits' or 'statPlans').
 * @param {number} val - Numerical count to format and insert.
 * @returns {void}
 */
function updateStatElements(id, val) {
  if (typeof document === 'undefined' || typeof val !== 'number' || isNaN(val)) return;
  const elements = document.querySelectorAll('#' + id);
  const formatted = val.toLocaleString();
  elements.forEach(el => {
    el.textContent = formatted;
  });
}

/**
 * Renders cached stats immediately into the DOM.
 */
function renderImmediateStats() {
  const cached = getCachedStats();
  updateStatElements('statVisits', cached.visits);
  updateStatElements('statPlans', cached.plans);
}

/**
 * Initializes and fetches live visitor and plan stats.
 * Deduplicates visit increments per browser session using sessionStorage.
 * On localhost / 127.0.0.1, increments are skipped to preserve production accuracy.
 * 
 * @function initLiveStats
 * @param {boolean} [shouldAttemptIncrement=false] - Whether to attempt visit increment.
 * @returns {void}
 */
function initLiveStats(shouldAttemptIncrement = false) {
  // Step 1: Render cached/baseline numbers immediately without waiting for network
  renderImmediateStats();

  const isLocal = isLocalEnvironment();
  let isNewSession = false;

  if (shouldAttemptIncrement && !isLocal) {
    try {
      if (!sessionStorage.getItem(SESSION_TRACK_KEY)) {
        isNewSession = true;
        sessionStorage.setItem(SESSION_TRACK_KEY, 'true');
      }
    } catch (e) {
      isNewSession = true;
    }
  }

  // Step 2: Attempt Edge Worker First-Party API (/api/stats)
  if (typeof fetch === 'function') {
    const edgeEndpoint = `/api/stats${isNewSession && !isLocal ? '?hit=true' : ''}`;
    
    fetch(edgeEndpoint)
      .then(res => {
        if (!res.ok) throw new Error(`Edge API status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && typeof data.visits === 'number' && typeof data.plans === 'number') {
          updateStatElements('statVisits', data.visits);
          updateStatElements('statPlans', data.plans);
          setCachedStats(data.visits, data.plans);
        }
      })
      .catch(() => {
        // Step 3: Fallback directly to CountAPI
        const visitEndpoint = isNewSession && !isLocal
          ? `${COUNTAPI_BASE}/hit/${VISITS_KEY}`
          : `${COUNTAPI_BASE}/get/${VISITS_KEY}`;

        fetch(visitEndpoint)
          .then(res => res.json())
          .then(data => {
            if (data && typeof data.value === 'number') {
              updateStatElements('statVisits', data.value);
              const cached = getCachedStats();
              setCachedStats(data.value, cached.plans);
            }
          })
          .catch(err => console.warn('Visits direct sync offline:', err));

        fetch(`${COUNTAPI_BASE}/get/${PLANS_KEY}`)
          .then(res => res.json())
          .then(data => {
            if (data && typeof data.value === 'number') {
              updateStatElements('statPlans', data.value);
              const cached = getCachedStats();
              setCachedStats(cached.visits, data.value);
            }
          })
          .catch(err => console.warn('Plans direct sync offline:', err));
      });
  }
}

/**
 * Increments the total plans generated counter when user clicks "Generate Plan".
 * On localhost / 127.0.0.1, the hit increment is skipped to prevent pollution.
 * 
 * @function trackPlanGenerated
 * @returns {void}
 */
function trackPlanGenerated() {
  const isLocal = isLocalEnvironment();

  // Optimistic UI increment
  const cached = getCachedStats();
  const nextPlanCount = cached.plans + 1;
  updateStatElements('statPlans', nextPlanCount);
  setCachedStats(cached.visits, nextPlanCount);

  if (isLocal) return;

  if (typeof fetch === 'function') {
    // Attempt Edge worker plan increment
    fetch('/api/stats/plan', { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('Edge plan increment error');
        return res.json();
      })
      .then(data => {
        if (data && typeof data.plans === 'number') {
          updateStatElements('statPlans', data.plans);
          setCachedStats(cached.visits, data.plans);
        }
      })
      .catch(() => {
        // Fallback to CountAPI
        fetch(`${COUNTAPI_BASE}/hit/${PLANS_KEY}`)
          .then(res => res.json())
          .then(data => {
            if (data && typeof data.value === 'number') {
              updateStatElements('statPlans', data.value);
              setCachedStats(cached.visits, data.value);
            }
          })
          .catch(err => console.warn('Plan increment failed:', err));
      });
  }
}

// Auto-initialize when script loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const isHome = Boolean(document.getElementById('statVisits') && !document.getElementById('wizardCard'));
      initLiveStats(isHome);
    });
  } else {
    const isHome = Boolean(document.getElementById('statVisits') && !document.getElementById('wizardCard'));
    initLiveStats(isHome);
  }
}

// Global window attachments
if (typeof window !== 'undefined') {
  window.isLocalEnvironment = isLocalEnvironment;
  window.initLiveStats = initLiveStats;
  window.trackPlanGenerated = trackPlanGenerated;
  window.updateStatElements = updateStatElements;
  window.renderImmediateStats = renderImmediateStats;
}

export { isLocalEnvironment, initLiveStats, trackPlanGenerated, updateStatElements, renderImmediateStats };

