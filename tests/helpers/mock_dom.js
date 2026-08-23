/**
 * @file mock_dom.js
 * @description Shared, robust mock DOM and browser environment for e-Plan Studio test suites.
 */

export class MockClassList {
  constructor(el) {
    this.el = el;
    this.classes = new Set();
  }
  add(...names) { names.forEach(n => this.classes.add(n)); }
  remove(...names) { names.forEach(n => this.classes.delete(n)); }
  contains(name) { return this.classes.has(name); }
  toggle(name, force) {
    if (force !== undefined) {
      if (force) this.classes.add(name);
      else this.classes.delete(name);
      return !!force;
    }
    if (this.classes.has(name)) { this.classes.delete(name); return false; }
    this.classes.add(name); return true;
  }
}

export class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this._value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.src = '';
    this.checked = false;
    this.disabled = false;
    this.dataset = {};
    this.attributes = new Map();
    this.style = {
      display: 'block',
      setProperty(prop, val) { this[prop] = val; }
    };
    this.classList = new MockClassList(this);
    this.children = [];
    this.parentElement = null;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.clientWidth = 800;
    this.clientHeight = 600;
    this.offsetWidth = 800;
    this.offsetHeight = 600;
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v ?? ''); }

  getAttribute(name) { return this.attributes.get(name) || null; }
  setAttribute(name, val) { this.attributes.set(name, String(val)); }
  removeAttribute(name) { this.attributes.delete(name); }

  focus() { }
  blur() { }
  select() { }
  scrollIntoView() { }
  click() { }
  addEventListener(event, handler) { }
  removeEventListener(event, handler) { }
  closest() { return this.parentElement; }
  querySelectorAll() { return []; }
  querySelector() { return null; }

  appendChild(child) {
    this.children.push(child);
    if (child instanceof MockElement) child.parentElement = this;
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      if (child instanceof MockElement) child.parentElement = null;
    }
    return child;
  }

  getContext() {
    return {
      save() { },
      restore() { },
      translate() { },
      rotate() { },
      scale() { },
      beginPath() { },
      closePath() { },
      moveTo() { },
      lineTo() { },
      stroke() { },
      fill() { },
      fillRect() { },
      strokeRect() { },
      clearRect() { },
      arc() { },
      ellipse() { },
      setLineDash() { },
      fillText() { },
      strokeText() { },
      measureText(text) { return { width: (text || '').length * 7 }; },
      drawImage() { },
      getImageData() {
        return { data: new Uint8ClampedArray(400 * 400 * 4) };
      },
      putImageData() { },
      createImageData() { return { data: new Uint8ClampedArray(400 * 400 * 4) }; }
    };
  }

  toDataURL() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

export class MockDocument {
  constructor() {
    this.elements = new Map();
    this.head = this.createElement('head');
    this.body = this.createElement('body');
    this.documentElement = this.createElement('html');
  }

  createElement(tagName) {
    return new MockElement('', tagName);
  }

  getElementById(id) {
    if (!this.elements.has(id)) {
      this.elements.set(id, new MockElement(id));
    }
    return this.elements.get(id);
  }

  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return this.createElement('div');
  }

  querySelectorAll() {
    return [];
  }

  addEventListener() { }
  removeEventListener() { }
}

export function createMockBrowserEnvironment() {
  const mockStorage = new Map();
  const mockDoc = new MockDocument();

  const mockWindow = {
    document: mockDoc,
    localStorage: {
      getItem: (k) => mockStorage.get(k) || null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
      clear: () => mockStorage.clear(),
      get length() { return mockStorage.size; },
      key: (i) => Array.from(mockStorage.keys())[i] || null
    },
    sessionStorage: {
      getItem: (k) => mockStorage.get(`sess_${k}`) || null,
      setItem: (k, v) => mockStorage.set(`sess_${k}`, String(v)),
      removeItem: (k) => mockStorage.delete(`sess_${k}`),
      clear: () => mockStorage.clear()
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      geolocation: {
        getCurrentPosition: (success) => {
          success({
            coords: {
              latitude: 12.9716,
              longitude: 77.5946,
              accuracy: 10
            }
          });
        }
      }
    },
    matchMedia: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => { },
      removeListener: () => { },
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => false
    }),
    alert: () => { },
    confirm: () => true,
    prompt: () => '',
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
    clearTimeout: () => { },
    setInterval: () => 1,
    clearInterval: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    URLSearchParams: globalThis.URLSearchParams,
    location: { search: '', reload: () => { } },
    Image: class {
      constructor() {
        this._src = '';
        this.width = 100;
        this.height = 100;
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        this.onload = null;
      }
      get src() { return this._src; }
      set src(v) { this._src = v; if (typeof this.onload === 'function') this.onload(); }
    },
    L: {
      map: () => {
        const mapInst = {
          flyTo() { return mapInst; },
          setView() { return mapInst; },
          getZoom() { return 15; },
          invalidateSize() { },
          hasLayer() { return false; },
          removeLayer() { },
          on() { return mapInst; },
          addLayer() { return mapInst; }
        };
        return mapInst;
      },
      tileLayer: () => {
        const tileInst = {
          addTo(map) { return tileInst; },
          on() { return tileInst; }
        };
        return tileInst;
      },
      marker: () => {
        const markerInst = {
          addTo(map) { return markerInst; },
          setLatLng() { return markerInst; },
          getLatLng() { return { lat: 12.9716, lng: 77.5946 }; },
          on() { return markerInst; }
        };
        return markerInst;
      },
      divIcon: (opts) => opts
    }
  };

  mockWindow.window = mockWindow;
  mockWindow.global = mockWindow;

  return { mockDoc, mockWindow, mockStorage };
}
