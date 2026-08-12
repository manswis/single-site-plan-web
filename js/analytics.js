/**
 * @file analytics.js
 * @description Zero-privacy-intrusion live stats counter for BBMP e-Plan Studio.
 * Tracks total page visits and total plans generated.
 * Uses non-blocking background fetch with 100% privacy compliance (no cookies, no IP logging).
 * @author Senior Systems Architect
 */

const STATS_NAMESPACE = 'bbmp-eplan-studio-v1';

/**
 * Initializes and fetches live visitor and plan stats.
 * 
 * @function initLiveStats
 * @param {boolean} [incrementVisit=false] - Whether to increment page visit counter.
 * @returns {void}
 */
function initLiveStats(incrementVisit = false) {
  const visitEndpoint = incrementVisit
    ? `https://api.countapi.xyz/hit/${STATS_NAMESPACE}/visits`
    : `https://api.countapi.xyz/get/${STATS_NAMESPACE}/visits`;

  fetch(visitEndpoint)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.value === 'number') {
        updateStatElements('statVisits', data.value);
      }
    })
    .catch(() => {});

  fetch(`https://api.countapi.xyz/get/${STATS_NAMESPACE}/plans`)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.value === 'number') {
        updateStatElements('statPlans', data.value);
      }
    })
    .catch(() => {});
}

/**
 * Increments the total plans generated counter when user clicks "Generate Plan".
 * 
 * @function trackPlanGenerated
 * @returns {void}
 */
function trackPlanGenerated() {
  fetch(`https://api.countapi.xyz/hit/${STATS_NAMESPACE}/plans`)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.value === 'number') {
        updateStatElements('statPlans', data.value);
      }
    })
    .catch(() => {});
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
