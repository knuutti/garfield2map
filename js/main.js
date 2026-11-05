import { loadManifest } from './manifest.js';
import { createBaseLayer, createProjection, imageBounds, zoomRange } from './coords.js';
import { parseRoute, navigate, replaceRoute } from './router.js';
import { loadMapLayers } from './markers.js';
import { MousePosition, ColorPicker } from './controls.js';
import { setupDrawing } from './draw.js';
import { SmoothWheelZoom } from './wheelzoom.js';
import { createSidebar, isPlainClick } from './sidebar.js';
import { createObjectPanel } from './objectpanel.js';

const manifest = await loadManifest();

/* One Leaflet map for the whole session; switching maps swaps its layers. */
const map = L.map('map', {
  crs: L.CRS.Simple,
  preferCanvas: true,
  attributionControl: false,
  zoomSnap: 0.25,
  scrollWheelZoom: false, // replaced by smoothWheelZoom
  minZoom: -3,
  maxZoom: 2,
});
map.addHandler('smoothWheelZoom', SmoothWheelZoom);
map.smoothWheelZoom.enable();

let current = null;   // { def, projection, base, layers, enabled, carried }
let loadToken = 0;    // ignores data that arrives after the user moved on

const mousePosition = new MousePosition().addTo(map);
const drawing = setupDrawing(map, () => current.projection);
new ColorPicker((color) => drawing.setColor(color)).addTo(map);
const objectPanel = createObjectPanel(document.getElementById('object-panel'), {
  onToggle: toggleLayer,
  onClear: () => setEnabledLayers([]),
  onResize: () => map.invalidateSize(),
});

// layers this map lacks stay selected for the next map that has them
const currentLayers = () => current ? [...current.enabled, ...current.carried] : [];

const sidebar = createSidebar(document.getElementById('sidebar'), manifest, {
  getLayers: currentLayers,
  onResize: () => map.invalidateSize(),
});

// "Open map" links in object popups keep the layers that are on
document.getElementById('map').addEventListener('click', (event) => {
  const link = event.target.closest('a[data-key]');
  if (link && isPlainClick(event)) {
    event.preventDefault();
    navigate(link.dataset.key, currentLayers());
  }
}, true);

map.on('mousemove', (event) => {
  if (current) {
    mousePosition.setPosition(current.projection.toGame(event.latlng));
  }
});

function setEnabledLayers(types) {
  current.enabled = new Set(types.filter((type) => current.layers?.[type]));
  current.carried = current.layers ? types.filter((type) => !current.layers[type]) : [];
  Object.entries(current.layers ?? {}).forEach(([type, layer]) => {
    if (current.enabled.has(type)) {
      layer.group.addTo(map);
    } else {
      layer.group.remove();
    }
  });
  objectPanel.setEnabled(current.enabled);
  replaceRoute(current.def.key, [...current.enabled]);
}

function toggleLayer(type, on) {
  const types = new Set(current.enabled);
  if (on) {
    types.add(type);
  } else {
    types.delete(type);
  }
  setEnabledLayers([...types, ...current.carried]);
}

function unloadCurrentMap() {
  current.base.remove();
  Object.values(current.layers ?? {}).forEach((layer) => layer.group.remove());
  drawing.clear();
}

function showRoute() {
  const route = parseRoute();
  const def = manifest.maps.get(route.mapKey);
  if (!def) {
    // no map, or an unknown one: open the first map
    replaceRoute(manifest.defaultKey, route.layers);
  }
  showMap(def ?? manifest.maps.get(manifest.defaultKey), route.layers);
}

async function showMap(def, layers) {
  if (current?.def === def) {
    if (current.layers) {
      setEnabledLayers(layers);
    }
    return;
  }

  if (current) {
    unloadCurrentMap();
  }

  const token = ++loadToken;
  const size = def.assets.size;
  const bounds = imageBounds(size);
  const zoom = zoomRange(size, map.getSize());
  // Set the limits without setMinZoom/setMaxZoom: when the old zoom falls
  // outside the new range they start an animated zoom around the old
  // center, which lands after fitBounds below and overrides it.
  map.smoothWheelZoom._finish();
  map.options.minZoom = zoom.min;
  map.options.maxZoom = zoom.max;
  map.fire('zoomlevelschange');
  const projection = createProjection(def.calib);
  current = {
    def,
    projection,
    base: createBaseLayer(def, bounds, manifest.assetBase).addTo(map),
    layers: null,
    enabled: new Set(layers),
    carried: [],
  };
  map.fitBounds(bounds, { animate: false });
  sidebar.setMap(def);
  document.title = `${def.name} - Garfield 2 Map`;
  mousePosition.setPosition([0, 0]);
  objectPanel.setLayers({}, current.enabled, 'Loading objects…');

  const mapLayers = await loadMapLayers(def, projection, manifest.markerTypes,
    (key) => manifest.maps.get(key));
  if (token !== loadToken) {
    return;
  }
  current.layers = mapLayers;
  objectPanel.setLayers(mapLayers, current.enabled);
  setEnabledLayers(layers);
}

window.addEventListener('hashchange', showRoute);
showRoute();
