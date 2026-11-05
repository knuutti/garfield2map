/* Loads data/maps.json and data/marker-types.json. */

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

export async function loadManifest() {
  const [catalog, markerTypes] = await Promise.all([
    fetchJson('./data/maps.json'),
    fetchJson('./data/marker-types.json'),
  ]);
  const entries = catalog.maps.map((map) => ({ ...map, key: map.id }));
  return {
    entries,
    maps: new Map(entries.map((entry) => [entry.key, entry])),
    markerTypes,
    // map tiles live in the shared R2 bucket
    assetBase: catalog.assetBase,
    defaultKey: entries[0].key,
  };
}
