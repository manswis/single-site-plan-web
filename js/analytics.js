/**
 * @file analytics.js
 * @description Zero-privacy-intrusion live stats counter for BBMP e-Plan Studio.
 * Tracks total page visits and total plans generated using Miles Hilliard CountAPI.
 * @author Senior Systems Architect
 */

const VISITS_KEY = 'bbmp_eplan_studio_visits_2026';
const PLANS_KEY = 'bbmp_eplan_studio_plans_2026';
const API_BASE = 'https://countapi.mileshilliard.com/api/v1';

/**
 * Initializes and fetches live visitor and plan stats.
 * 
 * @function initLiveStats
 * @param {boolean} [incrementVisit=false] - Whether to increment page visit counter.
 * @returns {void}
 */
function initLiveStats(incrementVisit = false) {
  const visitEndpoint = incrementVisit
    ? `${API_BASE}/hit/${VISITS_KEY}`
    : `${API_BASE}/get/${VISITS_KEY}`;

  // 1. Fetch/Increment Visits
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
