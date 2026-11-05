/* The sidebar next to the map: the list of maps. */

import { navigate, routeHash } from './router.js';

const NARROW_SCREEN = window.matchMedia('(max-width: 700px)');
const SIDEBAR_STATE_KEY = 'garfield2map.sidebarOpen';
const MENU_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

/* Plain clicks on map links keep the object layers that are switched on. */
export function isPlainClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function readStoredOpen() {
  try {
    const value = localStorage.getItem(SIDEBAR_STATE_KEY);
    return value === null ? null : value === 'true';
  } catch {
    return null;
  }
}

function storeOpen(open) {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(open));
  } catch {
    // private mode etc.; the state just isn't remembered
  }
}

/* getLayers() returns the object layers to carry over to the next map;
 * onResize() is called when the sidebar changes the map's width. */
export function createSidebar(root, manifest, { getLayers, onResize }) {
  root.innerHTML = `
    <div class="sidebar-rail">
      <button class="icon-button sidebar-toggle" type="button" aria-controls="sidebar-panel">${MENU_ICON}</button>
    </div>
    <div class="sidebar-panel" id="sidebar-panel">
      <h1 class="brand">Garfield 2 Map</h1>
      <nav class="map-list" aria-label="Maps"><ul></ul></nav>
    </div>`;

  const toggle = root.querySelector('.sidebar-toggle');
  const list = root.querySelector('.map-list ul');

  list.replaceChildren(...manifest.entries.map((entry) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = routeHash(entry.key);
    link.dataset.key = entry.key;
    link.textContent = entry.name;
    item.append(link);
    return item;
  }));

  function setOpen(open, remember = true) {
    root.classList.toggle('collapsed', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.title = open ? 'Hide map list' : 'Show map list';
    toggle.setAttribute('aria-label', toggle.title);
    if (remember && !NARROW_SCREEN.matches) {
      storeOpen(open);
    }
    onResize();
  }

  list.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-key]');
    if (link && isPlainClick(event)) {
      event.preventDefault();
      navigate(link.dataset.key, getLayers());
      if (NARROW_SCREEN.matches) {
        setOpen(false, false);
      }
    }
  });
  toggle.addEventListener('click', () => setOpen(root.classList.contains('collapsed')));

  setOpen(NARROW_SCREEN.matches ? false : readStoredOpen() ?? true, false);

  return {
    setMap(entry) {
      list.querySelectorAll('a').forEach((link) => {
        if (link.dataset.key === entry.key) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    },
  };
}
