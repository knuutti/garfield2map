/* Hash route of a map: #/<map>?layers=Lasagna,Vase
 * Map changes push a history entry (back/forward work), layer toggles
 * replace the current one. */

export function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = hash.split('?');
  const layersParam = query.split('&').find((part) => part.startsWith('layers='));
  const layers = layersParam
    ? layersParam.slice('layers='.length).split(',').filter(Boolean).map(safeDecode)
    : [];
  return { mapKey: path.replace(/\/+$/, ''), layers };
}

export function routeHash(key, layers = []) {
  const query = layers.length ? '?layers=' + layers.map(encodeURIComponent).join(',') : '';
  return `#/${key}${query}`;
}

export function navigate(key, layers) {
  window.location.hash = routeHash(key, layers);
}

export function replaceRoute(key, layers) {
  history.replaceState(null, '', window.location.pathname + routeHash(key, layers));
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
