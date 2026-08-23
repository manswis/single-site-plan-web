/**
 * @file ui.js
 * @description Dynamic UI interaction logic, real-time live preview event wiring,
 * mobile segmented tab switching, Sakala FAQ accordion toggling, and PDF export engines.
 * @author Senior Systems Architect
 */

import { BBMP_ZONES, BBMP_WARDS } from './data/bbmpWards.js';

let pickerMapInstance = null;
let pickerMarkerInstance = null;
let currentPickerCoords = { lat: 12.9716, lon: 77.5946 };

const BANGALORE_CENTER = { lat: 12.9716, lon: 77.5946 };

const BANGALORE_ZONE_CENTERS = {
  'East': { lat: 12.9840, lon: 77.6200 },
  'West': { lat: 12.9900, lon: 77.5600 },
  'South': { lat: 12.9300, lon: 77.5800 },
  'North': { lat: 13.1000, lon: 77.5950 },
  'North Zone': { lat: 13.1000, lon: 77.5950 },
  'Mahadevapura': { lat: 12.9900, lon: 77.6900 },
  'Bommanahalli': { lat: 12.9000, lon: 77.6200 },
  'Yelahanka': { lat: 13.1000, lon: 77.5950 },
  'Rajarajeshwari Nagar': { lat: 12.9250, lon: 77.5200 },
  'Dasarahalli': { lat: 13.0450, lon: 77.5150 }
};

/**
 * Ensures Leaflet library and styles are loaded into the document.
 * @function ensureLeafletLoaded
 * @param {Function} callback - Executed when Leaflet is ready.
 * @returns {void}
 */
function ensureLeafletLoaded(callback) {
  if (typeof L !== 'undefined') {
    callback();
    return;
  }

  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => {
    if (typeof callback === 'function') callback();
  };
  script.onerror = () => {
    console.error('Leaflet failed to load from CDN');
    alert('Map library could not be loaded. Please check your internet connection.');
  };
  document.head.appendChild(script);
}

/**
 * Opens the interactive map location picker modal and initializes Leaflet.
 * @function openLocationPickerModal
 * @param {Event} [e] - Click event
 * @returns {void}
 */
function openLocationPickerModal(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const modal = document.getElementById('locationPickerModal');
  if (!modal) {
    console.error('locationPickerModal not found in DOM');
    return;
  }

  // Force modal overlay visibility
  modal.style.setProperty('display', 'flex', 'important');
  modal.classList.add('active');

  // Determine starting coordinates
  const rawGps = (document.getElementById('gpsCoords')?.value || '').trim();
  let startCoords = BANGALORE_CENTER;
  if (typeof parseCoordinates === 'function') {
    const parsed = parseCoordinates(rawGps);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
      startCoords = parsed;
    } else {
      const selectedZone = document.getElementById('bbmpZone')?.value;
      if (selectedZone && BANGALORE_ZONE_CENTERS[selectedZone]) {
        startCoords = BANGALORE_ZONE_CENTERS[selectedZone];
      }
    }
  }

  currentPickerCoords = { ...startCoords };
  updatePickerCoordsDisplay(currentPickerCoords.lat, currentPickerCoords.lon);

  ensureLeafletLoaded(() => {
    initOrUpdatePickerMap(currentPickerCoords.lat, currentPickerCoords.lon);
    setTimeout(() => {
      if (pickerMapInstance) pickerMapInstance.invalidateSize();
    }, 100);
    setTimeout(() => {
      if (pickerMapInstance) pickerMapInstance.invalidateSize();
    }, 350);
  });

  // Keyboard accessibility: Close on Escape
  const onEscKey = (evt) => {
    if (evt.key === 'Escape') {
      closeLocationPickerModal();
      document.removeEventListener('keydown', onEscKey);
    }
  };
  document.addEventListener('keydown', onEscKey);
}

/**
 * Closes the location picker modal.
 * @function closeLocationPickerModal
 * @returns {void}
 */
function closeLocationPickerModal() {
  const modal = document.getElementById('locationPickerModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

let currentMapLayerType = 'street';
let streetTileLayer = null;
let satelliteTileLayer = null;

/**
 * Switches the picker map layer between Street and Satellite view.
 * @function setMapLayerType
 * @param {'street'|'satellite'} type
 * @returns {void}
 */
function setMapLayerType(type) {
  currentMapLayerType = type === 'satellite' ? 'satellite' : 'street';
  if (pickerMapInstance && typeof L !== 'undefined') {
    if (currentMapLayerType === 'satellite') {
      if (streetTileLayer && pickerMapInstance.hasLayer(streetTileLayer)) {
        pickerMapInstance.removeLayer(streetTileLayer);
      }
      if (!satelliteTileLayer) {
        satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: 19
        });
      }
      if (!pickerMapInstance.hasLayer(satelliteTileLayer)) {
        satelliteTileLayer.addTo(pickerMapInstance);
      }
    } else {
      if (satelliteTileLayer && pickerMapInstance.hasLayer(satelliteTileLayer)) {
        pickerMapInstance.removeLayer(satelliteTileLayer);
      }
      if (streetTileLayer && !pickerMapInstance.hasLayer(streetTileLayer)) {
        streetTileLayer.addTo(pickerMapInstance);
      }
    }
  }

  const btnStreet = document.getElementById('btnMapLayerStreet');
  const btnSat = document.getElementById('btnMapLayerSatellite');
  if (btnStreet) btnStreet.classList.toggle('active', currentMapLayerType === 'street');
  if (btnSat) btnSat.classList.toggle('active', currentMapLayerType === 'satellite');
}

/**
 * Initializes or moves the Leaflet map and marker.
 * @function initOrUpdatePickerMap
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {void}
 */
function initOrUpdatePickerMap(lat, lon) {
  const container = document.getElementById('pickerMapContainer');
  if (!container || typeof L === 'undefined') return;

  if (!pickerMapInstance) {
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    try {
      pickerMapInstance = L.map('pickerMapContainer', {
        center: [lat, lon],
        zoom: 15,
        zoomControl: true
      });

      // High-performance CartoDB Voyager raster tiles
      streetTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      });

      if (currentMapLayerType === 'satellite') {
        satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: 19
        }).addTo(pickerMapInstance);
      } else {
        streetTileLayer.addTo(pickerMapInstance);
      }

      // Draggable red marker
      const redPinIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="#dc2626" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4)); transform: translate(-8px, -24px);">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      pickerMarkerInstance = L.marker([lat, lon], {
        draggable: true,
        icon: redPinIcon
      }).addTo(pickerMapInstance);

      // Update coordinates when marker is dragged
      pickerMarkerInstance.on('dragend', function (e) {
        const pos = e.target.getLatLng();
        currentPickerCoords = { lat: pos.lat, lon: pos.lng };
        updatePickerCoordsDisplay(pos.lat, pos.lng);
      });

      // Click anywhere on map to move marker
      pickerMapInstance.on('click', function (e) {
        pickerMarkerInstance.setLatLng(e.latlng);
        currentPickerCoords = { lat: e.latlng.lat, lon: e.latlng.lng };
        updatePickerCoordsDisplay(e.latlng.lat, e.latlng.lng);
      });
    } catch (err) {
      console.error('Error creating Leaflet map:', err);
    }
  } else {
    try {
      pickerMapInstance.invalidateSize();
      pickerMapInstance.setView([lat, lon], pickerMapInstance.getZoom() || 15);
      if (pickerMarkerInstance) {
        pickerMarkerInstance.setLatLng([lat, lon]);
      }
    } catch (err) {
      console.warn('Map update error:', err);
    }
  }
}

/**
 * Updates the footer coordinate display badge inside the modal.
 * @function updatePickerCoordsDisplay
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {void}
 */
function updatePickerCoordsDisplay(lat, lon) {
  const displayEl = document.getElementById('pickerCoordsDisplay');
  if (displayEl) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    displayEl.textContent = `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lon).toFixed(5)}° ${lonDir} (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
  }
}

/**
 * Searches a location in Bangalore using OpenStreetMap Nominatim API with offline ward directory fallback.
 * @function searchMapLocation
 * @returns {void}
 */
function searchMapLocation() {
  const input = document.getElementById('mapSearchInput');
  if (!input || !input.value.trim()) return;

  const query = input.value.trim();
  const qLower = query.toLowerCase();

  const applyFoundCoords = (lat, lon) => {
    currentPickerCoords = { lat, lon };
    updatePickerCoordsDisplay(lat, lon);
    if (pickerMapInstance && pickerMarkerInstance) {
      pickerMapInstance.flyTo([lat, lon], 16, { duration: 1 });
      pickerMarkerInstance.setLatLng([lat, lon]);
    }
  };

  // Check local 198 BBMP Wards
  const wards = (typeof BBMP_WARDS !== 'undefined' ? BBMP_WARDS : window.BBMP_WARDS) || [];
  const matchedWard = wards.find(w =>
    w.nameEn.toLowerCase().includes(qLower) ||
    w.nameKn.includes(query) ||
    String(w.wardNo) === query ||
    (w.keywords && w.keywords.some(k => k.toLowerCase().includes(qLower)))
  );

  const fullQuery = qLower.includes('bangalore') || qLower.includes('bengaluru')
    ? query
    : `${query}, Bengaluru, Karnataka`;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`)
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        applyFoundCoords(lat, lon);
      } else if (matchedWard && BANGALORE_ZONE_CENTERS[matchedWard.zone]) {
        const coords = BANGALORE_ZONE_CENTERS[matchedWard.zone];
        applyFoundCoords(coords.lat, coords.lon);
      } else {
        alert(`Location "${query}" not found. Try entering a nearby landmark, ward, or layout name.`);
      }
    })
    .catch(err => {
      console.warn('Geocoding search failed, checking offline directory:', err);
      if (matchedWard && BANGALORE_ZONE_CENTERS[matchedWard.zone]) {
        const coords = BANGALORE_ZONE_CENTERS[matchedWard.zone];
        applyFoundCoords(coords.lat, coords.lon);
      } else {
        alert('Search service currently unreachable. Please drag the pin on the map to your site location.');
      }
    });
}

/**
 * Flies map to user's physical GPS location (for users who are near the site).
 * @function locateOnPickerMap
 * @returns {void}
 */
function locateOnPickerMap() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported by your browser.');
    return;
  }

  const handleSuccess = (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    currentPickerCoords = { lat, lon };
    updatePickerCoordsDisplay(lat, lon);
    if (pickerMapInstance && pickerMarkerInstance) {
      pickerMapInstance.flyTo([lat, lon], 17, { duration: 1.2 });
      pickerMarkerInstance.setLatLng([lat, lon]);
    }
  };

  const handleError = (err) => {
    console.warn('locateOnPickerMap error:', err);
    if (err && err.code === 1) {
      alert('Location permission was denied. Please enable location permissions or drag the pin manually.');
    } else {
      alert('Could not access current GPS coordinates. Please pan and drag the pin to your site on the map.');
    }
  };

  navigator.geolocation.getCurrentPosition(
    handleSuccess,
    () => {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    },
    { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
  );
}

/**
 * Geographic center coordinates and zoom levels for 8 BBMP Administrative Zones.
 */
const BBMP_ZONE_COORDINATES = {
  'East': { lat: 12.9719, lon: 77.6412, zoom: 14 },
  'West': { lat: 12.9982, lon: 77.5630, zoom: 14 },
  'South': { lat: 12.9299, lon: 77.5824, zoom: 14 },
  'North': { lat: 13.1007, lon: 77.5963, zoom: 14 },
  'North Zone': { lat: 13.1007, lon: 77.5963, zoom: 14 },
  'Yelahanka': { lat: 13.1007, lon: 77.5963, zoom: 14 },
  'Mahadevapura': { lat: 12.9904, lon: 77.6974, zoom: 14 },
  'Rajarajeshwari Nagar': { lat: 12.9272, lon: 77.5154, zoom: 14 },
  'Dasarahalli': { lat: 13.0458, lon: 77.5126, zoom: 14 },
  'Bommanahalli': { lat: 12.8984, lon: 77.6256, zoom: 14 }
};

/**
 * Centers the map on a designated BBMP administrative zone.
 * @function flyPickerToZone
 * @param {string} zoneName - Name of the BBMP Zone
 * @returns {void}
 */
function flyPickerToZone(zoneName) {
  const coords = BBMP_ZONE_COORDINATES[zoneName];
  if (!coords) return;
  currentPickerCoords = { lat: coords.lat, lon: coords.lon };
  updatePickerCoordsDisplay(coords.lat, coords.lon);
  if (pickerMapInstance && pickerMarkerInstance) {
    pickerMapInstance.flyTo([coords.lat, coords.lon], coords.zoom || 14, { duration: 1 });
    pickerMarkerInstance.setLatLng([coords.lat, coords.lon]);
  }
}

/**
 * Resets picker map view to Central Bangalore (Vidhana Soudha).
 * @function resetToBangaloreCenter
 * @returns {void}
 */
function resetToBangaloreCenter() {
  currentPickerCoords = { ...BANGALORE_CENTER };
  updatePickerCoordsDisplay(BANGALORE_CENTER.lat, BANGALORE_CENTER.lon);
  if (pickerMapInstance && pickerMarkerInstance) {
    pickerMapInstance.flyTo([BANGALORE_CENTER.lat, BANGALORE_CENTER.lon], 14, { duration: 1 });
    pickerMarkerInstance.setLatLng([BANGALORE_CENTER.lat, BANGALORE_CENTER.lon]);
  }
}

const ZOOM_DESCRIPTIONS = {
  14: '14 (Wide Locality & Arterials)',
  15: '15 (Neighborhood & Main Roads)',
  16: '16 (Standard Layout & Cross Roads)',
  17: '17 (Close Plot & Street Level)',
  18: '18 (Ultra-Close Site View)'
};

/**
 * Handles slider adjustments for Map Zoom Level.
 * 
 * @function onGpsZoomInput
 * @param {string|number} val - Zoom level (14 to 18).
 * @returns {void}
 */
function onGpsZoomInput(val) {
  const num = parseInt(val, 10) || 16;
  const label = document.getElementById('gpsZoomValLabel');
  if (label && ZOOM_DESCRIPTIONS[num]) {
    label.textContent = ZOOM_DESCRIPTIONS[num];
  }
  if (typeof saveDraft === 'function') saveDraft();
  if (typeof updateKeyPlan === 'function') updateKeyPlan();
}

/**
 * Synchronizes visibility and labels of the GPS Zoom Control Wrap.
 * 
 * @function syncGpsZoomControls
 * @returns {void}
 */
function syncGpsZoomControls() {
  const rawGps = (document.getElementById('gpsCoords')?.value || '').trim();
  const wrap = document.getElementById('gpsZoomControlWrap');
  const zoomInput = document.getElementById('gpsZoom');
  const zoomLabel = document.getElementById('gpsZoomValLabel');

  if (!wrap) return;

  if (rawGps && typeof parseCoordinates === 'function' && parseCoordinates(rawGps)) {
    wrap.style.display = 'block';
    if (zoomInput && zoomLabel) {
      const z = parseInt(zoomInput.value, 10) || 16;
      if (ZOOM_DESCRIPTIONS[z]) zoomLabel.textContent = ZOOM_DESCRIPTIONS[z];
    }
  } else {
    wrap.style.display = 'none';
  }
}

/**
 * Applies the chosen coordinates to the Step 2 input, saves draft, and updates the Key Plan.
 * @function applyPickerLocation
 * @returns {void}
 */
function applyPickerLocation() {
  const gpsInput = document.getElementById('gpsCoords');
  const zoomInput = document.getElementById('gpsZoom');
  if (gpsInput && currentPickerCoords) {
    gpsInput.value = `${currentPickerCoords.lat.toFixed(5)}, ${currentPickerCoords.lon.toFixed(5)}`;
    if (typeof clearFieldError === 'function') clearFieldError('gpsCoords', 'err-gpsCoords');
  }

  if (zoomInput && pickerMapInstance) {
    const currentZoom = Math.min(18, Math.max(14, pickerMapInstance.getZoom()));
    zoomInput.value = currentZoom;
    const zoomLabel = document.getElementById('gpsZoomValLabel');
    if (zoomLabel && ZOOM_DESCRIPTIONS[currentZoom]) {
      zoomLabel.textContent = ZOOM_DESCRIPTIONS[currentZoom];
    }
  }

  closeLocationPickerModal();
  syncGpsZoomControls();

  if (typeof updateKeyPlan === 'function') updateKeyPlan();
  if (typeof saveDraft === 'function') saveDraft();
}

/**
 * Uses HTML5 Geolocation API to auto-detect the user's GPS coordinates.
 * Populates gpsCoords input and refreshes the Key Plan map thumbnail.
 * 
 * @function detectGPSLocation
 * @param {Event} [e] - Click event
 * @returns {void}
 */
function detectGPSLocation(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const btn = document.getElementById('btnLocateMe');
  const gpsInput = document.getElementById('gpsCoords');
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; animation: spin 1s linear infinite;">sync</span> <span>Locating...</span>';
  }

  const handleSuccess = (position) => {
    if (!position || !position.coords) {
      handleFinalError(new Error('Position unavailable'));
      return;
    }
    const lat = Number(position.coords.latitude).toFixed(5);
    const lon = Number(position.coords.longitude).toFixed(5);
    if (gpsInput) {
      gpsInput.value = `${lat}, ${lon}`;
      if (typeof onGpsCoordsInput === 'function') onGpsCoordsInput();
      if (typeof clearFieldError === 'function') clearFieldError('gpsCoords', 'err-gpsCoords');
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; color: #10b981;">check</span> <span>Located</span>';
      setTimeout(() => {
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; color: var(--apple-accent);">my_location</span> <span>Locate Me</span>';
      }, 3000);
    }
    syncGpsZoomControls();
    if (typeof updateKeyPlan === 'function') updateKeyPlan();
    if (typeof saveDraft === 'function') saveDraft();
  };

  const handleFinalError = (err) => {
    console.warn('Geolocation error:', err ? err.message : 'Unknown error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; color: var(--apple-accent);">my_location</span> <span>Locate Me</span>';
    }
    if (err && err.code === 1) { // PERMISSION_DENIED
      alert('Location permission was denied. Please enable location permissions in browser settings, or click "Pick on Map" to select your site.');
    } else {
      openLocationPickerModal();
    }
  };

  navigator.geolocation.getCurrentPosition(
    handleSuccess,
    (err) => {
      if (err && err.code !== 1) {
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleFinalError,
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        );
      } else {
        handleFinalError(err);
      }
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
  );
}

/**
 * Handles real-time input on GPS Coordinates field.
 * 
 * @function onGpsCoordsInput
 * @returns {void}
 */
function onGpsCoordsInput() {
  const rawGps = (document.getElementById('gpsCoords')?.value || '').trim();
  const errEl = document.getElementById('err-gpsCoords');
  const inp = document.getElementById('gpsCoords');

  if (rawGps) {
    const coords = typeof parseCoordinates === 'function' ? parseCoordinates(rawGps) : null;
    if (!coords && rawGps.length >= 3) {
      if (errEl) errEl.style.display = 'block';
      if (inp) inp.classList.add('error');
    } else {
      if (errEl) errEl.style.display = 'none';
      if (inp) inp.classList.remove('error');
    }
  } else {
    if (errEl) errEl.style.display = 'none';
    if (inp) inp.classList.remove('error');
  }

  syncGpsZoomControls();
  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Handles fallback when remote map tile fails to load.
 * 
 * @function onKeyPlanMapError
 * @returns {void}
 */
function onKeyPlanMapError() {
  const mapWrapper = document.getElementById('keyPlanMapWrapper');
  const svg = document.getElementById('keyPlanSvg');
  const headerEl = document.getElementById('keyPlanHeader');
  if (mapWrapper) mapWrapper.style.display = 'none';
  if (svg) svg.style.display = 'block';
  if (headerEl) headerEl.textContent = '2. KEY PLAN (LOCATIONAL SKETCH)';
}

/**
 * Toggles visibility between regular rectangular plot mode (2-field N/S & E/W inputs)
 * and odd/irregular quadrilateral plot mode (independent 4-side inputs).
 * 
 * @function toggleOddSite
 * @returns {void}
 */
function toggleOddSite() {
  const isOdd = document.getElementById('oddSiteCheck') && document.getElementById('oddSiteCheck').checked;
  const regControls = document.getElementById('regularSiteControls');
  const irregControls = document.getElementById('irregularSiteControls');
  const hintEl = document.getElementById('oddSiteHint');

  const regNS = document.getElementById('regNorthSouth');
  const regEW = document.getElementById('regEastWest');
  const nEl = document.getElementById('sideNorth');
  const sEl = document.getElementById('sideSouth');
  const eEl = document.getElementById('sideEast');
  const wEl = document.getElementById('sideWest');

  if (isOdd) {
    // Irregular Mode: Show 4 independent fields
    if (regControls) regControls.style.display = 'none';
    if (irregControls) irregControls.style.display = 'grid';
    if (hintEl) hintEl.textContent = '🔷 Irregular Site Mode: Enter exact independent measurements for all 4 sides.';

    if (nEl && !nEl.value && regEW) nEl.value = regEW.value;
    if (sEl && !sEl.value && regEW) sEl.value = regEW.value;
    if (eEl && !eEl.value && regNS) eEl.value = regNS.value;
    if (wEl && !wEl.value && regNS) wEl.value = regNS.value;
  } else {
    // Regular Mode: Show 2 clean fields (East/West Depth & North/South Frontage)
    if (regControls) regControls.style.display = 'grid';
    if (irregControls) irregControls.style.display = 'none';
    if (hintEl) hintEl.textContent = 'Rectangular Mode (Default): Enter East/West depth and North/South frontage.';

    if (regEW && nEl) regEW.value = nEl.value || (sEl ? sEl.value : '');
    if (regNS && eEl) regNS.value = eEl.value || (wEl ? wEl.value : '');

    onRegularDimensionInput();
  }

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Handles input change on 2-column regular dimension fields.
 * Syncs underlying sideNorth, sideSouth, sideEast, sideWest values and auto-calculates plot area.
 * 
 * @function onRegularDimensionInput
 * @returns {void}
 */
function onRegularDimensionInput() {
  const regNS = document.getElementById('regNorthSouth');
  const regEW = document.getElementById('regEastWest');

  const nsVal = regNS ? regNS.value.trim() : '';
  const ewVal = regEW ? regEW.value.trim() : '';

  const nEl = document.getElementById('sideNorth');
  const sEl = document.getElementById('sideSouth');
  const eEl = document.getElementById('sideEast');
  const wEl = document.getElementById('sideWest');

  // East-to-West measurement sets the length of North and South boundary lines (horizontal depth)
  if (nEl) nEl.value = ewVal;
  if (sEl) sEl.value = ewVal;

  // North-to-South measurement sets the length of East and West boundary lines (vertical frontage)
  if (eEl) eEl.value = nsVal;
  if (wEl) wEl.value = nsVal;

  // Auto-calculate plot area if non-empty and user hasn't explicitly overridden it
  const areaInput = document.getElementById('plotArea');
  if (areaInput && (!areaInput.dataset.userEdited || areaInput.value === '')) {
    const nsNum = parseFloat(nsVal);
    const ewNum = parseFloat(ewVal);
    if (!isNaN(nsNum) && !isNaN(ewNum) && nsNum > 0 && ewNum > 0) {
      areaInput.value = Math.round(nsNum * ewNum);
      if (typeof clearFieldError === 'function') clearFieldError('plotArea', 'err-plotArea');
    }
  }

  if (typeof clearFieldError === 'function') {
    clearFieldError('regNorthSouth', 'err-regNorthSouth');
    clearFieldError('regEastWest', 'err-regEastWest');
  }

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Automatically calculates and populates plot area in sq.ft based on N/S/E/W side measurements.
 * 
 * @function calculatePlotAreaFromSides
 * @returns {void}
 */
function calculatePlotAreaFromSides() {
  const n = parseFloat(document.getElementById('sideNorth').value) || 0;
  const s = parseFloat(document.getElementById('sideSouth').value) || 0;
  const e = parseFloat(document.getElementById('sideEast').value) || 0;
  const w = parseFloat(document.getElementById('sideWest').value) || 0;

  if (n > 0 && s > 0 && e > 0 && w > 0) {
    const avgW = (n + s) / 2;
    const avgL = (e + w) / 2;
    const area = Math.round(avgW * avgL);
    const plotAreaInp = document.getElementById('plotArea');
    if (plotAreaInp && (!plotAreaInp.value || plotAreaInp.dataset.userEdited !== 'true')) {
      plotAreaInp.value = area;
    }
  }
}
/**
 * Handles live input changes inside custom Feet & Inches input controls (.ft-in-wrapper).
 * Calculates decimal feet ($ft + in/12$) and updates underlying hidden input value.
 * 
 * @function onFtInInput
 * @param {string} fieldId - Target base field ID (e.g. 'roadWidth', 'regNorthSouth').
 * @returns {void}
 */
function onFtInInput(fieldId) {
  const ftEl = document.getElementById(fieldId + '_ft');
  const inEl = document.getElementById(fieldId + '_in');
  const hiddenEl = document.getElementById(fieldId);

  if (!ftEl || !hiddenEl) return;

  const ftRaw = ftEl.value.trim();
  const inRaw = inEl ? inEl.value.trim() : '';

  if (ftRaw === '' && inRaw === '') {
    hiddenEl.value = '';
  } else {
    const ftVal = parseFloat(ftRaw) || 0;
    const inVal = parseFloat(inRaw) || 0;
    const decimalVal = ftVal + (inVal / 12);
    hiddenEl.value = Math.round(decimalVal * 10000) / 10000;
  }

  // Trigger auto-sync callbacks for regular, irregular side measurements, building dimensions & setbacks
  if (fieldId === 'regNorthSouth' || fieldId === 'regEastWest') {
    onRegularDimensionInput();
  } else if (fieldId.startsWith('side')) {
    calculatePlotAreaFromSides();
  } else if (fieldId === 'bldgWidth' || fieldId === 'bldgLength') {
    calculateBuiltUpArea();
    autoCalculateSetbacks(true);
    validateBuildingSetbackFeasibility();
  } else if (fieldId.startsWith('setback')) {
    if (hiddenEl) hiddenEl.dataset.manualEdit = 'true';
    validateBuildingSetbackFeasibility();
    if (typeof updateSetbackComplianceBadges === 'function') {
      updateSetbackComplianceBadges();
    }
  }

  if (typeof clearFieldError === 'function') {
    clearFieldError(fieldId, 'err-' + fieldId);
  }

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Parses diverse survey text formats into discrete feet and inches components.
 * Supports "30.6", "40' 6\"", "50-8", "60ft 4in", etc.
 * 
 * @function parseFeetInchesString
 * @param {string} rawText - Raw pasted or entered string
 * @returns {{ ft: string, in: string } | null}
 */
function parseFeetInchesString(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const cleaned = rawText.trim();
  if (!cleaned) return null;

  // Case 1: Standard decimal "30.6" or "30.11"
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const ft = parts[0].replace(/\D/g, '');
    const inPart = parts[1].replace(/\D/g, '').slice(0, 2);
    return { ft, in: inPart };
  }

  // Case 2: Architectural quote notation e.g. 30' 6" or 30'6
  if (cleaned.includes("'")) {
    const parts = cleaned.split("'");
    const ft = parts[0].replace(/\D/g, '');
    const inPart = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
    return { ft, in: inPart };
  }

  // Case 3: Hyphenated notation e.g. 30-6 or 30 - 6
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    const ft = parts[0].replace(/\D/g, '');
    const inPart = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
    return { ft, in: inPart };
  }

  // Case 4: Pure integer feet
  const digits = cleaned.replace(/\D/g, '');
  if (digits) {
    return { ft: digits, in: '' };
  }

  return null;
}

/**
 * Initializes smart numeric auto-tabbing and keyboard accelerators
 * across all .ft-in-wrapper inputs in the application.
 * 
 * @function initSmartFtInAutoTab
 * @returns {void}
 */
function initSmartFtInAutoTab() {
  if (typeof document === 'undefined') return;

  const wrappers = document.querySelectorAll('.ft-in-wrapper');
  wrappers.forEach(wrapper => {
    if (wrapper.dataset.autotabBound === 'true') return;
    wrapper.dataset.autotabBound = 'true';

    const ftInput = wrapper.querySelector('.ft-num-input');
    const inInput = wrapper.querySelector('.in-num-input');
    if (!ftInput || !inInput) return;

    const baseFieldId = ftInput.id.replace(/_ft$/, '');

    // 1. Delimiter navigation (. / Space / Enter / Comma) on Feet input
    ftInput.addEventListener('keydown', (e) => {
      if (['.', ' ', 'Enter', ','].includes(e.key)) {
        e.preventDefault();
        inInput.focus();
        inInput.select();
      }
    });

    // 2. 2-Digit Auto-advance when typing in Feet input
    ftInput.addEventListener('input', (e) => {
      if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
        return;
      }
      const val = ftInput.value;
      if (val && val.length >= 2 && !val.includes('.')) {
        setTimeout(() => {
          if (document.activeElement === ftInput) {
            inInput.focus();
            inInput.select();
          }
        }, 120);
      }
    });

    // 3. Smart Backspace Navigation (from empty Inches back to Feet)
    inInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && inInput.value === '') {
        e.preventDefault();
        ftInput.focus();
        const len = ftInput.value.length;
        try {
          ftInput.setSelectionRange(len, len);
        } catch (_) { }
      }
    });

    // 4. Smart Decimal / Dimension Paste Auto-Split
    ftInput.addEventListener('paste', (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;
      const text = clipboardData.getData('text');
      if (text && (text.includes('.') || text.includes("'") || text.includes('-'))) {
        const parsed = parseFeetInchesString(text);
        if (parsed) {
          e.preventDefault();
          ftInput.value = parsed.ft;
          inInput.value = parsed.in;
          if (typeof onFtInInput === 'function') {
            onFtInInput(baseFieldId);
          }
          inInput.focus();
          inInput.select();
        }
      }
    });
  });
}

// Auto-run if DOM already loaded or on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartFtInAutoTab);
  } else {
    initSmartFtInAutoTab();
  }
}

/**
 * Handles Building Type selection change.
 * If Vacant Plot is chosen, resets floors and built-up area and syncs with draft.
 * 
 * @function onBuildingTypeChange
 * @returns {void}
 */
function onBuildingTypeChange() {
  const bldgType = document.getElementById('bldgType')?.value || '';
  const isVacant = bldgType === 'Vacant Plot' || bldgType === 'vacant';

  if (isVacant) {
    const floorsSelect = document.getElementById('noOfFloors');
    if (floorsSelect) floorsSelect.value = 'Vacant Plot';

    const builtEl = document.getElementById('builtUpArea');
    if (builtEl) builtEl.value = '0';

    // Clear explicit footprint inputs
    ['bldgWidth', 'bldgLength', 'setbackFront', 'setbackRear', 'setbackLeft', 'setbackRight'].forEach(id => {
      const el = document.getElementById(id);
      const ftEl = document.getElementById(id + '_ft');
      const inEl = document.getElementById(id + '_in');
      if (el) el.value = '';
      if (ftEl) ftEl.value = '';
      if (inEl) inEl.value = '';
    });
  }

  if (typeof updateSetbackComplianceBadges === 'function') {
    updateSetbackComplianceBadges();
  }
  if (typeof validateBuildingSetbackFeasibility === 'function') {
    validateBuildingSetbackFeasibility();
  }
  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Auto-calculates Total Built-up Area (sq.ft) from Building Width, Length, and Floors multiplier.
 * Allows user to manually edit or override at any time.
 * 
 * @function calculateBuiltUpArea
 * @returns {void}
 */
function calculateBuiltUpArea() {
  const widthVal = parseFloat(document.getElementById('bldgWidth')?.value) || 0;
  const lengthVal = parseFloat(document.getElementById('bldgLength')?.value) || 0;
  const floorsSelect = document.getElementById('noOfFloors')?.value || '';

  if (widthVal <= 0 || lengthVal <= 0) return;

  const footprint = widthVal * lengthVal;

  let multiplier = 1;
  if (floorsSelect === 'Vacant Plot') multiplier = 0;
  else if (floorsSelect === 'Stilt + Ground') multiplier = 1.5;
  else if (floorsSelect === 'G+1') multiplier = 2;
  else if (floorsSelect === 'G+2') multiplier = 3;
  else if (floorsSelect === 'G+3') multiplier = 4;
  else if (floorsSelect === 'G+4') multiplier = 5;

  const totalSqFt = Math.round(footprint * multiplier);
  const builtEl = document.getElementById('builtUpArea');
  if (builtEl && totalSqFt >= 0) {
    builtEl.value = totalSqFt;
  }
}

/**
 * Auto-calculates Front, Rear, Left, and Right setbacks dynamically based on Step 3 Plot Spans
 * and Step 4 Building Footprint (Width & Length).
 * Automatically selects the optimal building orientation to prevent dimension mismatches.
 * Preserves explicit manual overrides on individual setback fields.
 * 
 * @function autoCalculateSetbacks
 * @param {boolean} [force=false] - Whether to force recalculation of auto fields.
 * @returns {void}
 */
function autoCalculateSetbacks(force = false) {
  const widthVal = parseFloat(document.getElementById('bldgWidth')?.value) || 0;
  const lengthVal = parseFloat(document.getElementById('bldgLength')?.value) || 0;

  if (widthVal <= 0 && lengthVal <= 0) return;

  // Retrieve Step 3 Site Spans
  const isOdd = document.getElementById('oddSiteCheck')?.checked;
  let north = 0, south = 0, east = 0, west = 0;

  if (isOdd) {
    north = parseFloat(document.getElementById('sideNorth')?.value) || 0;
    south = parseFloat(document.getElementById('sideSouth')?.value) || 0;
    east = parseFloat(document.getElementById('sideEast')?.value) || 0;
    west = parseFloat(document.getElementById('sideWest')?.value) || 0;
  } else {
    east = west = parseFloat(document.getElementById('regNorthSouth')?.value) || 0;
    north = south = parseFloat(document.getElementById('regEastWest')?.value) || 0;
  }

  // For irregular plots, use the shorter side measurement to bound setback clearance
  const spanNS = isOdd ? Math.min(east, west) : Math.max(east, west);
  const spanEW = isOdd ? Math.min(north, south) : Math.max(north, south);

  if (spanNS <= 0 && spanEW <= 0) return;

  const bldgOrient = document.getElementById('bldgOrientation')?.value || 'auto';

  // Alignment 1 (Vertical): Width on N/S span, Length on E/W span
  const fitA_Width = spanNS - widthVal;
  const fitA_Length = spanEW - lengthVal;
  const isFitA = fitA_Width >= 0 && fitA_Length >= 0;

  // Alignment 2 (Horizontal): Length on N/S span, Width on E/W span
  const fitB_Width = spanEW - widthVal;
  const fitB_Length = spanNS - lengthVal;
  const isFitB = fitB_Width >= 0 && fitB_Length >= 0;

  let widthSpan = spanNS;
  let lengthSpan = spanEW;

  if (bldgOrient === 'horizontal') {
    widthSpan = spanEW;
    lengthSpan = spanNS;
  } else if (bldgOrient === 'vertical') {
    widthSpan = spanNS;
    lengthSpan = spanEW;
  } else {
    // Auto-fit selection
    if (isFitB && !isFitA) {
      widthSpan = spanEW;
      lengthSpan = spanNS;
    } else if (!isFitA && !isFitB) {
      const deficitA = Math.min(0, fitA_Width) + Math.min(0, fitA_Length);
      const deficitB = Math.min(0, fitB_Width) + Math.min(0, fitB_Length);
      if (deficitB > deficitA) {
        widthSpan = spanEW;
        lengthSpan = spanNS;
      }
    }
  }

  // Calculate remaining clearance along selected width and length spans
  const remainWidth = Math.max(0, widthSpan - widthVal);
  const remainLength = Math.max(0, lengthSpan - lengthVal);

  // Convert clearance to total whole inches to prevent decimal rounding errors
  const remainWidthInches = Math.floor(remainWidth * 12 + 0.001);
  const remainLengthInches = Math.floor(remainLength * 12 + 0.001);

  // Equal split allocation in whole inches
  const leftInches = Math.floor(remainWidthInches / 2);
  const rightInches = Math.floor(remainWidthInches / 2);
  const frontInches = Math.floor(remainLengthInches / 2);
  const rearInches = Math.floor(remainLengthInches / 2);

  const calcLeft = leftInches / 12;
  const calcRight = rightInches / 12;
  const calcFront = frontInches / 12;
  const calcRear = rearInches / 12;

  // Populate setback input fields (unless manually locked by user)
  const populateField = (fieldId, totalFeet) => {
    const ftEl = document.getElementById(fieldId + '_ft');
    const inEl = document.getElementById(fieldId + '_in');
    const hiddenEl = document.getElementById(fieldId);

    if (!ftEl || !hiddenEl) return;

    // Is manually edited by user?
    const isManual = hiddenEl.dataset.manualEdit === 'true';

    if (force || !isManual || ftEl.value === '' || ftEl.value === '0') {
      const ft = Math.floor(totalFeet);
      const inches = Math.round((totalFeet - ft) * 12);
      ftEl.value = ft > 0 ? ft : (inches > 0 ? '0' : '');
      if (inEl) inEl.value = inches > 0 ? inches : '';
      hiddenEl.value = Math.round(totalFeet * 100) / 100;
    }
  };

  populateField('setbackFront', calcFront);
  populateField('setbackRear', calcRear);
  populateField('setbackLeft', calcLeft);
  populateField('setbackRight', calcRight);

  updateSetbackComplianceBadges();
}

/**
 * Evaluates real-time BBMP RMP-2015 recommended setback clearances and updates advisory badges.
 * 
 * @function updateSetbackComplianceBadges
 * @returns {void}
 */
function updateSetbackComplianceBadges() {
  const bldgType = document.getElementById('bldgType')?.value || '';
  const isVacant = bldgType === 'Vacant Plot' || bldgType === 'vacant';
  const plotAreaVal = parseFloat(document.getElementById('plotArea')?.value) || 0;

  // Determine BBMP RMP-2015 Recommended Minimums based on site area (Table 11 guidelines)
  let minFront = 3.28; // ~1.0m
  let minRear = 3.28;  // ~1.0m
  let minSide = 3.28;  // ~1.0m

  if (plotAreaVal > 0 && plotAreaVal <= 650) {
    minFront = 3.28;
    minRear = 0;
    minSide = 0;
  } else if (plotAreaVal > 650 && plotAreaVal <= 1300) {
    minFront = 3.28; // 1.0m
    minRear = 3.28;  // 1.0m
    minSide = 3.28;  // 1.0m
  } else if (plotAreaVal > 1300 && plotAreaVal <= 2600) {
    minFront = 4.92; // 1.5m (~5'0")
    minRear = 3.28;  // 1.0m
    minSide = 3.28;  // 1.0m
  } else if (plotAreaVal > 2600) {
    minFront = 6.56; // 2.0m (~6'7")
    minRear = 4.92;  // 1.5m
    minSide = 4.92;  // 1.5m
  }

  const checkBadge = (fieldId, recMin) => {
    const pill = document.getElementById('compliance_' + fieldId);
    if (!pill) return;

    if (isVacant) {
      pill.style.display = 'none';
      return;
    }

    const ftVal = document.getElementById(fieldId + '_ft')?.value;
    const inVal = document.getElementById(fieldId + '_in')?.value;
    if ((ftVal === '' || ftVal === undefined) && (inVal === '' || inVal === undefined)) {
      pill.style.display = 'none';
      return;
    }

    const currentVal = parseFloat(document.getElementById(fieldId)?.value) || 0;
    const formattedRec = formatFeetInches(recMin);

    pill.style.display = 'inline-block';
    if (recMin === 0 || currentVal >= (recMin - 0.05)) {
      pill.className = 'setback-compliance-pill compliant';
      pill.textContent = typeof t === 'function'
        ? t('step4.setback.compliant', { min: formattedRec })
        : `Compliant (Min ${formattedRec} rec.)`;
    } else {
      pill.className = 'setback-compliance-pill warning';
      pill.textContent = typeof t === 'function'
        ? t('step4.setback.warning', { min: formattedRec })
        : `Below RMP-2015 rec. min (${formattedRec})`;
    }
  };

  checkBadge('setbackFront', minFront);
  checkBadge('setbackRear', minRear);
  checkBadge('setbackLeft', minSide);
  checkBadge('setbackRight', minSide);
}

/**
 * Helper to format decimal feet into a clean feet-inches string (e.g. 40'-1").
 * 
 * @function formatFeetInches
 * @param {number} val - Decimal feet.
 * @returns {string}
 */
function formatFeetInches(val) {
  if (!val || isNaN(val) || val <= 0) return "0'";
  const ft = Math.floor(val);
  const inches = Math.round((val - ft) * 12);
  if (inches === 12) return `${ft + 1}'`;
  if (inches === 0) return `${ft}'`;
  return `${ft}'-${inches}"`;
}

/**
 * Validates whether proposed Building Width and Length fit within plot dimensions & setbacks from Step 3.
 * Automatically checks both standard and perpendicular orientation alignments.
 * Returns true if valid or if fields are left empty.
 * 
 * @function validateBuildingSetbackFeasibility
 * @returns {boolean} True if feasible or empty.
 */
function validateBuildingSetbackFeasibility() {
  const widthVal = parseFloat(document.getElementById('bldgWidth')?.value) || 0;
  const lengthVal = parseFloat(document.getElementById('bldgLength')?.value) || 0;

  const warningBanner = document.getElementById('setbackFeasibilityWarning');
  const warningText = document.getElementById('setbackFeasibilityText');
  const errWidth = document.getElementById('err-bldgWidth');
  const errLength = document.getElementById('err-bldgLength');

  // Reset error displays
  if (warningBanner) warningBanner.style.display = 'none';
  if (errWidth) errWidth.style.display = 'none';
  if (errLength) errLength.style.display = 'none';

  // Rule: Vacant Plot or empty fields -> Always valid
  const bldgType = document.getElementById('bldgType')?.value || '';
  if (bldgType === 'Vacant Plot' || bldgType === 'vacant' || (widthVal === 0 && lengthVal === 0)) {
    return true;
  }

  // Retrieve Step 3 Site Dimensions
  const isOdd = document.getElementById('oddSiteCheck')?.checked;
  let north = 0, south = 0, east = 0, west = 0;

  if (isOdd) {
    north = parseFloat(document.getElementById('sideNorth')?.value) || 0;
    south = parseFloat(document.getElementById('sideSouth')?.value) || 0;
    east = parseFloat(document.getElementById('sideEast')?.value) || 0;
    west = parseFloat(document.getElementById('sideWest')?.value) || 0;
  } else {
    east = west = parseFloat(document.getElementById('regNorthSouth')?.value) || 0;
    north = south = parseFloat(document.getElementById('regEastWest')?.value) || 0;
  }

  const spanNS = isOdd ? Math.min(east, west) : Math.max(east, west);
  const spanEW = isOdd ? Math.min(north, south) : Math.max(north, south);

  const maxPlotSpan = Math.max(spanNS, spanEW);

  // Retrieve Setbacks from Step 4
  const frontSetback = parseFloat(document.getElementById('setbackFront')?.value) || 0;
  const rearSetback = parseFloat(document.getElementById('setbackRear')?.value) || 0;
  const leftSetback = parseFloat(document.getElementById('setbackLeft')?.value) || 0;
  const rightSetback = parseFloat(document.getElementById('setbackRight')?.value) || 0;

  // Alignment Option A: Width along North/South (spanNS), Length along East/West (spanEW)
  const availWidthA = Math.max(0, spanNS - leftSetback - rightSetback);
  const availLengthA = Math.max(0, spanEW - frontSetback - rearSetback);
  const isOptionAValid = (spanNS > 0 && widthVal <= spanNS && widthVal <= (availWidthA || spanNS)) &&
    (spanEW > 0 && lengthVal <= spanEW && lengthVal <= (availLengthA || spanEW));

  // Alignment Option B: Length along North/South (spanNS), Width along East/West (spanEW)
  const availLengthB = Math.max(0, spanNS - frontSetback - rearSetback);
  const availWidthB = Math.max(0, spanEW - leftSetback - rightSetback);
  const isOptionBValid = (spanNS > 0 && lengthVal <= spanNS && lengthVal <= (availLengthB || spanNS)) &&
    (spanEW > 0 && widthVal <= spanEW && widthVal <= (availWidthB || spanEW));

  // If EITHER orientation fits the plot boundaries after setbacks, the proposal IS FEASIBLE!
  if (isOptionAValid || isOptionBValid) {
    return true; // 100% Valid!
  }

  // If NEITHER orientation fits, report explicit overflow
  let isFeasible = false;
  let errorMsgs = [];

  if (widthVal > maxPlotSpan && lengthVal > maxPlotSpan) {
    errorMsgs.push(`Both building width (${formatFeetInches(widthVal)}) and length (${formatFeetInches(lengthVal)}) exceed total plot span (${formatFeetInches(maxPlotSpan)}).`);
  } else if (widthVal > maxPlotSpan) {
    errorMsgs.push(`Building width (${formatFeetInches(widthVal)}) exceeds max plot span (${formatFeetInches(maxPlotSpan)}).`);
  } else if (lengthVal > maxPlotSpan) {
    errorMsgs.push(`Building length (${formatFeetInches(lengthVal)}) exceeds max plot span (${formatFeetInches(maxPlotSpan)}).`);
  } else {
    errorMsgs.push(`Proposed building footprint (${formatFeetInches(widthVal)} × ${formatFeetInches(lengthVal)}) exceeds available building space after setbacks on plot (${formatFeetInches(spanNS)} × ${formatFeetInches(spanEW)}).`);
  }

  if (!isFeasible) {
    if (warningBanner && warningText) {
      warningText.innerHTML = errorMsgs.join('<br>') + `<br><span style="display:inline-block; margin-top:6px; color: var(--apple-text-secondary);">Plot Spans: <strong>${formatFeetInches(spanNS)} (N/S) × ${formatFeetInches(spanEW)} (E/W)</strong>. Setbacks: Front ${formatFeetInches(frontSetback)}, Rear ${formatFeetInches(rearSetback)}, Left ${formatFeetInches(leftSetback)}, Right ${formatFeetInches(rightSetback)}.</span>`;
      warningBanner.style.display = 'block';
    }
  }

  return isFeasible;
}

/**
 * Toggles boundary input fields depending on whether boundary is a Public Road or Neighboring Property.
 * 
 * @function toggleBoundaryType
 * @param {string} dir - Direction key ('North', 'South', 'East', 'West').
 * @returns {void}
 */
function toggleBoundaryType(dir) {
  const typeEl = document.getElementById(`type${dir}`);
  const roadPanel = document.getElementById(`roadFields${dir}`);
  const plotPanel = document.getElementById(`plotFields${dir}`);

  if (!typeEl) return;
  const val = typeEl.value;

  if (val === 'road') {
    if (roadPanel) roadPanel.style.display = 'grid';
    if (plotPanel) plotPanel.style.display = 'none';

    if (dir === 'North') {
      const rWidth = document.getElementById('widthRoadNorth');
      const primaryW = document.getElementById('roadWidth');
      if (rWidth && primaryW && rWidth.value) {
        primaryW.value = rWidth.value;
      }
    }
  } else if (val !== '') {
    if (roadPanel) roadPanel.style.display = 'none';
    if (plotPanel) plotPanel.style.display = 'block';
  } else {
    if (roadPanel) roadPanel.style.display = 'none';
    if (plotPanel) plotPanel.style.display = 'none';
  }

  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Triggers a momentary green highlight and "✓ Applied" micro-interaction on a preset chip.
 * 
 * @function triggerSmartFillChipAnimation
 * @param {HTMLElement} btnEl - The chip button element that was clicked.
 * @returns {void}
 */
function triggerSmartFillChipAnimation(btnEl) {
  if (!btnEl || typeof btnEl !== 'object' || btnEl === window || (typeof globalThis !== 'undefined' && btnEl === globalThis)) {
    return;
  }
  if (!btnEl.dataset) {
    btnEl.dataset = {};
  }
  if (!btnEl.classList) {
    btnEl.classList = {
      add: () => { },
      remove: () => { },
      contains: () => false
    };
  }
  if (btnEl._revertTimer) {
    clearTimeout(btnEl._revertTimer);
  }

  // 1. Lock exact computed width to prevent any chip resizing / layout shift
  if (!btnEl.dataset.origWidth) {
    const rect = typeof btnEl.getBoundingClientRect === 'function' ? btnEl.getBoundingClientRect() : null;
    const currentW = rect && rect.width ? Math.ceil(rect.width) : (btnEl.offsetWidth || 0);
    if (currentW > 0) {
      btnEl.dataset.origWidth = `${currentW}px`;
      btnEl.style.minWidth = `${currentW}px`;
      btnEl.style.justifyContent = 'center';
      btnEl.style.textAlign = 'center';
    }
  }

  // 2. Preserve original HTML markup if not already cached
  if (!btnEl.dataset.origHtml) {
    btnEl.dataset.origHtml = btnEl.innerHTML || btnEl.textContent || '';
  }

  // Resolve localized text
  const isKn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'kn') ||
    (typeof currentLanguage !== 'undefined' && currentLanguage === 'kn') ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('eplan_lang_preference') === 'kn');

  const appliedLabel = isKn ? '✓ ಅನ್ವಯಿಸಲಾಗಿದೆ' : '✓ Applied';

  // 3. Smooth Fade-Out -> Swap -> Fade-In
  btnEl.classList.add('fading');
  setTimeout(() => {
    btnEl.textContent = appliedLabel;
    btnEl.classList.add('applied');
    btnEl.classList.remove('fading');
  }, 120);

  // 4. Revert smoothly after 1200ms
  btnEl._revertTimer = setTimeout(() => {
    btnEl.classList.add('fading');
    setTimeout(() => {
      btnEl.classList.remove('applied');
      if (btnEl.dataset && btnEl.dataset.origHtml) {
        btnEl.innerHTML = btnEl.dataset.origHtml;
        delete btnEl.dataset.origHtml;
      }
      btnEl.classList.remove('fading');
      if (btnEl.dataset && btnEl.dataset.origWidth) {
        btnEl.style.minWidth = '';
        btnEl.style.justifyContent = '';
        btnEl.style.textAlign = '';
        delete btnEl.dataset.origWidth;
      }
    }, 120);
  }, 1200);
}

/**
 * Standard Bangalore Plot Dimension Presets dictionary.
 */
const STEP3_SMART_FILL_PRESETS = {
  '30x40': { nsFt: 30, nsIn: 0, ewFt: 40, ewIn: 0, area: 1200, roadWidthFt: 30, roadFacing: 'north' },
  '40x60': { nsFt: 40, nsIn: 0, ewFt: 60, ewIn: 0, area: 2400, roadWidthFt: 40, roadFacing: 'east' },
  '30x50': { nsFt: 30, nsIn: 0, ewFt: 50, ewIn: 0, area: 1500, roadWidthFt: 30, roadFacing: 'north' },
  '20x30': { nsFt: 20, nsIn: 0, ewFt: 30, ewIn: 0, area: 600, roadWidthFt: 25, roadFacing: 'north' },
  '50x80': { nsFt: 50, nsIn: 0, ewFt: 80, ewIn: 0, area: 4000, roadWidthFt: 50, roadFacing: 'east' }
};

/**
 * Applies a 1-tap standard Bangalore dimension preset on Step 3.
 * Populates plot dimensions, area, front road width, facing direction, and defaults scale to 1:100.
 * 
 * @function applyStep3SmartFill
 * @param {string} presetId - Preset key ('30x40', '40x60', etc.).
 * @param {HTMLElement} [btnEl] - The clicked chip element.
 * @returns {void}
 */
function applyStep3SmartFill(presetId, btnEl) {
  const preset = STEP3_SMART_FILL_PRESETS[presetId];
  if (!preset) return;

  const oddCheck = document.getElementById('oddSiteCheck');
  if (oddCheck && oddCheck.checked) {
    oddCheck.checked = false;
    if (typeof toggleOddSite === 'function') toggleOddSite();
  }

  const nsFtEl = document.getElementById('regNorthSouth_ft');
  const nsInEl = document.getElementById('regNorthSouth_in');
  const ewFtEl = document.getElementById('regEastWest_ft');
  const ewInEl = document.getElementById('regEastWest_in');
  const areaEl = document.getElementById('plotArea');
  const rwFtEl = document.getElementById('roadWidth_ft');
  const rwInEl = document.getElementById('roadWidth_in');
  const rfEl = document.getElementById('roadFacing');
  const scaleEl = document.getElementById('scale');

  if (nsFtEl) nsFtEl.value = preset.nsFt;
  if (nsInEl) nsInEl.value = preset.nsIn;
  if (ewFtEl) ewFtEl.value = preset.ewFt;
  if (ewInEl) ewInEl.value = preset.ewIn;

  if (areaEl) {
    areaEl.value = preset.area;
    areaEl.dataset.userEdited = 'true';
  }

  if (rwFtEl) rwFtEl.value = preset.roadWidthFt;
  if (rwInEl) rwInEl.value = 0;
  if (rfEl) rfEl.value = preset.roadFacing;

  // Ensure default drawing scale is 1:100
  if (scaleEl && !scaleEl.value) {
    scaleEl.value = '1:100';
  }

  if (typeof onFtInInput === 'function') {
    onFtInInput('regNorthSouth');
    onFtInInput('regEastWest');
    onFtInInput('roadWidth');
  }

  if (typeof clearFieldError === 'function') {
    clearFieldError('plotArea', 'err-plotArea');
    clearFieldError('roadWidth', 'err-roadWidth');
    clearFieldError('roadFacing', 'err-roadFacing');
    clearFieldError('regNorthSouth', 'err-regNorthSouth');
    clearFieldError('regEastWest', 'err-regEastWest');
  }

  if (typeof autoCalculateSetbacks === 'function') {
    autoCalculateSetbacks();
  }

  // Automatically derive & synchronize Step 5 Schedule of Property from Step 3
  deriveStep5FromStep3({ overwriteDescriptions: false });

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();

  if (btnEl) triggerSmartFillChipAnimation(btnEl);
}

/**
 * Intelligently derives and synchronizes Step 5 Schedule of Boundaries from Step 3 inputs.
 * Sets the matching boundary to 'road' with the road width from Step 3,
 * and sets other boundaries to 'plot' with default placeholder/description if empty.
 * 
 * @function deriveStep5FromStep3
 * @param {Object} [options]
 * @param {boolean} [options.overwriteDescriptions=false] - If true, resets plot descriptions to standard deed defaults.
 * @param {HTMLElement} [options.btnEl] - Optional button trigger for animated feedback.
 * @returns {void}
 */
function deriveStep5FromStep3(options = {}) {
  const facingEl = document.getElementById('roadFacing');
  const rwFtEl = document.getElementById('roadWidth_ft');
  const rwInEl = document.getElementById('roadWidth_in');

  const facing = (facingEl && facingEl.value) ? facingEl.value.toLowerCase().trim() : 'north';
  const rwFt = (rwFtEl && rwFtEl.value) ? parseFloat(rwFtEl.value) : 30;
  const rwIn = (rwInEl && rwInEl.value) ? parseFloat(rwInEl.value) : 0;
  const totalRoadWidth = rwFt + (rwIn / 12);

  const directionMap = {
    'north': 'North',
    'south': 'South',
    'east': 'East',
    'west': 'West'
  };

  const roadDir = directionMap[facing] || 'North';

  ['North', 'South', 'East', 'West'].forEach(dir => {
    const typeEl = document.getElementById('type' + dir);
    if (dir === roadDir) {
      if (typeEl) {
        typeEl.value = 'road';
        if (typeof toggleBoundaryType === 'function') toggleBoundaryType(dir);
      }
      const nameEl = document.getElementById('nameRoad' + dir);
      const widthEl = document.getElementById('widthRoad' + dir);
      const widthFtEl = document.getElementById('widthRoad' + dir + '_ft');
      const widthInEl = document.getElementById('widthRoad' + dir + '_in');

      if (nameEl && (!nameEl.value || nameEl.value.trim() === '' || options.overwriteDescriptions)) {
        nameEl.value = 'Main Road';
      }
      if (widthEl) widthEl.value = Math.round(totalRoadWidth * 100) / 100;
      if (widthFtEl) widthFtEl.value = rwFt;
      if (widthInEl) widthInEl.value = rwIn;
    } else {
      if (typeEl) {
        if (typeEl.value === 'road' || !typeEl.value || options.overwriteDescriptions) {
          typeEl.value = 'plot';
          if (typeof toggleBoundaryType === 'function') toggleBoundaryType(dir);
        }
      }
      const descEl = document.getElementById('descPlot' + dir);
      if (descEl && (!descEl.value || descEl.value.trim() === '' || options.overwriteDescriptions)) {
        descEl.value = 'Private Property';
      }
    }

    if (typeof clearFieldError === 'function') {
      clearFieldError('type' + dir, 'err-type' + dir);
    }
  });

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();

  if (options.btnEl && typeof triggerSmartFillChipAnimation === 'function') {
    triggerSmartFillChipAnimation(options.btnEl);
  }
}

/**
 * Handler for road facing dropdown change in Step 3.
 * Automatically synchronizes Step 5 boundaries.
 */
function onRoadFacingChange() {
  if (typeof clearFieldError === 'function') {
    clearFieldError('roadFacing', 'err-roadFacing');
  }
  deriveStep5FromStep3({ overwriteDescriptions: false });
}

/**
 * Standard Deed DNA Boundary Presets dictionary.
 */
const STEP5_SMART_FILL_PRESETS = {
  'north_road': {
    North: { type: 'road', name: 'Main Road', width: 30 },
    South: { type: 'plot', desc: 'Site No. 45' },
    East: { type: 'plot', desc: 'Site No. 42' },
    West: { type: 'plot', desc: 'Site No. 40' }
  },
  'east_road': {
    North: { type: 'plot', desc: 'Site No. 18' },
    South: { type: 'plot', desc: 'Site No. 20' },
    East: { type: 'road', name: 'Main Road', width: 30 },
    West: { type: 'plot', desc: 'Site No. 12' }
  },
  'south_road': {
    North: { type: 'plot', desc: 'Site No. 10' },
    South: { type: 'road', name: 'Main Road', width: 30 },
    East: { type: 'plot', desc: 'Site No. 15' },
    West: { type: 'plot', desc: 'Site No. 14' }
  },
  'west_road': {
    North: { type: 'plot', desc: 'Site No. 25' },
    South: { type: 'plot', desc: 'Site No. 27' },
    East: { type: 'plot', desc: 'Site No. 30' },
    West: { type: 'road', name: 'Main Road', width: 30 }
  },
  'corner_ne': {
    North: { type: 'road', name: 'Main Road', width: 30 },
    East: { type: 'road', name: 'Cross Road', width: 30 },
    South: { type: 'plot', desc: 'Site No. 08' },
    West: { type: 'plot', desc: 'Site No. 06' }
  }
};

/**
 * Applies a 1-tap standard Deed DNA boundary layout preset on Step 5.
 * 
 * @function applyStep5SmartFill
 * @param {string} presetId - Preset key ('north_road', 'east_road', etc.).
 * @param {HTMLElement} [btnEl] - The clicked chip element.
 * @returns {void}
 */
function applyStep5SmartFill(presetId, btnEl) {
  const preset = STEP5_SMART_FILL_PRESETS[presetId];
  if (!preset) return;

  const directions = ['North', 'South', 'East', 'West'];
  directions.forEach(dir => {
    const cfg = preset[dir];
    if (!cfg) return;

    const typeEl = document.getElementById('type' + dir);
    if (typeEl) {
      typeEl.value = cfg.type;
      toggleBoundaryType(dir);
    }

    if (cfg.type === 'road') {
      const nameEl = document.getElementById('nameRoad' + dir);
      const widthEl = document.getElementById('widthRoad' + dir);
      const widthFtEl = document.getElementById('widthRoad' + dir + '_ft');
      const widthInEl = document.getElementById('widthRoad' + dir + '_in');

      if (nameEl) nameEl.value = cfg.name;
      if (widthEl) widthEl.value = cfg.width;
      if (widthFtEl) widthFtEl.value = cfg.width;
      if (widthInEl) widthInEl.value = 0;
    } else if (cfg.type === 'plot' || cfg.type === 'private') {
      const descEl = document.getElementById('descPlot' + dir);
      if (descEl) descEl.value = cfg.desc;
    }

    if (typeof clearFieldError === 'function') {
      clearFieldError('type' + dir, 'err-type' + dir);
    }
  });

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();

  if (btnEl) triggerSmartFillChipAnimation(btnEl);
}

/**
 * Toggles visibility of RMP-2015 Master Plan Road Widening controls panel.
 * 
 * @function toggleRoadWidening
 * @returns {void}
 */
function toggleRoadWidening() {
  const isEnabled = document.getElementById('roadWideningCheck').checked;
  const panel = document.getElementById('roadWideningControls');
  if (panel) {
    panel.style.display = isEnabled ? 'block' : 'none';
  }
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Toggles visibility of Drain / Nala / Lake Buffer Zone controls panel.
 * 
 * @function toggleBufferZone
 * @returns {void}
 */
function toggleBufferZone() {
  const isEnabled = document.getElementById('bufferCheck').checked;
  const panel = document.getElementById('bufferControls');
  if (panel) {
    panel.style.display = isEnabled ? 'block' : 'none';
  }
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Toggles visibility of diagonal SAMPLE ONLY watermark on SVG canvas.
 * 
 * @function toggleSampleWatermark
 * @returns {void}
 */
function toggleSampleWatermark() {
  const watermarkGroup = document.getElementById('watermarkGroup');
  const isChecked = document.getElementById('sampleWatermarkCheck') ? document.getElementById('sampleWatermarkCheck').checked : false;
  if (watermarkGroup) {
    watermarkGroup.style.display = isChecked ? 'block' : 'none';
  }
}

/**
 * Toggles visibility of Page 2 (BBMP Official Line & Colour Specifications Sheet).
 * 
 * @function toggleLegendSheetPage
 * @returns {void}
 */
function toggleLegendSheetPage() {
  const legendSheet = document.getElementById('legendSheetOutput');
  const statusHint = document.getElementById('printPackageStatusHint');
  const isChecked = document.getElementById('includeLegendPage') ? document.getElementById('includeLegendPage').checked : true;

  if (legendSheet) {
    legendSheet.style.display = isChecked ? 'block' : 'none';
  }

  if (statusHint) {
    statusHint.innerHTML = isChecked
      ? '📄 <strong>Document Content:</strong> 2-Page Consolidated Package (Page 1: Single Plot Layout Plan + Page 2: BBMP Line & Colour Specifications Sheet).'
      : '📄 <strong>Document Content:</strong> 1-Page Layout Plan (Page 2 Legend Specifications Sheet disabled).';
  }
}

/**
 * Toggles expanding Sakala FAQ accordion items.
 * 
 * @function toggleFaq
 * @param {HTMLElement} el - Question header element clicked.
 * @returns {void}
 */
function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const icon = el.querySelector('span:last-child');
  if (!answer) return;

  const isOpen = answer.style.display === 'block';
  answer.style.display = isOpen ? 'none' : 'block';
  if (icon) icon.textContent = isOpen ? '+' : '−';
}

/**
 * Switches view tab on mobile (< 1024px) between Setup Form and Live Preview.
 * 
 * @function switchMobileTab
 * @param {string} tabName - 'wizard' or 'preview'.
 * @returns {void}
 */
function switchMobileTab(tabName) {
  const wizardCol = document.getElementById('wizardCol');
  const previewCol = document.getElementById('previewCol');
  const tabW = document.getElementById('mobileTabWizard');
  const tabP = document.getElementById('mobileTabPreview');

  if (tabName === 'wizard') {
    if (wizardCol) wizardCol.style.display = 'block';
    if (previewCol) previewCol.style.display = 'none';
    if (tabW) tabW.classList.add('active');
    if (tabP) tabP.classList.remove('active');
  } else {
    if (wizardCol) wizardCol.style.display = 'none';
    if (previewCol) previewCol.style.display = 'block';
    if (tabW) tabW.classList.remove('active');
    if (tabP) tabP.classList.add('active');

    if (typeof generatePlan === 'function') generatePlan();
  }
}

/**
 * Direct client-side PDF file download using jsPDF + html2canvas.
 * Downloads multi-page A4 PDF file directly into user's Downloads folder WITHOUT opening print UI.
 * 
 * @function downloadPDFPackage
 * @returns {Promise<void>}
 */
async function downloadPDFPackage() {
  const legalCheck = document.getElementById('legalConsentCheck');
  if (legalCheck && !legalCheck.checked) {
    if (typeof goToStep === 'function') goToStep(7);
    const errLegal = document.getElementById('err-legalConsent');
    if (errLegal) errLegal.style.display = 'block';
    alert('⚖️ Legal Consent Required:\n\nPlease check the "I Agree to Terms of Service, Privacy Policy & Zero Liability Disclaimer" checkbox in Step 7 before downloading your PDF package.');
    return;
  }

  const downloadBtn = document.getElementById('downloadPdfBtn');
  const originalBtnText = downloadBtn ? downloadBtn.innerHTML : '';
  if (downloadBtn) {
    downloadBtn.innerHTML = '<span>⏳ Generating PDF...</span>';
    downloadBtn.disabled = true;
  }

  try {
    const pid = document.getElementById('pidNo') ? document.getElementById('pidNo').value.trim() : '';
    const survey = document.getElementById('surveyNo') ? document.getElementById('surveyNo').value.trim().replace(/[/\\?%*:|"<>]/g, '-') : '';
    const fileName = `BBMP_Single_Plot_Plan_${pid || survey || 'Sakala'}.pdf`;

    document.body.classList.add('pdf-export-active');

    if (typeof generatePlan === 'function') generatePlan();
    toggleLegendSheetPage();

    // Ensure all signature & map images are fully decoded before html2canvas captures
    const activeImages = Array.from(document.querySelectorAll('#planOutput img, #legendSheetOutput img'))
      .filter(img => img && img.style.display !== 'none' && img.src);
    await Promise.all(activeImages.map(img => (img.decode ? img.decode().catch(() => { }) : Promise.resolve())));

    if (!window.jspdf || !window.html2canvas) {
      throw new Error('PDF Export libraries unavailable');
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Render Page 1 (Layout Plan Sheet) directly from visible DOM
    const page1Frame = document.querySelector('#planOutput .plan-sheet-frame');
    const canvas1 = await html2canvas(page1Frame, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
    const imgProps1 = pdf.getImageProperties(imgData1);
    const renderHeight1 = (imgProps1.height * (pdfWidth - 10)) / imgProps1.width;

    pdf.addImage(imgData1, 'JPEG', 5, 5, pdfWidth - 10, Math.min(renderHeight1, pdfHeight - 10));

    // Render Page 2 (Legend Sheet) if enabled
    const includeLegend = document.getElementById('includeLegendPage') ? document.getElementById('includeLegendPage').checked : true;
    const legendSheet = document.getElementById('legendSheetOutput');

    if (includeLegend && legendSheet) {
      legendSheet.style.display = 'block';
      const page2Frame = document.querySelector('#legendSheetOutput .plan-sheet-frame');
      const canvas2 = await html2canvas(page2Frame, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
      const imgProps2 = pdf.getImageProperties(imgData2);
      const renderHeight2 = (imgProps2.height * (pdfWidth - 10)) / imgProps2.width;

      pdf.addPage();
      pdf.addImage(imgData2, 'JPEG', 5, 5, pdfWidth - 10, Math.min(renderHeight2, pdfHeight - 10));
    }

    // Trigger instant browser file download directly into Downloads folder
    pdf.save(fileName);

  } catch (err) {
    console.error('Direct PDF Export Failed:', err);
    printPlanPackage();
  } finally {
    document.body.classList.remove('pdf-export-active');
    if (downloadBtn) {
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
    }
  }
}

/**
 * Pre-configures page breaks and multi-page visibility before invoking window.print().
 * Opens native browser printer popup for physical paper printing.
 * 
 * @function printPlanPackage
 * @returns {void}
 */
function printPlanPackage() {
  const legalCheck = document.getElementById('legalConsentCheck');
  if (legalCheck && !legalCheck.checked) {
    if (typeof goToStep === 'function') goToStep(7);
    const errLegal = document.getElementById('err-legalConsent');
    if (errLegal) errLegal.style.display = 'block';
    alert('⚖️ Legal Consent Required:\n\nPlease check the "I Agree to Terms of Service, Privacy Policy & Zero Liability Disclaimer" checkbox in Step 7 before printing your plan package.');
    return;
  }

  if (typeof generatePlan === 'function') generatePlan();
  toggleLegendSheetPage();

  const viewport = document.getElementById('exportViewportSection');
  if (viewport) {
    viewport.style.display = 'block';
  }

  setTimeout(() => {
    window.print();
  }, 100);
}


/**
 * Global Plan Generation State Flag
 */
let isPlanGenerated = false;

/**
 * Formats detailed boundary summary description (Road details / Adjacent property info) for Step 7.
 * 
 * @function formatBoundarySummary
 * @param {string} dir - Cardinal direction ('North', 'South', 'East', 'West').
 * @returns {string} Formatted boundary summary label.
 */
function formatBoundarySummary(dir) {
  const typeEl = document.getElementById('type' + dir);
  if (!typeEl || !typeEl.value) return '—';

  const type = typeEl.value;
  if (type === 'road') {
    const name = document.getElementById('nameRoad' + dir)?.value.trim();
    const widthFt = document.getElementById('widthRoad' + dir + '_ft')?.value.trim();
    const widthIn = document.getElementById('widthRoad' + dir + '_in')?.value.trim();
    let widthStr = '';
    if (widthFt || widthIn) {
      widthStr = ` (${widthFt || 0}'${widthIn ? widthIn + '"' : ''} Wide)`;
    }
    return `Road Access${name ? ': ' + name : ''}${widthStr}`;
  } else if (type === 'private') {
    const desc = document.getElementById('descPlot' + dir)?.value.trim();
    return `Private Property${desc ? ' (' + desc + ')' : ''}`;
  } else if (type === 'gov') {
    const desc = document.getElementById('descPlot' + dir)?.value.trim();
    return `Government Property${desc ? ' (' + desc + ')' : ''}`;
  } else if (type === 'drain') {
    return 'Stormwater Drain / Nala';
  }
  return type;
}

/**
 * Formats raw GPS input (including Google Maps URLs) into a clean, professional lat/lon string.
 * @function formatGpsSummary
 * @returns {string}
 */
function formatGpsSummary() {
  const rawGps = (document.getElementById('gpsCoords')?.value || '').trim();
  if (!rawGps) return '—';
  if (typeof parseCoordinates === 'function') {
    const coords = parseCoordinates(rawGps);
    if (coords) {
      const latDir = coords.lat >= 0 ? 'N' : 'S';
      const lonDir = coords.lon >= 0 ? 'E' : 'W';
      return `${Math.abs(coords.lat).toFixed(5)}° ${latDir}, ${Math.abs(coords.lon).toFixed(5)}° ${lonDir}`;
    }
  }
  return rawGps;
}

/**
 * Dynamically builds the formatted property data summary grid for Step 7.
 * 
 * @function buildReviewSummary
 * @returns {void}
 */
function buildReviewSummary() {
  const container = document.getElementById('reviewSummaryContainer');
  if (!container) return;

  const isOdd = document.getElementById('oddSiteCheck')?.checked;
  const isRoadWidening = document.getElementById('roadWideningCheck')?.checked;
  const isBuffer = document.getElementById('bufferCheck')?.checked;

  const sections = [
    {
      title: typeof t === 'function' ? t('review.revenue') : '🏛️ Revenue & Property Records',
      step: 1,
      fields: [
        { id: 'ownerName', label: 'Owner Name(s)' },
        { id: 'epId', label: 'eKhata ID (ePID)' },
        { id: 'pidNo', label: 'BBMP PID' },
        { id: 'sasNo', label: 'SAS Tax Application No' },
        { id: 'surveyNo', label: 'Survey / Sy No' },
        { id: 'wardNo', label: 'Ward No' },
        { id: 'adlrNo', label: 'ADLR 11E Sketch No' },
        { id: 'dcOrderNo', label: 'DC Conversion Order No' },
        { id: 'dcOrderDate', label: 'DC Order Date' },
        { id: 'dcAuthority', label: 'Issuing Authority' }
      ]
    },
    {
      title: typeof t === 'function' ? t('review.location') : '📍 Location & Address',
      step: 2,
      fields: [
        { id: 'address', label: 'Property Address' },
        { id: 'plotNo', label: 'Site / Plot Number' },
        { id: 'gpsCoords', label: 'GPS Co-ordinates', customVal: formatGpsSummary() },
        { id: 'wardName', label: 'Ward / Area Name' },
        { id: 'bbmpZone', label: 'BBMP Zone' }
      ]
    },
    {
      title: typeof t === 'function' ? t('review.measurements') : '📐 Plot Measurements & Geometry',
      step: 3,
      fields: [
        { id: 'oddSiteCheck', label: 'Plot Type', customVal: isOdd ? 'Irregular (4-Side Measurement)' : 'Regular (Rectangular / Square)' },
        { id: 'plotArea', label: 'Total Plot Area (sq.ft)' },
        { id: 'roadFacing', label: 'Road Facing Direction' },
        { id: 'roadWidth', label: 'Front Road Width', isFtIn: true },
        { id: 'scale', label: 'Drawing Scale' },
        ...(isOdd ? [
          { id: 'sideNorth', label: 'North Side Dimension', isFtIn: true },
          { id: 'sideSouth', label: 'South Side Dimension', isFtIn: true },
          { id: 'sideEast', label: 'East Side Dimension', isFtIn: true },
          { id: 'sideWest', label: 'West Side Dimension', isFtIn: true }
        ] : [
          { id: 'regEastWest', label: 'East–West Span (North & South Boundaries)', isFtIn: true },
          { id: 'regNorthSouth', label: 'North–South Span (East & West Boundaries / Frontage)', isFtIn: true }
        ])
      ]
    },
    {
      title: typeof t === 'function' ? t('review.structure') : '🏗️ Building Footprint & Setbacks',
      step: 4,
      fields: [
        { id: 'bldgType', label: 'Building Type' },
        { id: 'noOfFloors', label: 'Number of Floors' },
        { id: 'bldgOrientation', label: 'Footprint Alignment' },
        { id: 'bldgWidth', label: 'Building Width', isFtIn: true },
        { id: 'bldgLength', label: 'Building Length', isFtIn: true },
        { id: 'builtUpArea', label: 'Total Built-up Area (sq.ft)' },
        { id: 'setbackFront', label: 'Front Setback', isFtIn: true },
        { id: 'setbackRear', label: 'Rear Setback', isFtIn: true },
        { id: 'setbackLeft', label: 'Left Setback', isFtIn: true },
        { id: 'setbackRight', label: 'Right Setback', isFtIn: true }
      ]
    },
    {
      title: typeof t === 'function' ? t('review.boundaries') : '📜 Deed DNA Boundaries',
      step: 5,
      fields: [
        { id: 'typeNorth', label: 'North Boundary', customVal: formatBoundarySummary('North') },
        { id: 'typeSouth', label: 'South Boundary', customVal: formatBoundarySummary('South') },
        { id: 'typeEast', label: 'East Boundary', customVal: formatBoundarySummary('East') },
        { id: 'typeWest', label: 'West Boundary', customVal: formatBoundarySummary('West') }
      ]
    },
    {
      title: typeof t === 'function' ? t('review.constraints') : '🚧 Constraints & Fees',
      step: 6,
      fields: [
        { id: 'roadWideningCheck', label: 'Road Widening Affected', isCheckbox: true },
        ...(isRoadWidening ? [
          { id: 'proposedRoadWidth', label: 'Proposed Road Width', isFtIn: true },
          { id: 'roadWideningStripWidth', label: 'Road Widening Strip Width', isFtIn: true }
        ] : []),
        { id: 'bufferCheck', label: 'Drain / Buffer Zone Affected', isCheckbox: true },
        ...(isBuffer ? [
          { id: 'bufferType', label: 'Buffer Type' },
          { id: 'bufferWidth', label: 'Buffer Width', isFtIn: true }
        ] : []),
        { id: 'challanFee', label: 'Challan Fee Amount (₹)' },
        { id: 'challanNo', label: 'Challan Number' },
        { id: 'challanDate', label: 'Challan Date' },
        { id: 'architectName', label: 'Architect / Surveyor Name' },
        { id: 'architectRegNo', label: 'COA / BBMP Reg. No' },
        { id: 'ownerSigData', label: 'Owner Signature', customVal: document.getElementById('ownerSigData')?.value ? 'Uploaded (Digital)' : 'Not Uploaded (Physical Signature)' },
        { id: 'archSigData', label: 'Architect Seal / Sign', customVal: document.getElementById('archSigData')?.value ? 'Uploaded (Digital)' : 'Not Uploaded (Physical Seal)' },
        { id: 'includeLegendPage', label: 'Include Page 2 Legend Sheet', isCheckbox: true },
        { id: 'sampleWatermarkCheck', label: 'Sample Draft Watermark', isCheckbox: true }
      ]
    }
  ];

  let html = '<div class="review-summary-grid">';

  sections.forEach((sec, idx) => {
    // Only section 1 is open by default (idx === 0)
    const isOpen = (idx === 0);

    html += `
      <div class="review-summary-card ${isOpen ? 'open' : 'collapsed'}" id="reviewCard${sec.step}">
        <div class="review-summary-header" onclick="toggleReviewSection(${sec.step})">
          <div class="review-header-title-wrap">
            <span class="material-symbols-outlined review-chevron">${isOpen ? 'expand_more' : 'chevron_right'}</span>
            <h4>${sec.title}</h4>
            <span class="review-item-count">(${sec.fields.length})</span>
          </div>
          <div class="review-header-actions" onclick="event.stopPropagation()">
            <button type="button" class="review-edit-btn" onclick="goToStep(${sec.step})" title="Edit ${sec.title}">
              <span class="material-symbols-outlined" style="font-size: 13px;">edit</span> Edit
            </button>
          </div>
        </div>
        <div class="review-fields-list" style="${isOpen ? 'display: block;' : 'display: none;'}">
    `;

    sec.fields.forEach(f => {
      let val = '—';
      if (f.customVal !== undefined) {
        val = f.customVal;
      } else if (f.isCheckbox) {
        const el = document.getElementById(f.id);
        val = (el && el.checked) ? 'Yes' : 'No';
      } else if (f.isFtIn) {
        const ftEl = document.getElementById(f.id + '_ft');
        const inEl = document.getElementById(f.id + '_in');
        const ftVal = ftEl ? ftEl.value.trim() : '';
        const inVal = inEl ? inEl.value.trim() : '';
        if (ftVal !== '' || inVal !== '') {
          val = `${ftVal || '0'} ft ${inVal ? inVal + ' in' : ''}`;
        } else {
          const hiddenEl = document.getElementById(f.id);
          if (hiddenEl && hiddenEl.value) {
            val = `${hiddenEl.value} ft`;
          }
        }
      } else {
        const el = document.getElementById(f.id);
        if (el && el.value && el.value.trim() !== '') {
          val = el.value.trim();
        }
      }

      html += `
        <div class="review-field-row" onclick="editFieldFromReview(${sec.step}, '${f.id}')" title="Click to edit ${f.label}">
          <span class="field-label">${f.label}:</span>
          <span class="field-value">${val}</span>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Toggles accordion collapse/expand state for a specific summary section card.
 * 
 * @function toggleReviewSection
 * @param {number} stepNum - Step number (1 to 6).
 * @returns {void}
 */
function toggleReviewSection(stepNum) {
  const card = document.getElementById(`reviewCard${stepNum}`);
  if (!card) return;
  const list = card.querySelector('.review-fields-list');
  const chevron = card.querySelector('.review-chevron');
  const isCurrentlyOpen = card.classList.contains('open');

  if (isCurrentlyOpen) {
    card.classList.remove('open');
    card.classList.add('collapsed');
    if (list) list.style.display = 'none';
    if (chevron) chevron.textContent = 'chevron_right';
  } else {
    card.classList.add('open');
    card.classList.remove('collapsed');
    if (list) list.style.display = 'block';
    if (chevron) chevron.textContent = 'expand_more';
  }
}

/**
 * Expands or collapses all summary section cards simultaneously.
 * 
 * @function toggleAllReviewSections
 * @param {boolean} expand - True to open all, false to collapse all.
 * @returns {void}
 */
function toggleAllReviewSections(expand) {
  document.querySelectorAll('.review-summary-card').forEach(card => {
    const list = card.querySelector('.review-fields-list');
    const chevron = card.querySelector('.review-chevron');
    if (expand) {
      card.classList.add('open');
      card.classList.remove('collapsed');
      if (list) list.style.display = 'block';
      if (chevron) chevron.textContent = 'expand_more';
    } else {
      card.classList.remove('open');
      card.classList.add('collapsed');
      if (list) list.style.display = 'none';
      if (chevron) chevron.textContent = 'chevron_right';
    }
  });
}

/**
 * Navigates directly to target step, focuses field, and flashes highlight glow.
 * 
 * @function editFieldFromReview
 * @param {number} stepNum - Target wizard step number.
 * @param {string} fieldId - Target input element ID.
 * @returns {void}
 */
function editFieldFromReview(stepNum, fieldId) {
  if (typeof goToStep === 'function') {
    goToStep(stepNum);
  }
  setTimeout(() => {
    const target = document.getElementById(fieldId + '_ft') || document.getElementById(fieldId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const parentField = target.closest('.field') || target;
      parentField.classList.add('field-highlight-flash');
      setTimeout(() => {
        parentField.classList.remove('field-highlight-flash');
      }, 2400);
    }
  }, 250);
}

/**
 * Manages Legal Consent Checkbox state.
 * Enables "Generate Plan" when checked, disables Export & Print when unchecked.
 * 
 * @function toggleLegalConsent
 * @returns {void}
 */
function toggleLegalConsent() {
  const consent = document.getElementById('legalConsentCheck');
  const genBtn = document.getElementById('generatePlanBtn');
  const exportBtn = document.getElementById('downloadPdfBtn');
  const printBtn = document.getElementById('printBtn');
  const reportBtn = document.getElementById('reportDrawingBtn');
  const saveProjectBtn = document.getElementById('exportProjectBtn');
  const errConsent = document.getElementById('err-legalConsent');

  const isChecked = consent && consent.checked;

  if (errConsent) errConsent.style.display = 'none';

  // Save Project button is strictly gated by legal consent
  if (saveProjectBtn) {
    saveProjectBtn.disabled = !isChecked;
  }

  if (!isChecked) {
    // Unchecked -> Delete generated plan state and disable all buttons!
    isPlanGenerated = false;
    if (genBtn) genBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
    if (printBtn) printBtn.disabled = true;
    if (reportBtn) reportBtn.disabled = true;

    const viewport = document.getElementById('exportViewportSection');
    if (viewport) viewport.style.display = 'none';
  } else {
    // Checked -> Enable "Generate Plan", keep Export, Print & Report disabled until plan is generated!
    if (genBtn) genBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = !isPlanGenerated;
    if (printBtn) printBtn.disabled = !isPlanGenerated;
    if (reportBtn) reportBtn.disabled = !isPlanGenerated;
  }
}

/**
 * Generates plan drawing, reveals canvas viewport, and enables Export & Print buttons.
 * 
 * @function onGeneratePlanClick
 * @returns {void}
 */
function onGeneratePlanClick() {
  const consent = document.getElementById('legalConsentCheck');
  if (!consent || !consent.checked) {
    const errConsent = document.getElementById('err-legalConsent');
    if (errConsent) errConsent.style.display = 'block';
    return;
  }

  // Generate 2-page architectural drawing
  if (typeof generatePlan === 'function') {
    generatePlan();
  }

  // Track generated plan count in analytics
  if (typeof trackPlanGenerated === 'function') {
    trackPlanGenerated();
  }

  // Mark plan as generated and display viewport
  isPlanGenerated = true;
  const viewport = document.getElementById('exportViewportSection');
  if (viewport) viewport.style.display = 'block';

  // Enable Export PDF, Print, and Report buttons
  const exportBtn = document.getElementById('downloadPdfBtn');
  const printBtn = document.getElementById('printBtn');
  const reportBtn = document.getElementById('reportDrawingBtn');
  if (exportBtn) exportBtn.disabled = false;
  if (printBtn) printBtn.disabled = false;
  if (reportBtn) reportBtn.disabled = false;

  // Scroll to drawing preview smoothly
  if (viewport) {
    viewport.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Sanitizes drawing data (redacts all PII), captures an anonymized drawing snapshot,
 * compiles technical drawing specifications, and navigates to contact.html to create a support ticket.
 * 
 * @function reportDrawingIssue
 * @returns {Promise<void>}
 */
async function reportDrawingIssue() {
  try {
    // 1. Ensure plan is generated in DOM
    if (typeof generatePlan === 'function') generatePlan();

    // 2. Clone the drawing frame for offscreen sanitization
    const planFrame = document.querySelector('#planOutput .plan-sheet-frame');
    if (!planFrame) throw new Error('Drawing frame is not yet initialized.');

    const clone = planFrame.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    clone.style.width = `${planFrame.offsetWidth || 850}px`;
    clone.style.zIndex = '-1000';
    document.body.appendChild(clone);

    // 3. Strict PII Redaction Pipeline in clone:
    // (If field was filled by user -> "[REDACTED]", if empty -> "—")
    const redactIds = [
      'outOwner', 'outEpId', 'outSurvey', 'outWard', 'outAddress',
      'outAdlrNo', 'outHeaderSurvey', 'sbAdlrNo', 'sbMojiniRef',
      'sbDcOrderNo', 'sbDcOrderDate', 'sbDcAuthority', 'tbPidNo',
      'tbSurveyNo', 'tbWardNo'
    ];

    redactIds.forEach(id => {
      const el = clone.querySelector(`#${id}`);
      if (el) {
        const txt = (el.textContent || '').trim();
        el.textContent = (txt && txt !== '—' && txt !== '-') ? '[REDACTED]' : '—';
      }
    });

    const outGpsWrap = clone.querySelector('#outGpsWrap');
    if (outGpsWrap) outGpsWrap.style.display = 'none';

    // Redact Key Plan Map & Location Sketch in clone
    const keyPlanContainer = clone.querySelector('#keyPlanContainer');
    if (keyPlanContainer) {
      keyPlanContainer.innerHTML = `
        <div style="width: 100%; height: 92px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; font-size: 8.5px; font-weight: 700; gap: 3px;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: #94a3b8;">location_off</span>
          <span>[MAP & GPS LOCATION REDACTED]</span>
        </div>
      `;
    }

    // Strip digital signatures and architect seals in clone
    const panelOwnerImg = clone.querySelector('#panelOwnerSigImg');
    if (panelOwnerImg) panelOwnerImg.style.display = 'none';
    const panelArchImg = clone.querySelector('#panelArchSigImg');
    if (panelArchImg) panelArchImg.style.display = 'none';
    const panelArchDetails = clone.querySelector('#panelArchDetails');
    if (panelArchDetails) panelArchDetails.style.display = 'none';
    const panelArchTitle = clone.querySelector('#panelArchTitle');
    if (panelArchTitle) panelArchTitle.textContent = 'Architect Seal';

    // 4. Capture sanitized raster image using html2canvas
    if (!window.html2canvas) throw new Error('html2canvas library is unavailable.');

    const canvas = await html2canvas(clone, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    document.body.removeChild(clone);

    const sanitizedImage = canvas.toDataURL('image/png');

    // 5. Compile Technical Drawing Specifications
    const isOdd = document.getElementById('oddSiteCheck')?.checked;
    const plotArea = document.getElementById('plotArea')?.value || '—';
    const roadWidth = document.getElementById('roadWidth')?.value || '—';
    const roadFacing = (document.getElementById('roadFacing')?.value || 'North').toUpperCase();
    const scale = document.getElementById('scale')?.value || '1:100';

    let dims = '';
    if (isOdd) {
      const n = document.getElementById('sideNorth')?.value || '0';
      const s = document.getElementById('sideSouth')?.value || '0';
      const e = document.getElementById('sideEast')?.value || '0';
      const w = document.getElementById('sideWest')?.value || '0';
      dims = `North: ${n}', South: ${s}', East: ${e}', West: ${w}' (Irregular Plot)`;
    } else {
      const ew = document.getElementById('regEastWest')?.value || '0';
      const ns = document.getElementById('regNorthSouth')?.value || '0';
      dims = `East–West: ${ew}', North–South: ${ns}' (Regular Plot)`;
    }

    const sbF = document.getElementById('setbackFront')?.value || '0';
    const sbR = document.getElementById('setbackRear')?.value || '0';
    const sbL = document.getElementById('setbackLeft')?.value || '0';
    const sbRt = document.getElementById('setbackRight')?.value || '0';

    const bldgW = document.getElementById('bldgWidth')?.value || '0';
    const bldgL = document.getElementById('bldgLength')?.value || '0';
    const bldgArea = document.getElementById('builtUpArea')?.value || '0';

    const isRw = document.getElementById('roadWideningCheck')?.checked;
    const isBuf = document.getElementById('bufferCheck')?.checked;

    const techSpecs = [
      `• Plot Dimensions: ${dims}`,
      `• Plot Area: ${plotArea} sq.ft | Scale: ${scale}`,
      `• Road Facing: ${roadFacing} (${roadWidth} ft wide road)`,
      `• Setbacks: Front: ${sbF} ft, Rear: ${sbR} ft, Left: ${sbL} ft, Right: ${sbRt} ft`,
      `• Building Footprint: ${bldgW} ft × ${bldgL} ft (Built-up Area: ${bldgArea} sq.ft)`,
      `• Abutting Boundaries: N: ${document.getElementById('typeNorth')?.value || 'plot'}, S: ${document.getElementById('typeSouth')?.value || 'plot'}, E: ${document.getElementById('typeEast')?.value || 'plot'}, W: ${document.getElementById('typeWest')?.value || 'plot'}`,
      isRw ? `• Road Widening: Proposed ${document.getElementById('proposedRoadWidth')?.value || '0'} ft (Strip: ${document.getElementById('roadWideningStripWidth')?.value || '0'} ft)` : '',
      isBuf ? `• Buffer Zone: ${document.getElementById('bufferType')?.value || 'Buffer'} (${document.getElementById('bufferWidth')?.value || '0'} ft)` : ''
    ].filter(Boolean).join('\n');

    // 6. Store sanitized payload in sessionStorage and navigate to Support Desk
    const reportPayload = {
      type: 'drawing_report',
      timestamp: Date.now(),
      subject: `[Drawing Report] ${plotArea} sq.ft (${roadFacing} Facing Layout)`,
      techSpecs,
      sanitizedImage
    };

    sessionStorage.setItem('bbmp_drawing_report', JSON.stringify(reportPayload));
    window.location.href = 'contact.html?src=drawing_report';
  } catch (err) {
    console.error('Report drawing error:', err);
    alert('Could not prepare drawing report: ' + err.message);
  }
}

// Ensure buttons are clean and interactive when navigating back via browser history (bfcache)
window.addEventListener('pageshow', () => {
  const reportBtn = document.getElementById('reportDrawingBtn');
  if (reportBtn) {
    reportBtn.innerHTML = '<span>Report Drawing</span>';
    reportBtn.disabled = !isPlanGenerated;
  }
  const downloadBtn = document.getElementById('downloadPdfBtn');
  if (downloadBtn) {
    downloadBtn.innerHTML = '<span>Export PDF</span>';
    downloadBtn.disabled = !isPlanGenerated;
  }
});

/**
 * Central dictionary containing beginner-friendly field explanations,
 * document retrieval instructions, sample snippets, and official portal links.
 */
const FIELD_HELP_DATA = {
  epId: {
    title: "eKhata Property ID (ePID)",
    what: "Your plot's 10-digit official digital ID number issued by BBMP.",
    where: "Look at the top-right corner of your draft or final e-Khata document.",
    sample: "Property ID (ePID): 1509988776",
    link: "https://bbmpekhata.karnataka.gov.in/",
    linkText: "Visit Karnataka e-Khata Portal ↗"
  },
  pidNo: {
    title: "BBMP Property Tax PID Number",
    what: "The Property Identification Number used when paying your yearly BBMP property tax.",
    where: "Printed near the top of your annual SAS Property Tax receipt or tax khata record.",
    sample: "PID Number: 108-W0045-12",
    link: "https://bbmptax.karnataka.gov.in/",
    linkText: "Visit BBMP Property Tax Portal ↗"
  },
  adlrNo: {
    title: "ADLR 11E Survey Sketch Number (Optional)",
    what: "Government pre-mutation survey sketch reference issued by the Assistant Director of Land Records (ADLR). Note: This is NOT your Sale Deed number.",
    where: "Printed on your official DC Conversion order or parent Mojini survey map. (Leave blank or 'N/A' if you don't have it — it is 100% optional for generating your plan).",
    sample: "Reference: ADLR/11E/KR-7891/2023-24 (or leave blank)",
    link: "https://bhoomi.karnataka.gov.in/mojini/",
    linkText: "Bhoomi Mojini Portal (Search by rural Sy. No, not Property ID) ↗"
  },
  dcOrderNo: {
    title: "DC Conversion Order Number & Date",
    what: "Official government order converting agricultural land for non-agricultural residential use under KLR Act Sec 95.",
    where: "Printed on your official DC Conversion Order issued by the Deputy Commissioner, Bengaluru Urban District.",
    sample: "Order No: ALN(E)SR.97/07-08 (Dated: 12-04-2008)"
  },
  zoneName: {
    title: "BBMP Administrative Zone",
    what: "The BBMP zone governing your property location in Bengaluru (e.g. East, West, South, Mahadevapura, Bommanahalli).",
    where: "Found on your property tax receipt or e-Khata document."
  },
  wardNo: {
    title: "BBMP Ward Number & Name",
    what: "The municipal ward number and neighborhood name where your plot is situated.",
    where: "Printed on your BBMP SAS Tax Receipt (e.g., Ward 45 - Malleshwaram)."
  },
  siteAddress: {
    title: "Complete Property Address",
    what: "The full physical street address of your property.",
    where: "Type the address exactly as written under the Schedule of Property in your registered Sale Deed."
  },
  plotNo: {
    title: "Site / Plot Number (Optional)",
    what: "The specific residential or commercial site number assigned to your plot within the approved layout or revenue sub-division.",
    where: "Printed in the Schedule of Property in your registered Sale Deed or layout sanction plan (e.g. Site No. 38, Plot #12).",
    sample: "Site No: 38 (or Plot No. 12B)"
  },
  gpsCoords: {
    title: "Site GPS Coordinates & Locational Key Plan",
    what: "The geographic latitude and longitude of your property in Bengaluru. Automatically embeds a high-resolution locational map thumbnail with a dropped pin marker into Key Plan Panel 2.",
    where: "Click 'Pick on Map' to search/drag pin anywhere in Bengaluru, click 'Locate Me' to auto-detect if on-site, or copy-paste decimal coordinates/Google Maps links.",
    sample: "Coordinates: 12.9716, 77.5946 (or 12°58'17.8\"N 77°35'40.4\"E)",
    note: "100% Optional. If left blank, the drawing automatically renders a classic CAD vector schematic sketch."
  },
  surveyNo: {
    title: "Survey Number / Sy No",
    what: "The official revenue survey number or site/house number of your plot.",
    where: "Found in your Sale Deed Schedule or 11E Survey Sketch (e.g. Sy No 42/1)."
  },
  plotArea: {
    title: "Total Plot Area & Land Unit Converter",
    what: "The total superficial land area of your site in Square Feet (sq.ft). Must match the measurement written in your registered Sale Deed Schedule and 11E survey sketch.",
    where: "Look under the 'Schedule of Property' section of your registered Sale Deed or Form 11E Mojini survey sketch.",
    sample: "Total Area: 1,200 sq.ft (30ft × 40ft) or 2,400 sq.ft (40ft × 60ft)",
    note: "Tip: If your land is recorded in Guntas, Gajam (Sq.Yards), Cent, or Acre, tap the circular ⇄ Converter button next to the input to auto-convert to sq.ft (e.g., 1 Gunta = 1,089 sq.ft, 1 Gajam = 9 sq.ft, 1 Acre = 43,560 sq.ft)."
  },
  isOdd: {
    title: "Regular vs Irregular Plot Shape",
    what: "Choose Regular for simple rectangular/square plots (2 dimensions), or Irregular if your plot has 4 unequal or slanted sides.",
    where: "Check your 11E Survey Sketch or Sale Deed boundary measurements."
  },
  plotDimensions: {
    title: "Plot Boundary Measurements",
    what: "The exact physical length of your plot boundaries in feet and inches.",
    where: "Found under the 'Schedule of Property' section of your Sale Deed or Mojini 11E Sketch."
  },
  roadFacing: {
    title: "Front Main Road Direction",
    what: "The cardinal direction (North, South, East, or West) where your primary entrance/abutting road faces.",
    where: "Check your plot layout sketch or deed schedule."
  },
  roadWidth: {
    title: "Abutting Road Width",
    what: "The width of the public or private road in front of your plot (in feet and inches).",
    where: "Road width determines minimum setback requirements under BBMP RMP-2015 bye-laws."
  },
  bldgType: {
    title: "Proposed Building Structure & Floor Count",
    what: "Choose whether your site is a vacant plot or has a building structure (e.g. Stilt+Ground, G+1 to G+4).",
    where: "Determines the total built-up area and mandatory setback clearances."
  },
  bldgOrientation: {
    title: "Building Footprint Alignment",
    what: "Controls whether the building long side runs horizontally or vertically to fit cleanly within plot setbacks.",
    where: "Select ✨ Auto-Fit or adjust alignment to prevent footprint boundary overflow."
  },
  setbacks: {
    title: "Building Setback Clearances (RMP-2015)",
    what: "Mandatory open space required between your building outer walls and property boundaries.",
    where: "Auto-calculated according to BBMP RMP-2015 bye-laws based on plot depth and road width."
  },
  boundaries: {
    title: "Deed DNA Boundary Schedule",
    what: "Details of what abuts each side of your plot (Public Road, Private Property, Government Land, or Stormwater Drain).",
    where: "Copy directly from the 'Schedule of Property' section in your registered Sale Deed."
  },
  roadWidening: {
    title: "Master Plan Road Widening Strip",
    what: "Government reserved strip of land along public roads under BDA Master Plan (RMP-2015).",
    where: "If your road is slated for widening, check this box to render the hatched widening strip overlay on your plan."
  },
  bufferZone: {
    title: "Stormwater Drain / Rajakaluve / Lake Buffer Zone",
    what: "Non-buildable open space buffer required if your plot abuts a natural drain or water body.",
    where: "Check your village map, survey sketch, or BBMP RMP-2015 Master Plan overlay (Primary Drain 50m, Secondary 25m, Tertiary 15m, Lake 30m)."
  },
  challanDetails: {
    title: "Government Challan & Remitted Fee Details",
    what: "The payment receipt details for government fees (Betterment charges, Scrutiny fees, or Khata processing fees) paid to BBMP or K2 Treasury.",
    where: "Printed on your official K2 Treasury, Sakala, or Bank payment receipt.",
    sample: "Fee: ₹48,000 | Challan No: CH-2024-99881 | Date: 12-02-2026",
    note: "This section is 100% optional. If you haven't paid the fee yet, you can leave these fields blank."
  }
};

const FIELD_HELP_DATA_KN = {
  epId: {
    title: "ಇ-ಖಾತಾ ಆಸ್ತಿ ಐಡಿ (ePID)",
    what: "ಬಿಬಿಎಂಪಿ ನೀಡುವ ನಿಮ್ಮ ನಿವೇಶನದ 10-ಅಂಕಿಯ ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ಗುರುತಿನ ಸಂಖ್ಯೆ.",
    where: "ನಿಮ್ಮ ಕರಡು ಅಥವಾ ಅಂತಿಮ ಇ-ಖಾತಾ ದಾಖಲೆಯ ಮೇಲಿನ ಬಲ ಮೂಲೆಯನ್ನು ನೋಡಿ.",
    sample: "Property ID (ePID): 1509988776",
    link: "https://bbmpekhata.karnataka.gov.in/",
    linkText: "ಕರ್ನಾಟಕ ಇ-ಖಾತಾ ಪೋರ್ಟಲ್ ↗"
  },
  pidNo: {
    title: "ಬಿಬಿಎಂಪಿ ಆಸ್ತಿ ತೆರಿಗೆ ಪಿಐಡಿ ಸಂಖ್ಯೆ",
    what: "ವಾರ್ಷಿಕ ಬಿಬಿಎಂಪಿ ಆಸ್ತಿ ತೆರಿಗೆ ಪಾವತಿಸುವಾಗ ಬಳಸಲಾಗುವ ಆಸ್ತಿ ಗುರುತಿನ ಸಂಖ್ಯೆ.",
    where: "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಎಸ್‌ಎಎಸ್ ಆಸ್ತಿ ತೆರಿಗೆ ರಸೀದಿಯ ಮೇಲ್ಭಾಗದಲ್ಲಿ ಮುದ್ರಿತವಾಗಿರುತ್ತದೆ.",
    sample: "PID Number: 108-W0045-12",
    link: "https://bbmptax.karnataka.gov.in/",
    linkText: "ಬಿಬಿಎಂಪಿ ಆಸ್ತಿ ತೆರಿಗೆ ಪೋರ್ಟಲ್ ↗"
  },
  adlrNo: {
    title: "ಎಡಿಎಲ್‌ಆರ್ 11E ಸರ್ವೆ ನಕ್ಷೆ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ)",
    what: "ಭೂದಾಖಲೆಗಳ ಸಹಾಯಕ ನಿರ್ದೇಶಕರು (ADLR) ನೀಡುವ ಭೂಮಿ ಪ್ರಿ-ಮ್ಯುಟೇಶನ್ ಸರ್ವೆ ಸ್ಕೆಚ್ ಉಲ್ಲೇಖ.",
    where: "ನಿಮ್ಮ ಡಿಸಿ ಕನ್ವರ್ಷನ್ ಆದೇಶ ಅಥವಾ ಮೊಜಿನಿ ಸರ್ವೆ ನಕ್ಷೆಯಲ್ಲಿ ಮುದ್ರಿತವಾಗಿರುತ್ತದೆ. (ಇಲ್ಲದಿದ್ದರೆ ಖಾಲಿ ಬಿಡಿ - ಇದು ಐಚ್ಛಿಕ).",
    sample: "Reference: ADLR/11E/KR-7891/2023-24",
    link: "https://bhoomi.karnataka.gov.in/mojini/",
    linkText: "ಭೂಮಿ ಮೊಜಿನಿ ಪೋರ್ಟಲ್ ↗"
  },
  dcOrderNo: {
    title: "ಡಿಸಿ ಕನ್ವರ್ಷನ್ ಆದೇಶ ಸಂಖ್ಯೆ ಮತ್ತು ದಿನಾಂಕ",
    what: "ಕರ್ನಾಟಕ ಭೂಕಂದಾಯ ಕಾಯ್ದೆ ಕಲಂ 95 ರ ಅಡಿಯಲ್ಲಿ ಕೃಷಿಯೇತರ ವಸತಿ ಬಳಕೆಗೆ ಭೂ ಪರಿವರ್ತನೆ ನೀಡಿದ ಅಧಿಕೃತ ಆದೇಶ.",
    where: "ಬೆಂಗಳೂರು ನಗರ ಜಿಲ್ಲಾಧಿಕಾರಿಗಳು ನೀಡಿದ ಅಧಿಕೃತ ಡಿಸಿ ಕನ್ವರ್ಷನ್ ಆದೇಶದಲ್ಲಿ ಮುದ್ರಿತವಾಗಿರುತ್ತದೆ.",
    sample: "Order No: ALN(E)SR.97/07-08 (Dated: 12-04-2008)"
  },
  zoneName: {
    title: "ಬಿಬಿಎಂಪಿ ಆಡಳಿತ ವಲಯ",
    what: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ನಿಮ್ಮ ಆಸ್ತಿ ಬರುವ ಬಿಬಿಎಂಪಿ ವಲಯ (ಉದಾ: ಪೂರ್ವ, ಪಶ್ಚಿಮ, ದಕ್ಷಿಣ, ಮಹದೇವಪುರ, ಬೊಮ್ಮನಹಳ್ಳಿ).",
    where: "ನಿಮ್ಮ ಆಸ್ತಿ ತೆರಿಗೆ ರಸೀದಿ ಅಥವಾ ಇ-ಖಾತಾ ದಾಖಲೆಯಲ್ಲಿ ಕಂಡುಬರುತ್ತದೆ."
  },
  wardNo: {
    title: "ಬಿಬಿಎಂಪಿ ವಾರ್ಡ್ ಸಂಖ್ಯೆ ಮತ್ತು ಹೆಸರು",
    what: "ನಿಮ್ಮ ನಿವೇಶನವಿರುವ ಪಾಲಿಕೆ ವಾರ್ಡ್ ಸಂಖ್ಯೆ ಮತ್ತು ಬಡಾವಣೆಯ ಹೆಸರು.",
    where: "ಬಿಬಿಎಂಪಿ ಎಸ್‌ಎಎಸ್ ತೆರಿಗೆ ರಸೀದಿಯಲ್ಲಿ ಮುದ್ರಿತವಾಗಿರುತ್ತದೆ (ಉದಾ: ವಾರ್ಡ್ 45 - ಮಲ್ಲೇಶ್ವರಂ)."
  },
  siteAddress: {
    title: "ಸಂಪೂರ್ಣ ಆಸ್ತಿ ವಿಳಾಸ",
    what: "ನಿಮ್ಮ ಆಸ್ತಿಯ ಸಂಪೂರ್ಣ ರಸ್ತೆ/ಬಡಾವಣೆ ವಿಳಾಸ.",
    where: "ನೋಂದಾಯಿತ ಕ್ರಯಪತ್ರದ ಶೆಡ್ಯೂಲ್ ಆಫ್ ಪ್ರಾಪರ್ಟಿಯಲ್ಲಿರುವಂತೆ ನಮೂದಿಸಿ."
  },
  plotNo: {
    title: "ನಿವೇಶನ / ಸೈಟ್ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ)",
    what: "ಲೇಔಟ್ ಅಥವಾ ಕಂದಾಯ ಉಪವಿಭಾಗದಲ್ಲಿ ನಿಮ್ಮ ನಿವೇಶನಕ್ಕೆ ನಿಗದಿಪಡಿಸಲಾದ ನಿರ್ದಿಷ್ಟ ಸೈಟ್ ಸಂಖ್ಯೆ.",
    where: "ಕ್ರಯಪತ್ರದ ಶೆಡ್ಯೂಲ್ ಅಥವಾ ಲೇಔಟ್ ನಕ್ಷೆಯಲ್ಲಿ ಮುದ್ರಿತವಾಗಿರುತ್ತದೆ (ಉದಾ: ಸೈಟ್ #38, ಪ್ಲಾಟ್ #12)."
  },
  gpsCoords: {
    title: "ನಿವೇಶನದ ಜಿಪಿಎಸ್ ನಿರ್ದೇಶಾಂಕಗಳು & ಕೀ ಪ್ಲಾನ್",
    what: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ನಿಮ್ಮ ನಿವೇಶನದ ಅಕ್ಷಾಂಶ ಮತ್ತು ರೇಖಾಂಶ. ಕೀ ಪ್ಲಾನ್‌ನಲ್ಲಿ ನಿಖರವಾದ ನಕ್ಷೆ ಮತ್ತು ಪಿನ್ ಗುರುತನ್ನು ಪ್ರದರ್ಶಿಸುತ್ತದೆ.",
    where: "'ಮ್ಯಾಪ್‌ನಲ್ಲಿ ಆರಿಸಿ' ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಗೂಗಲ್ ಮ್ಯಾಪ್ ಲಿಂಕ್ ಅಂಟಿಸಿ.",
    sample: "Coordinates: 12.9716, 77.5946"
  },
  surveyNo: {
    title: "ಸರ್ವೆ ನಂಬರ್ / ಸೈಟ್ ನಂ",
    what: "ನಿಮ್ಮ ನಿವೇಶನದ ಅಧಿಕೃತ ಕಂದಾಯ ಸರ್ವೆ ಸಂಖ್ಯೆ ಅಥವಾ ಸೈಟ್ ಸಂಖ್ಯೆ.",
    where: "ಕ್ರಯಪತ್ರದ ಶೆಡ್ಯೂಲ್ ಅಥವಾ 11E ಸರ್ವೆ ಸ್ಕೆಚ್‌ನಲ್ಲಿ ಕಂಡುಬರುತ್ತದೆ (ಉದಾ: Sy No 42/1)."
  },
  plotArea: {
    title: "ಒಟ್ಟು ನಿವೇಶನದ ವಿಸ್ತೀರ್ಣ ಮತ್ತು ಭೂ ಪರಿವರ್ತಕ",
    what: "ನಿಮ್ಮ ನಿವೇಶನದ ಒಟ್ಟು ವಿಸ್ತೀರ್ಣ ಚದರ ಅಡಿಗಳಲ್ಲಿ (sq.ft). ಇದು ನಿಮ್ಮ ನೋಂದಾಯಿತ ಕ್ರಯಪತ್ರದ ಶೆಡ್ಯೂಲ್ ಮತ್ತು 11E ಸರ್ವೆ ಸ್ಕೆಚ್‌ನಲ್ಲಿರುವ ಅಳತೆಗೆ ಹೊಂದಿಕೆಯಾಗಬೇಕು.",
    where: "ನಿಮ್ಮ ಕ್ರಯಪತ್ರದ 'ಶೆಡ್ಯೂಲ್ ಆಫ್ ಪ್ರಾಪರ್ಟಿ' ಅಥವಾ ನಮೂನೆ 11E ಮೊಜಿನಿ ಸರ್ವೆ ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ.",
    sample: "ಒಟ್ಟು ವಿಸ್ತೀರ್ಣ: ೧,೨೦೦ ಚ.ಅಡಿ (೩೦×೪೦) ಅಥವಾ ೨,೪೦೦ ಚ.ಅಡಿ (೪೦×೬೦)",
    note: "ಸೂಚನೆ: ನಿಮ್ಮ ಜಮೀನು ಗುಂಟೆ, ಗಜ, ಸೆಂಟ್ ಅಥವಾ ಎಕರೆಯಲ್ಲಿದ್ದರೆ, ಇನ್‌ಪುಟ್ ಪಕ್ಕದಲ್ಲಿರುವ ⇄ ಪರಿವರ್ತಕ ಬಟನ್ ಟ್ಯಾಪ್ ಮಾಡಿ ನೇರವಾಗಿ ಚದರ ಅಡಿಗೆ ಪರಿವರ್ತಿಸಿಕೊಳ್ಳಿ (ಉದಾ: ೧ ಗುಂಟೆ = ೧,೦೮೯ ಚ.ಅಡಿ, ೧ ಗಜ = ೯ ಚ.ಅಡಿ, ೧ ಎಕರೆ = ೪೩,೫೬೦ ಚ.ಅಡಿ)."
  },
  isOdd: {
    title: "ಆಯತಾಕಾರ vs ವಿಷಮ ಕೋನ ನಿವೇಶನ",
    what: "ಆಯತಾಕಾರದ ನಿವೇಶನಕ್ಕೆ 'ರೆಗ್ಯುಲರ್' ಆರಿಸಿ, 4 ಅಸಮ ಅಥವಾ ಓರೆಯಾದ ಬಾಹುಗಳಿದ್ದರೆ 'ವಿಷಮ ಕೋನ' ಆರಿಸಿ.",
    where: "ನಿಮ್ಮ 11E ನಕ್ಷೆ ಅಥವಾ ಕ್ರಯಪತ್ರದ ಚಕ್ಕುಬಂದಿ ಅಳತೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."
  },
  plotDimensions: {
    title: "ನಿವೇಶನದ ಗಡಿ ಅಳತೆಗಳು",
    what: "ಅಡಿ ಮತ್ತು ಇಂಚುಗಳಲ್ಲಿ ನಿಮ್ಮ ನಿವೇಶನದ ನಾಲ್ಕೂ ಬದಿಗಳ ನಿಖರ ಅಳತೆ.",
    where: "ಕ್ರಯಪತ್ರದ 'ಶೆಡ್ಯೂಲ್ ಆಫ್ ಪ್ರಾಪರ್ಟಿ' ಅಥವಾ ಮೊಜಿನಿ 11E ನಕ್ಷೆಯಲ್ಲಿ ಕಂಡುಬರುತ್ತದೆ."
  },
  roadFacing: {
    title: "ಮುಂಭಾಗದ ರಸ್ತೆ ಮುಖಾಮುಖಿ ದಿಕ್ಕು",
    what: "ನಿಮ್ಮ ಮುಖ್ಯ ಪ್ರವೇಶ ರಸ್ತೆ ಮುಖ ಮಾಡಿರುವ ದಿಕ್ಕು (ಉತ್ತರ, ದಕ್ಷಿಣ, ಪೂರ್ವ ಅಥವಾ ಪಶ್ಚಿಮ).",
    where: "ನಿಮ್ಮ ನಿವೇಶನದ ನಕ್ಷೆ ಅಥವಾ ಕ್ರಯಪತ್ರದ ವಿವರ ಪರಿಶೀಲಿಸಿ."
  },
  roadWidth: {
    title: "ಮುಂಭಾಗದ ರಸ್ತೆ ಅಗಲ",
    what: "ನಿವೇಶನದ ಮುಂಭಾಗದಲ್ಲಿರುವ ಸಾರ್ವಜನಿಕ ಅಥವಾ ಖಾಸಗಿ ರಸ್ತೆಯ ಅಗಲ (ಅಡಿ ಮತ್ತು ಇಂಚುಗಳಲ್ಲಿ).",
    where: "ರಸ್ತೆಯ ಅಗಲವು ಬಿಬಿಎಂಪಿ RMP-2015 ಬೈಲಾ ಪ್ರಕಾರ ಕನಿಷ್ಠ ಸೆಟ್‌ಬ್ಯಾಕ್ ಅನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ."
  },
  bldgType: {
    title: "ಪ್ರಸ್ತಾವಿತ ಕಟ್ಟಡ ರಚನೆ ಮತ್ತು ಮಹಡಿಗಳ ಸಂಖ್ಯೆ",
    what: "ನಿವೇಶನವು ಖಾಲಿ ಜಾಗವೇ ಅಥವಾ ಕಟ್ಟಡ ರಚನೆಯನ್ನು ಹೊಂದಿದೆಯೇ (ಉದಾ: ಸ್ಟಿಲ್ಟ್+ನೆಲಮಹಡಿ, G+1 ರಿಂದ G+4) ಎಂಬುದನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    where: "ಒಟ್ಟು ನಿರ್ಮಿತ ವಿಸ್ತೀರ್ಣ ಮತ್ತು ಕಡ್ಡಾಯ ಸೆಟ್‌ಬ್ಯಾಕ್ ಅಂತರವನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ."
  },
  bldgOrientation: {
    title: "ಕಟ್ಟಡದ ಜೋಡಣೆ (Alignment)",
    what: "ಕಟ್ಟಡವು ನಿವೇಶನದ ಸೆಟ್‌ಬ್ಯಾಕ್‌ಗಳಲ್ಲಿ ಸರಿಯಾಗಿ ಹೊಂದಿಕೊಳ್ಳಲು ಅಡ್ಡಲಾಗಿ ಅಥವಾ ಉದ್ದಲಾಗಿ ಜೋಡಿಸುವುದನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ.",
    where: "✨ ಸ್ವಯಂಚಾಲಿತ ಜೋಡಣೆ ಆರಿಸಿ ಅಥವಾ ಹಸ್ತಚಾಲಿತವಾಗಿ ಬದಲಾಯಿಸಿ."
  },
  setbacks: {
    title: "ಬಿಬಿಎಂಪಿ ಸೆಟ್‌ಬ್ಯಾಕ್ ನಿಯಮಗಳು (RMP-2015)",
    what: "ಕಟ್ಟಡದ ಹೊರಗೋಡೆಗಳು ಮತ್ತು ನಿವೇಶನದ ಗಡಿಗಳ ನಡುವೆ ಬಿಡಬೇಕಾದ ಕಡ್ಡಾಯ ತೆರೆದ ಜಾಗ.",
    where: "ನಿವೇಶನದ ಆಳ ಮತ್ತು ರಸ್ತೆ ಅಗಲದ ಆಧಾರದ ಮೇಲೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ."
  },
  boundaries: {
    title: "ಚಕ್ಕುಬಂದಿ ಗಡಿ ವಿವರ (Deed DNA)",
    what: "ನಿವೇಶನದ ಪ್ರತಿಯೊಂದು ಬದಿಗೆ ಹೊಂದಿಕೊಂಡಿರುವ ಆಸ್ತಿಯ ವಿವರ (ರಸ್ತೆ, ಖಾಸಗಿ ಆಸ್ತಿ, ಸರ್ಕಾರಿ ಜಾಗ, ಅಥವಾ ಚರಂಡಿ).",
    where: "ನೋಂದಾಯಿತ ಕ್ರಯಪತ್ರದ 'ಶೆಡ್ಯೂಲ್ ಆಫ್ ಪ್ರಾಪರ್ಟಿ' ಭಾಗದಿಂದ ನಕಲಿಸಿ."
  },
  roadWidening: {
    title: "ಮಾಸ್ಟರ್ ಪ್ಲಾನ್ ರಸ್ತೆ ಅಗಲೀಕರಣ ಪಟ್ಟಿ",
    what: "ಬಿಡಿಎ ಮಾಸ್ಟರ್ ಪ್ಲಾನ್ (RMP-2015) ಪ್ರಕಾರ ಭವಿಷ್ಯದ ರಸ್ತೆ ವಿಸ್ತರಣೆಗೆ ಕಾಯ್ದಿರಿಸಿದ ಜಾಗ.",
    where: "ನಿಮ್ಮ ರಸ್ತೆಯನ್ನು ಅಗಲೀಕರಣಕ್ಕೆ ಗುರುತಿಸಿದ್ದರೆ, ಈ ಬಾಕ್ಸ್ ಅನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ."
  },
  bufferZone: {
    title: "ರಾಜಕಾಲುವೆ / ಕೆರೆ ಬಫರ್ ವಲಯ",
    what: "ನಿವೇಶನವು ರಾಜಕಾಲುವೆ ಅಥವಾ ಕೆರೆಗೆ ಹೊಂದಿಕೊಂಡಿದ್ದರೆ ಬಿಡಬೇಕಾದ ಕಡ್ಡಾಯ ನಿರ್ಮಾಣ-ರಹಿತ ತೆರೆದ ಜಾಗ.",
    where: "ಗ್ರಾಮ ನಕ್ಷೆ ಅಥವಾ ಬಿಬಿಎಂಪಿ ಮಾಸ್ಟರ್ ಪ್ಲಾನ್ ನೋಡಿ (ಪ್ರಾಥಮಿಕ ರಾಜಕಾಲುವೆ 50 ಮೀ, ದ್ವಿತೀಯ 25 ಮೀ, ತೃತೀಯ 15 ಮೀ, ಕೆರೆ 30 ಮೀ)."
  },
  challanDetails: {
    title: "ಸರ್ಕಾರಿ ಚಲನ್ ಮತ್ತು ಪಾವತಿಸಿದ ಶುಲ್ಕದ ವಿವರ",
    what: "ಬಿಬಿಎಂಪಿ ಅಥವಾ ಕೆ2 ಖಜಾನೆಗೆ ಪಾವತಿಸಿದ ಬೆಟರ್‌ಮೆಂಟ್ ಶುಲ್ಕ, ಪರಿಶೀಲನಾ ಶುಲ್ಕ ಅಥವಾ ಖಾತಾ ಶುಲ್ಕದ ರಸೀದಿ ವಿವರ.",
    where: "ನಿಮ್ಮ ಅಧಿಕೃತ ಕೆ2 ಖಜಾನೆ ಅಥವಾ ಸಕಾಲ ಪಾವತಿ ರಸೀದಿಯಲ್ಲಿ ಮುದ್ರಿತವಾಗಿರುತ್ತದೆ.",
    sample: "Fee: ₹48,000 | Challan No: CH-2024-99881 | Date: 12-02-2026"
  }
};

/**
 * Opens an Apple-style Frosted Glass Field Help Modal.
 * 
 * @function showFieldHelp
 * @param {string} key - Key matching FIELD_HELP_DATA entry.
 * @returns {void}
 */
function showFieldHelp(key) {
  const isKn = (window.i18n && (window.i18n.currentLocale === 'kn' || window.i18n.currentLang === 'kn'));
  const data = (isKn && FIELD_HELP_DATA_KN[key]) ? FIELD_HELP_DATA_KN[key] : (FIELD_HELP_DATA[key] || {});
  if (!data.title) return;

  const modal = document.getElementById('fieldHelpModal');
  const titleEl = document.getElementById('helpModalTitle');
  const bodyEl = document.getElementById('helpModalBody');

  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = data.title;

  const labelWhat = isKn ? 'ಇದು ಏನು:' : 'What it is:';
  const labelWhere = isKn ? 'ದಾಖಲೆಗಳಲ್ಲಿ ಎಲ್ಲಿ ಹುಡುಕಬೇಕು:' : 'Where to find it:';
  const labelSample = isKn ? 'ಮಾದರಿ ದಾಖಲೆಯ ಉಲ್ಲೇಖ' : 'Sample Document Text';

  let html = `
    <div style="font-size: 13.5px; line-height: 1.5; color: var(--apple-text-secondary);">
      <p style="margin: 0 0 10px 0;"><strong>${labelWhat}</strong> ${data.what}</p>
      <p style="margin: 0 0 10px 0;"><strong>${labelWhere}</strong> ${data.where}</p>
  `;

  if (data.sample) {
    html += `
      <div class="sample-snippet-box" style="margin: 10px 0;">
        <div class="snippet-tag">${labelSample}</div>
        <div class="snippet-content"><strong>${data.sample}</strong></div>
      </div>
    `;
  }

  if (data.note) {
    html += `
      <p style="margin: 10px 0 0 0; font-size: 12px; color: var(--apple-accent); background: rgba(0, 113, 227, 0.08); padding: 8px 12px; border-radius: 8px;">${data.note}</p>
    `;
  }

  if (data.link) {
    html += `
      <a href="${data.link}" target="_blank" rel="noopener" class="doc-link-btn" style="margin-top: 6px;">
        ${data.linkText || (isKn ? 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ ↗' : 'Visit Official Portal ↗')}
      </a>
    `;
  }

  html += `</div>`;

  bodyEl.innerHTML = html;

  const btnGotIt = modal.querySelector('.apple-btn-secondary');
  if (btnGotIt) {
    btnGotIt.textContent = isKn ? 'ತಿಳಿಯಿತು' : 'Got It';
  }

  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeFieldHelp() {
  const modal = document.getElementById('fieldHelpModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

/* ==========================================================================
   DIGITAL SIGNATURE & ARCHITECT CROPPING ENGINE
   ========================================================================== */

let activeSigType = 'owner'; // 'owner' | 'arch'
let sigImageObj = null;
let sigPanX = 0;
let sigPanY = 0;
let sigZoom = 1.0;
let isDraggingSig = false;
let dragStartX = 0;
let dragStartY = 0;
let initialPanX = 0;
let initialPanY = 0;
let initialPinchDistance = 0;
let initialPinchZoom = 1.0;

// In-memory raw uncropped image caches to prevent lossy re-cropping
let rawOwnerSigSrc = '';
let rawArchSigSrc = '';

/**
 * Handles file selection from file input.
 */
function onSignatureFileSelected(type, input) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    if (type === 'owner') {
      rawOwnerSigSrc = dataUrl;
    } else {
      rawArchSigSrc = dataUrl;
    }
    openSignatureCropModal(type, dataUrl);
  };
  reader.readAsDataURL(file);
  input.value = ''; // Reset so same file can be selected again
}

/**
 * Opens signature cropping and alignment modal.
 */
function openSignatureCropModal(type, imageSrc) {
  activeSigType = type;
  const modal = document.getElementById('signatureCropModal');
  const titleEl = document.getElementById('sigModalTitle');
  if (titleEl) {
    titleEl.innerHTML = `<span class="material-symbols-outlined" style="font-size: 20px; color: var(--apple-accent);">${type === 'owner' ? 'ink_pen' : 'approval'}</span><span>Fit & Align ${type === 'owner' ? 'Owner Signature' : 'Architect Seal / Sign'}</span>`;
  }

  const img = new Image();
  img.onload = () => {
    sigImageObj = img;
    const canvas = document.getElementById('cropCanvas');
    const wrapper = document.getElementById('cropCanvasWrapper');
    if (canvas && wrapper) {
      canvas.width = wrapper.clientWidth || 480;
      canvas.height = wrapper.clientHeight || 230;
    }

    // Auto-fit initial zoom & center
    const targetW = 280;
    const targetH = 112;
    const scaleX = targetW / img.naturalWidth;
    const scaleY = targetH / img.naturalHeight;
    sigZoom = Math.max(scaleX, scaleY) * 1.1;
    if (sigZoom < 0.4) sigZoom = 0.4;
    if (sigZoom > 3.0) sigZoom = 3.0;

    const zoomSlider = document.getElementById('sigCropZoom');
    if (zoomSlider) zoomSlider.value = sigZoom.toFixed(2);

    sigPanX = 0;
    sigPanY = 0;

    initCropInteractionListeners();
    redrawCropCanvas();

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  };
  img.src = imageSrc;
}

/**
 * Closes the crop modal.
 */
function closeSignatureCropModal() {
  const modal = document.getElementById('signatureCropModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

/**
 * Initializes mouse and touch drag listeners for panning inside crop wrapper.
 */
function initCropInteractionListeners() {
  const wrapper = document.getElementById('cropCanvasWrapper');
  if (!wrapper || wrapper.getAttribute('data-events-bound') === 'true') return;
  wrapper.setAttribute('data-events-bound', 'true');

  const onPointerDown = (clientX, clientY) => {
    isDraggingSig = true;
    dragStartX = clientX;
    dragStartY = clientY;
    initialPanX = sigPanX;
    initialPanY = sigPanY;
    wrapper.style.cursor = 'grabbing';
  };

  const onPointerMove = (clientX, clientY) => {
    if (!isDraggingSig) return;
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    sigPanX = initialPanX + dx;
    sigPanY = initialPanY + dy;
    redrawCropCanvas();
  };

  const onPointerUp = () => {
    if (isDraggingSig) {
      isDraggingSig = false;
      wrapper.style.cursor = 'grab';
    }
  };

  // Mouse events
  wrapper.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onPointerUp);

  // Helper for touch distance (pinch-to-zoom)
  const getTouchDist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  // Touch events (Mobile support with scroll lock & pinch zoom)
  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      isDraggingSig = false;
      initialPinchDistance = getTouchDist(e.touches[0], e.touches[1]);
      initialPinchZoom = sigZoom;
    }
  }, { passive: false });

  wrapper.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent modal and window scrolling while dragging
    if (e.touches.length === 1 && isDraggingSig) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && initialPinchDistance > 0) {
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const factor = dist / initialPinchDistance;
      sigZoom = Math.min(3.0, Math.max(0.4, initialPinchZoom * factor));
      const zoomSlider = document.getElementById('sigCropZoom');
      if (zoomSlider) zoomSlider.value = sigZoom.toFixed(2);
      redrawCropCanvas();
    }
  }, { passive: false });

  wrapper.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      onPointerUp();
      initialPinchDistance = 0;
    }
  });
}

/**
 * Redraws the crop canvas with current pan & zoom.
 */
function redrawCropCanvas() {
  const canvas = document.getElementById('cropCanvas');
  if (!canvas || !sigImageObj) return;
  const ctx = canvas.getContext('2d');
  const cw = canvas.width;
  const ch = canvas.height;

  ctx.clearRect(0, 0, cw, ch);

  // Draw neutral check pattern or dark background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, cw, ch);

  const drawW = sigImageObj.naturalWidth * sigZoom;
  const drawH = sigImageObj.naturalHeight * sigZoom;
  const drawX = cw / 2 - drawW / 2 + sigPanX;
  const drawY = ch / 2 - drawH / 2 + sigPanY;

  ctx.save();
  ctx.drawImage(sigImageObj, drawX, drawY, drawW, drawH);
  ctx.restore();
}

/**
 * Adjusts zoom on input slider change.
 */
function onSignatureCropZoom(val) {
  sigZoom = val;
  redrawCropCanvas();
}

/**
 * Resets pan and zoom.
 */
function resetCropTransform() {
  sigPanX = 0;
  sigPanY = 0;
  sigZoom = 1.0;
  const zoomSlider = document.getElementById('sigCropZoom');
  if (zoomSlider) zoomSlider.value = 1.0;
  redrawCropCanvas();
}

/**
 * Crops the 280x112 target box area, performs color-preserving chromaticity contrast auto-clean,
 * and updates the state, thumbnails, and CAD drawing sheet.
 */
function applySignatureCrop() {
  const canvas = document.getElementById('cropCanvas');
  if (!canvas || !sigImageObj) {
    closeSignatureCropModal();
    return;
  }

  const cw = canvas.width;
  const ch = canvas.height;
  const targetW = 280;
  const targetH = 112;

  // Render high-res 400x160 output canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = 400;
  outCanvas.height = 160;
  const outCtx = outCanvas.getContext('2d');

  const scaleOut = 400 / targetW;
  const drawW = sigImageObj.naturalWidth * sigZoom * scaleOut;
  const drawH = sigImageObj.naturalHeight * sigZoom * scaleOut;
  const drawX = (outCanvas.width / 2) - (drawW / 2) + (sigPanX * scaleOut);
  const drawY = (outCanvas.height / 2) - (drawH / 2) + (sigPanY * scaleOut);

  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
  outCtx.drawImage(sigImageObj, drawX, drawY, drawW, drawH);

  // Auto-clean background with chromaticity preservation (protects blue ink, purple stamps, red seals)
  const cleanBg = document.getElementById('sigCleanBgCheck')?.checked;
  if (cleanBg) {
    try {
      const imgData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Color saturation (chroma) protects blue ballpoint ink, purple stamps, and red seals
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const chroma = maxC - minC;
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

        if (chroma < 25 && brightness > 195) {
          // Neutral off-white or grey paper background -> Make Transparent
          data[i + 3] = 0;
        } else if (chroma >= 25) {
          // Colored ink (blue/purple/red stamp or signature) -> Keep 100% opaque
          data[i + 3] = 255;
        } else {
          // Black / dark ink -> Boost contrast
          data[i] = Math.max(0, r - 30);
          data[i + 1] = Math.max(0, g - 30);
          data[i + 2] = Math.max(0, b - 30);
          data[i + 3] = 255;
        }
      }
      outCtx.putImageData(imgData, 0, 0);
    } catch (err) {
      console.warn('Signature thresholding error:', err);
    }
  }

  const dataUrl = outCanvas.toDataURL('image/png');

  if (activeSigType === 'owner') {
    const dataInp = document.getElementById('ownerSigData');
    if (dataInp) dataInp.value = dataUrl;
  } else {
    const dataInp = document.getElementById('archSigData');
    if (dataInp) dataInp.value = dataUrl;
  }

  syncSignaturePreviews();
  closeSignatureCropModal();

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Removes uploaded signature.
 */
function removeSignature(type) {
  if (type === 'owner') {
    const dataInp = document.getElementById('ownerSigData');
    if (dataInp) dataInp.value = '';
    rawOwnerSigSrc = '';
  } else {
    const dataInp = document.getElementById('archSigData');
    if (dataInp) dataInp.value = '';
    rawArchSigSrc = '';
  }

  syncSignaturePreviews();
  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Re-opens crop modal for an existing signature using the uncropped original photo if available.
 */
function reopenSignatureCrop(type) {
  const rawSrc = type === 'owner' ? rawOwnerSigSrc : rawArchSigSrc;
  const fallbackDataInp = document.getElementById(type === 'owner' ? 'ownerSigData' : 'archSigData');
  const srcToUse = rawSrc || (fallbackDataInp ? fallbackDataInp.value : '');

  if (srcToUse) {
    openSignatureCropModal(type, srcToUse);
  }
}

/**
 * Synchronizes thumbnail previews in Step 6 and Drawing sheet images in Panel 7 & Page 2.
 */
function syncSignaturePreviews() {
  const ownerData = (document.getElementById('ownerSigData')?.value || '').trim();
  const archData = (document.getElementById('archSigData')?.value || '').trim();

  // 1. Owner Signature Step 6 Card
  const ownerDropzone = document.getElementById('ownerSigDropzone');
  const ownerPreview = document.getElementById('ownerSigPreviewBox');
  const ownerThumb = document.getElementById('ownerSigThumbImg');
  const ownerRemoveBtn = document.getElementById('btnRemoveOwnerSig');
  if (ownerData) {
    if (ownerDropzone) ownerDropzone.style.display = 'none';
    if (ownerPreview) ownerPreview.style.display = 'flex';
    if (ownerThumb) ownerThumb.src = ownerData;
    if (ownerRemoveBtn) ownerRemoveBtn.style.display = 'inline-block';
  } else {
    if (ownerDropzone) ownerDropzone.style.display = 'flex';
    if (ownerPreview) ownerPreview.style.display = 'none';
    if (ownerThumb) ownerThumb.src = '';
    if (ownerRemoveBtn) ownerRemoveBtn.style.display = 'none';
  }

  // 2. Architect Seal Step 6 Card
  const archDropzone = document.getElementById('archSigDropzone');
  const archPreview = document.getElementById('archSigPreviewBox');
  const archThumb = document.getElementById('archSigThumbImg');
  const archRemoveBtn = document.getElementById('btnRemoveArchSig');
  if (archData) {
    if (archDropzone) archDropzone.style.display = 'none';
    if (archPreview) archPreview.style.display = 'flex';
    if (archThumb) archThumb.src = archData;
    if (archRemoveBtn) archRemoveBtn.style.display = 'inline-block';
  } else {
    if (archDropzone) archDropzone.style.display = 'flex';
    if (archPreview) archPreview.style.display = 'none';
    if (archThumb) archThumb.src = '';
    if (archRemoveBtn) archRemoveBtn.style.display = 'none';
  }

  // 3. Drawing Sheet Panel 7 (Page 1)
  const panelOwnerImg = document.getElementById('panelOwnerSigImg');
  if (panelOwnerImg) {
    if (ownerData) {
      panelOwnerImg.src = ownerData;
      panelOwnerImg.style.display = 'block';
    } else {
      panelOwnerImg.src = '';
      panelOwnerImg.style.display = 'none';
    }
  }

  const panelArchImg = document.getElementById('panelArchSigImg');
  if (panelArchImg) {
    if (archData) {
      panelArchImg.src = archData;
      panelArchImg.style.display = 'block';
    } else {
      panelArchImg.src = '';
      panelArchImg.style.display = 'none';
    }
  }

  // 4. Drawing Sheet Page 2 (Legend Sheet)
  const p2ArchImg = document.getElementById('p2ArchSigImg');
  if (p2ArchImg) {
    if (archData) {
      p2ArchImg.src = archData;
      p2ArchImg.style.display = 'block';
    } else {
      p2ArchImg.src = '';
      p2ArchImg.style.display = 'none';
    }
  }
}

/**
 * Handles text input on Architect Name & Registration Number.
 */
function onArchitectInfoInput() {
  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

if (typeof window !== 'undefined') {
  window.addEventListener('localeChanged', () => {
    if (typeof updateSetbackComplianceBadges === 'function') {
      updateSetbackComplianceBadges();
    }
  });
}

// ==========================================================================
// Karnataka Land Area Unit Converter Engine & Modal Controller
// ==========================================================================

export const AREA_CONVERSION_RATES = {
  sqft: 1,
  gunta: 1089,           // 1 Gunta = 33 ft x 33 ft = 1,089 sq.ft
  sqyd: 9,              // 1 Sq. Yard (Gajam) = 3 ft x 3 ft = 9 sq.ft
  sqm: 10.7639104,      // 1 Sq. Meter = 10.7639104 sq.ft
  acre: 43560,          // 1 Acre = 40 Guntas = 43,560 sq.ft
  cent: 435.6,          // 1 Cent = 435.6 sq.ft (1/100 Acre)
  ankana: 72,           // 1 Ankana = 72 sq.ft (traditional Karnataka unit)
  bigha: 17424,         // 1 Bigha (Karnataka Standard) = 16 Guntas = 17,424 sq.ft
  hectare: 107639.104   // 1 Hectare = 10,000 sq.m = 107,639.104 sq.ft
};

let activeConverterUnit = 'gunta';

const CONVERTER_UNIT_NAMES = {
  gunta: { en: 'Gunta (1,089 sq.ft)', kn: 'ಗುಂಟೆ (೧,೦೮೯ ಚ.ಅಡಿ)', formula: '1 Gunta = 1,089.00 sq.ft (33ft × 33ft) = 101.17 sq.m' },
  sqyd: { en: 'Sq. Yard / Gajam (9 sq.ft)', kn: 'ಚದರ ಗಜ (೯ ಚ.ಅಡಿ)', formula: '1 Sq. Yard (Gajam) = 9.00 sq.ft = 0.836 sq.m' },
  sqm: { en: 'Sq. Meter (10.764 sq.ft)', kn: 'ಚದರ ಮೀಟರ್ (೧೦.೭೬೪ ಚ.ಅಡಿ)', formula: '1 Sq. Meter = 10.764 sq.ft' },
  acre: { en: 'Acre (43,560 sq.ft)', kn: 'ಎಕರೆ (೪೩,೫೬೦ ಚ.ಅಡಿ)', formula: '1 Acre = 40 Guntas = 43,560.00 sq.ft = 4,046.86 sq.m' },
  cent: { en: 'Cent (435.6 sq.ft)', kn: 'ಸೆಂಟ್ (೪೩೫.೬ ಚ.ಅಡಿ)', formula: '1 Cent = 435.60 sq.ft = 40.47 sq.m (1/100 Acre)' },
  ankana: { en: 'Ankana (72 sq.ft)', kn: 'ಅಂಕಣ (೭೨ ಚ.ಅಡಿ)', formula: '1 Ankana = 72.00 sq.ft = 6.689 sq.m' },
  bigha: { en: 'Bigha (17,424 sq.ft)', kn: 'ಬೀಘಾ (೧೭,೪೨೪ ಚ.ಅಡಿ)', formula: '1 Bigha (Karnataka) = 16 Guntas = 17,424.00 sq.ft = 1,618.74 sq.m' },
  hectare: { en: 'Hectare (1,07,639 sq.ft)', kn: 'ಹೆಕ್ಟೇರ್ (೧,೦೭,೬೩೯ ಚ.ಅಡಿ)', formula: '1 Hectare = 10,000 sq.m = 1,07,639.10 sq.ft = 2.471 Acres' },
  sqft: { en: 'Sq. Feet (1 sq.ft)', kn: 'ಚದರ ಅಡಿ (೧ ಚ.ಅಡಿ)', formula: '1 Sq. Foot = 0.0929 sq.m' }
};

/**
 * Opens the Apple-Style Karnataka Land Area Converter Modal.
 * @param {Event} [e] - Click event
 */
function openAreaConverterModal(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const modal = document.getElementById('landConverterModal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.classList.add('active');

  const plotAreaInput = document.getElementById('plotArea');
  const inputEl = document.getElementById('convModalInputValue');
  if (inputEl) {
    if (plotAreaInput && plotAreaInput.value && parseFloat(plotAreaInput.value) > 0) {
      inputEl.value = plotAreaInput.value.trim();
      activeConverterUnit = 'sqft';
    } else {
      inputEl.value = '1';
      activeConverterUnit = 'gunta';
    }
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 50);
  }

  closeConverterUnitMenu();
  updateConverterUnitChipsUI();
  calculateModalConvertedArea();
}

/**
 * Closes the Area Converter Modal.
 */
function closeAreaConverterModal() {
  closeConverterUnitMenu();
  const modal = document.getElementById('landConverterModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

/**
 * Toggles the unit selection popover menu.
 * @param {Event} [e]
 */
function toggleConverterUnitMenu(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const menu = document.getElementById('convModalUnitMenu');
  const btn = document.getElementById('convModalUnitBtn');
  if (!menu) return;

  const isOpen = menu.style.display === 'block';
  if (isOpen) {
    closeConverterUnitMenu();
  } else {
    menu.style.display = 'block';
    if (btn) {
      btn.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  }
}

/**
 * Closes the unit selection popover menu.
 */
function closeConverterUnitMenu() {
  const menu = document.getElementById('convModalUnitMenu');
  const btn = document.getElementById('convModalUnitBtn');
  if (menu) menu.style.display = 'none';
  if (btn) {
    btn.classList.remove('menu-open');
    btn.setAttribute('aria-expanded', 'false');
  }
}

// Global click listener to close popover when clicked outside
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.converter-unit-dropdown-wrapper');
    if (dropdown && !dropdown.contains(e.target)) {
      closeConverterUnitMenu();
    }
  });
}

/**
 * Selects a unit type action chip (only one active at a time).
 * @param {string} unitKey
 */
function selectConverterUnit(unitKey) {
  if (!AREA_CONVERSION_RATES[unitKey]) return;
  activeConverterUnit = unitKey;
  closeConverterUnitMenu();
  updateConverterUnitChipsUI();
  calculateModalConvertedArea();
}

/**
 * Updates active class on unit menu items and updates button label.
 */
function updateConverterUnitChipsUI() {
  const currentLang = window.i18n ? window.i18n.currentLang : 'en';
  const meta = CONVERTER_UNIT_NAMES[activeConverterUnit] || { en: activeConverterUnit, formula: '' };

  const btnText = document.getElementById('convModalUnitBtnText');
  if (btnText) {
    btnText.textContent = currentLang === 'kn' ? (meta.kn || meta.en) : meta.en;
  }

  const menu = document.getElementById('convModalUnitMenu');
  if (menu) {
    const items = menu.querySelectorAll('.converter-unit-menu-item');
    items.forEach(item => {
      const u = item.getAttribute('data-unit');
      if (u === activeConverterUnit) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  const noteEl = document.getElementById('convModalFormulaNote');
  if (noteEl && meta.formula) {
    noteEl.textContent = meta.formula;
  }
}

/**
 * Computes live conversion for modal in both sq.ft and sq.m.
 * @returns {number} Converted area in square feet
 */
function calculateModalConvertedArea() {
  const inputEl = document.getElementById('convModalInputValue');
  const sqftDisplay = document.getElementById('convModalResultSqFt');
  const sqmDisplay = document.getElementById('convModalResultSqM');

  if (!inputEl || !sqftDisplay || !sqmDisplay) return 0;

  const rawVal = parseFloat(inputEl.value);
  const multiplier = AREA_CONVERSION_RATES[activeConverterUnit] || 1;

  if (isNaN(rawVal) || rawVal <= 0) {
    sqftDisplay.innerHTML = `0 <span class="unit">sq.ft</span>`;
    sqmDisplay.innerHTML = `0.00 <span class="unit">sq.m</span>`;
    return 0;
  }

  const sqftVal = rawVal * multiplier;
  const sqmVal = sqftVal / 10.7639104;

  const formattedSqFt = sqftVal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const formattedSqM = sqmVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  sqftDisplay.innerHTML = `${formattedSqFt} <span class="unit">sq.ft</span>`;
  sqmDisplay.innerHTML = `${formattedSqM} <span class="unit">sq.m</span>`;

  return sqftVal;
}

/**
 * Applies a quick preset inside the modal, recalculates live, and updates input.
 * @param {number} val
 * @param {string} unitKey
 */
function applyConverterPreset(val, unitKey) {
  const inputEl = document.getElementById('convModalInputValue');
  if (inputEl) inputEl.value = val;
  selectConverterUnit(unitKey);
}

/**
 * Applies the calculated modal area to #plotArea and closes modal.
 */
function applyConvertedAreaModal() {
  const sqftVal = calculateModalConvertedArea();
  if (sqftVal <= 0) return;

  const plotAreaInput = document.getElementById('plotArea');
  if (plotAreaInput) {
    const rounded = Math.round(sqftVal * 100) / 100;
    plotAreaInput.value = rounded;
    plotAreaInput.dataset.userEdited = 'true';
    if (typeof clearFieldError === 'function') {
      clearFieldError('plotArea', 'err-plotArea');
    }
    if (typeof calculateBuiltUpArea === 'function') calculateBuiltUpArea();
    if (typeof updateSetbackComplianceBadges === 'function') updateSetbackComplianceBadges();
    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof renderPlan === 'function') renderPlan();
    if (typeof saveDraft === 'function') saveDraft();
  }

  const btn = document.getElementById('convModalApplyBtn');
  if (btn) {
    const origHtml = btn.innerHTML;
    const appliedMsg = window.i18n ? window.i18n.t('converter.applied') : 'Applied to Plan!';
    btn.innerHTML = `<span class="material-symbols-outlined">done_all</span> ${appliedMsg}`;
    btn.style.background = '#059669';
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.style.background = '';
      closeAreaConverterModal();
    }, 400);
  } else {
    closeAreaConverterModal();
  }
}

// Backward compatibility aliases
function calculateConvertedArea() { return calculateModalConvertedArea(); }
function applyConvertedArea() { return applyConvertedAreaModal(); }
function applyAreaPreset(val, unit) { return applyConverterPreset(val, unit); }
function toggleAreaConverter(e) { return openAreaConverterModal(e); }

/* ==========================================================================
   BBMP Zone & Ward Auto-Suggest Directory Modal Controller
   ========================================================================== */

let activeWardZoneFilter = 'all';

/**
 * Opens the BBMP Zone & Ward Search Directory Modal.
 * @param {Event} [e] - Click event
 */
function openWardSearchModal(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const modal = document.getElementById('bbmpWardModal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.classList.add('active');

  // Initialize zone filter tabs
  renderWardZoneChips();

  // Reset search input and show all / zone-filtered wards
  const searchInput = document.getElementById('wardModalSearchInput');
  const currentWard = (document.getElementById('wardName')?.value || '').trim();
  if (searchInput) {
    searchInput.value = currentWard;
    filterAndRenderWards(currentWard);
    setTimeout(() => {
      searchInput.focus();
      if (currentWard) searchInput.select();
    }, 80);
  } else {
    filterAndRenderWards('');
  }
}

/**
 * Closes the BBMP Zone & Ward Search Directory Modal.
 */
function closeWardSearchModal() {
  const modal = document.getElementById('bbmpWardModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
}

/**
 * Renders the Zone Filter Chips in the Modal header.
 */
function renderWardZoneChips() {
  const container = document.getElementById('wardZoneChipsContainer');
  if (!container) return;

  const currentLang = window.i18n ? window.i18n.currentLocale : 'en';
  const zones = (typeof BBMP_ZONES !== 'undefined' ? BBMP_ZONES : window.BBMP_ZONES) || [];

  container.innerHTML = zones.map(z => {
    const isSelected = activeWardZoneFilter === z.id;
    const label = currentLang === 'kn' && z.nameKn ? z.nameKn : z.nameEn;
    return `<button type="button" class="ward-zone-chip ${isSelected ? 'active' : ''}" onclick="setWardZoneFilter('${z.id}')">${label}</button>`;
  }).join('');
}

/**
 * Sets the active zone filter and refreshes results.
 * @param {string} zoneId
 */
function setWardZoneFilter(zoneId) {
  activeWardZoneFilter = zoneId;
  renderWardZoneChips();
  const searchInput = document.getElementById('wardModalSearchInput');
  const query = searchInput ? searchInput.value : '';
  filterAndRenderWards(query);
}

/**
 * Filters wards by keyword query and active zone, then renders result cards.
 * @param {string} rawQuery
 */
function filterAndRenderWards(rawQuery) {
  const container = document.getElementById('wardSearchResultsList');
  if (!container) return;

  const query = (rawQuery || '').trim().toLowerCase();
  const wards = (typeof BBMP_WARDS !== 'undefined' ? BBMP_WARDS : window.BBMP_WARDS) || [];
  const currentLang = window.i18n ? window.i18n.currentLocale : 'en';

  const filtered = wards.filter(w => {
    // Check Zone Filter
    if (activeWardZoneFilter !== 'all' && w.zone !== activeWardZoneFilter) {
      return false;
    }

    if (!query) return true;

    // Match Ward No
    if (w.wardNo.toString().includes(query)) return true;

    // Match English & Kannada Names
    if (w.nameEn.toLowerCase().includes(query)) return true;
    if (w.nameKn && w.nameKn.toLowerCase().includes(query)) return true;

    // Match Keywords / Landmarks
    if (w.keywords && w.keywords.some(k => k.toLowerCase().includes(query))) return true;

    // Match Zone & Sub-Zone (e-Aasthi Range)
    if (w.zone.toLowerCase().includes(query)) return true;
    if (w.subZone && w.subZone.toLowerCase().includes(query)) return true;

    return false;
  });

  const countEl = document.getElementById('wardResultCountBadge');
  if (countEl) {
    const countText = currentLang === 'kn' ? `${filtered.length} ವಾರ್ಡ್‌ಗಳು ಲಭ್ಯವಿದೆ` : `${filtered.length} Wards Found`;
    countEl.textContent = countText;
  }

  if (filtered.length === 0) {
    const noResultMsg = currentLang === 'kn'
      ? 'ಯಾವುದೇ ವಾರ್ಡ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಬಡಾವಣೆ ಅಥವಾ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್ ಹುಡುಕಿ.'
      : 'No matching BBMP wards found. Try searching by landmark (e.g. Sony World, 100ft Rd, ITPL).';
    container.innerHTML = `
      <div class="ward-empty-state">
        <span class="material-symbols-outlined" style="font-size: 36px; color: var(--apple-text-secondary);">location_off</span>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: var(--apple-text-secondary); font-weight: 500;">${noResultMsg}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(w => {
    const displayName = currentLang === 'kn' ? `${w.nameKn} (${w.nameEn})` : `${w.nameEn} (${w.nameKn})`;
    const subZoneBadge = w.subZone && w.subZone !== w.zone ? ` • ${w.subZone}` : '';
    return `
      <div class="ward-result-card" onclick="selectBbmpWard(${w.wardNo})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')selectBbmpWard(${w.wardNo})">
        <div class="ward-result-header">
          <span class="ward-number-badge">Ward ${w.wardNo}</span>
          <span class="ward-zone-tag zone-${w.zone.toLowerCase().replace(/[^a-z0-9]/g, '')}">${w.zone} Zone${subZoneBadge}</span>
        </div>
        <div class="ward-name-primary">${displayName}</div>
        ${w.keywords && w.keywords.length > 0 ? `
          <div class="ward-landmarks-preview">
            <span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">near_me</span>
            ${w.keywords.slice(0, 4).join(' • ')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Populates Step 1 form fields with the chosen BBMP ward and closes modal.
 * @param {number} wardNo
 */
function selectBbmpWard(wardNo) {
  const wards = (typeof BBMP_WARDS !== 'undefined' ? BBMP_WARDS : window.BBMP_WARDS) || [];
  const target = wards.find(w => w.wardNo === wardNo);
  if (!target) return;

  // 1. Set Zone
  const zoneSelect = document.getElementById('bbmpZone');
  if (zoneSelect) {
    zoneSelect.value = target.zone;
    if (typeof clearFieldError === 'function') clearFieldError('bbmpZone', 'err-bbmpZone');
  }

  // 2. Set Ward Number
  const wardNoInput = document.getElementById('wardNo');
  if (wardNoInput) {
    wardNoInput.value = target.wardNo;
    if (typeof clearFieldError === 'function') clearFieldError('wardNo', 'err-wardNo');
  }

  // 3. Set Ward Name
  const wardNameInput = document.getElementById('wardName');
  if (wardNameInput) {
    wardNameInput.value = target.nameEn;
    if (typeof clearFieldError === 'function') clearFieldError('wardName', 'err-wardName');
  }

  // 4. Update CAD Drawing Title Block on Page 1
  const tbZone = document.getElementById('tbZone');
  if (tbZone) tbZone.textContent = target.zone + ' Zone';
  const tbWard = document.getElementById('tbWard');
  if (tbWard) tbWard.textContent = `Ward ${target.wardNo} (${target.nameEn})`;

  // 5. Persist to storage
  if (typeof saveDraft === 'function') saveDraft();

  // 6. Close Modal
  closeWardSearchModal();
}

if (typeof window !== 'undefined') {
  window.FIELD_HELP_DATA = FIELD_HELP_DATA;
  window.FIELD_HELP_DATA_KN = FIELD_HELP_DATA_KN;
  window.showFieldHelp = showFieldHelp;
  window.closeFieldHelp = closeFieldHelp;
  window.AREA_CONVERSION_RATES = AREA_CONVERSION_RATES;
  window.openAreaConverterModal = openAreaConverterModal;
  window.closeAreaConverterModal = closeAreaConverterModal;
  window.toggleConverterUnitMenu = toggleConverterUnitMenu;
  window.closeConverterUnitMenu = closeConverterUnitMenu;
  window.selectConverterUnit = selectConverterUnit;
  window.calculateModalConvertedArea = calculateModalConvertedArea;
  window.applyConverterPreset = applyConverterPreset;
  window.applyConvertedAreaModal = applyConvertedAreaModal;
  window.toggleAreaConverter = toggleAreaConverter;
  window.calculateConvertedArea = calculateConvertedArea;
  window.applyConvertedArea = applyConvertedArea;
  window.applyAreaPreset = applyAreaPreset;
  window.openWardSearchModal = openWardSearchModal;
  window.closeWardSearchModal = closeWardSearchModal;
  window.setWardZoneFilter = setWardZoneFilter;
  window.filterAndRenderWards = filterAndRenderWards;
  window.selectBbmpWard = selectBbmpWard;
  window.parseFeetInchesString = parseFeetInchesString;
  window.initSmartFtInAutoTab = initSmartFtInAutoTab;

  // Step 7 Review, Actions & PDF Export Package
  window.buildReviewSummary = buildReviewSummary;
  window.toggleReviewSection = toggleReviewSection;
  window.toggleAllReviewSections = toggleAllReviewSections;
  window.editFieldFromReview = editFieldFromReview;
  window.formatGpsSummary = formatGpsSummary;
  window.formatBoundarySummary = formatBoundarySummary;
  window.toggleLegalConsent = toggleLegalConsent;
  window.onGeneratePlanClick = onGeneratePlanClick;
  window.downloadPDFPackage = downloadPDFPackage;
  window.printPlanPackage = printPlanPackage;
  window.reportDrawingIssue = reportDrawingIssue;
  window.toggleLegendSheetPage = toggleLegendSheetPage;
  window.toggleSampleWatermark = toggleSampleWatermark;
  window.toggleBoundaryType = toggleBoundaryType;
  window.toggleRoadWidening = toggleRoadWidening;
  window.toggleBufferZone = toggleBufferZone;
  window.syncSignaturePreviews = syncSignaturePreviews;

  // Map Location & Geocoding
  window.openLocationPickerModal = openLocationPickerModal;
  window.closeLocationPickerModal = closeLocationPickerModal;
  window.searchMapLocation = searchMapLocation;
  window.locateOnPickerMap = locateOnPickerMap;
  window.resetToBangaloreCenter = resetToBangaloreCenter;
  window.flyPickerToZone = flyPickerToZone;
  window.setMapLayerType = setMapLayerType;
  window.onGpsZoomInput = onGpsZoomInput;
  window.syncGpsZoomControls = syncGpsZoomControls;
  window.applyPickerLocation = applyPickerLocation;
  window.detectGPSLocation = detectGPSLocation;
  window.onGpsCoordsInput = onGpsCoordsInput;
  window.onKeyPlanMapError = onKeyPlanMapError;

  // Geometry & Setbacks
  window.toggleOddSite = toggleOddSite;
  window.onRegularDimensionInput = onRegularDimensionInput;
  window.calculatePlotAreaFromSides = calculatePlotAreaFromSides;
  window.onFtInInput = onFtInInput;
  window.onBuildingTypeChange = onBuildingTypeChange;
  window.calculateBuiltUpArea = calculateBuiltUpArea;
  window.autoCalculateSetbacks = autoCalculateSetbacks;
  window.updateSetbackComplianceBadges = updateSetbackComplianceBadges;
  window.formatFeetInches = formatFeetInches;
  window.validateBuildingSetbackFeasibility = validateBuildingSetbackFeasibility;

  // Signatures & Architect Info
  window.onSignatureFileSelected = onSignatureFileSelected;
  window.openSignatureCropModal = openSignatureCropModal;
  window.closeSignatureCropModal = closeSignatureCropModal;
  window.removeSignature = removeSignature;
  window.reopenSignatureCrop = reopenSignatureCrop;
  window.resetCropTransform = resetCropTransform;
  window.onSignatureCropZoom = onSignatureCropZoom;
  window.applySignatureCrop = applySignatureCrop;
  window.redrawCropCanvas = redrawCropCanvas;
  window.onArchitectInfoInput = onArchitectInfoInput;

  // Contextual Smart Fill Presets & Derivations
  window.applyStep3SmartFill = applyStep3SmartFill;
  window.applyStep5SmartFill = applyStep5SmartFill;
  window.deriveStep5FromStep3 = deriveStep5FromStep3;
  window.onRoadFacingChange = onRoadFacingChange;
  window.triggerSmartFillChipAnimation = triggerSmartFillChipAnimation;
  window.STEP3_SMART_FILL_PRESETS = STEP3_SMART_FILL_PRESETS;
  window.STEP5_SMART_FILL_PRESETS = STEP5_SMART_FILL_PRESETS;
}


