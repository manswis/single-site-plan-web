/**
 * @file analytics.js
 * @description Zero-privacy-intrusion live stats counter for e-Plan Studio.
 * Tracks unique session visits and total plans generated using Miles Hilliard CountAPI.
 * Features browser sessionStorage deduplication to prevent count inflation on page refreshes.
 * @author Senior Systems Architect
 */

const VISITS_KEY = 'bbmp_eplan_studio_visits_2026';
const PLANS_KEY = 'bbmp_eplan_studio_plans_2026';
const API_BASE = 'https://countapi.mileshilliard.com/api/v1';

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
 * Initializes and fetches live visitor and plan stats.
 * Deduplicates visit increments per browser session using sessionStorage.
 * On localhost / 127.0.0.1, increments are skipped to preserve production accuracy.
 * 
 * @function initLiveStats
 * @param {boolean} [shouldAttemptIncrement=false] - Whether to attempt visit increment.
 * @returns {void}
 */
function initLiveStats(shouldAttemptIncrement = false) {
  const isLocal = isLocalEnvironment();
  const SESSION_KEY = 'eplan_visit_session_tracked';
  let isNewSession = false;

  if (shouldAttemptIncrement && !isLocal) {
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        isNewSession = true;
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    } catch (e) {
      // Fallback if sessionStorage is restricted
      isNewSession = true;
    }
  }

  // Use read-only /get/ in local environment; /hit/ only on live public domain
  const visitEndpoint = isNewSession && !isLocal
    ? `${API_BASE}/hit/${VISITS_KEY}`
    : `${API_BASE}/get/${VISITS_KEY}`;

  // 1. Fetch/Increment Unique Session Visits
  if (typeof fetch === 'function') {
    fetch(visitEndpoint)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.value === 'number') {
          updateStatElements('statVisits', data.value);
        }
      })
      .catch(err => console.warn('Visits counter offline:', err));

    // 2. Fetch Plans Generated (Read-only)
    fetch(`${API_BASE}/get/${PLANS_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.value === 'number') {
          updateStatElements('statPlans', data.value);
        }
      })
      .catch(err => console.warn('Plans counter offline:', err));
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
  if (isLocalEnvironment()) {
    // In local development, fetch latest read-only stat without incrementing
    if (typeof fetch === 'function') {
      fetch(`${API_BASE}/get/${PLANS_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.value === 'number') {
            updateStatElements('statPlans', data.value);
          }
        })
        .catch(err => console.warn('Plan fetch offline:', err));
    }
    return;
  }

  if (typeof fetch === 'function') {
    fetch(`${API_BASE}/hit/${PLANS_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.value === 'number') {
          updateStatElements('statPlans', data.value);
        }
      })
      .catch(err => console.warn('Plan increment failed:', err));
  }
}

/**
 * Updates text content of all DOM elements matching the target ID.
 * 
 * @function updateStatElements
 * @param {string} id - Target DOM element ID.
 * @param {number} val - Numerical count to format and insert.
 * @returns {void}
 */
function updateStatElements(id, val) {
  if (typeof document === 'undefined') return;
  const elements = document.querySelectorAll('#' + id);
  const formatted = val.toLocaleString();
  elements.forEach(el => {
    el.textContent = formatted;
  });
}

// Global window attachments
if (typeof window !== 'undefined') {
  window.isLocalEnvironment = isLocalEnvironment;
  window.initLiveStats = initLiveStats;
  window.trackPlanGenerated = trackPlanGenerated;
  window.updateStatElements = updateStatElements;
}

export { isLocalEnvironment, initLiveStats, trackPlanGenerated, updateStatElements };
