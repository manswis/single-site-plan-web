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
 * Initializes and fetches live visitor and plan stats.
 * Deduplicates visit increments per browser session using sessionStorage.
 * 
 * @function initLiveStats
 * @param {boolean} [shouldAttemptIncrement=false] - Whether to attempt visit increment.
 * @returns {void}
 */
function initLiveStats(shouldAttemptIncrement = false) {
  const SESSION_KEY = 'eplan_visit_session_tracked';
  let isNewSession = false;

  if (shouldAttemptIncrement) {
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

  const visitEndpoint = isNewSession
    ? `${API_BASE}/hit/${VISITS_KEY}`
    : `${API_BASE}/get/${VISITS_KEY}`;

  // 1. Fetch/Increment Unique Session Visits
  fetch(visitEndpoint)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.value === 'number') {
        updateStatElements('statVisits', data.value);
      }
    })
    .catch(err => console.warn('Visits counter offline:', err));

  // 2. Fetch Plans Generated
  fetch(`${API_BASE}/get/${PLANS_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.value === 'number') {
        updateStatElements('statPlans', data.value);
      }
    })
    .catch(err => console.warn('Plans counter offline:', err));
}

/**
 * Increments the total plans generated counter when user clicks "Generate Plan".
 * 
 * @function trackPlanGenerated
 * @returns {void}
 */
function trackPlanGenerated() {
  fetch(`${API_BASE}/hit/${PLANS_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.value === 'number') {
        updateStatElements('statPlans', data.value);
      }
    })
    .catch(err => console.warn('Plan increment failed:', err));
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
  const elements = document.querySelectorAll('#' + id);
  const formatted = val.toLocaleString();
  elements.forEach(el => {
    el.textContent = formatted;
  });
}
