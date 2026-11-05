# Garfield 2 Map

Interactive maps for Garfield 2: Garden, Castle, Sewers and Roof. A cut-down
fork of [SlyMap](https://github.com/knuutti/slymap), showing only the map view
with its map list and object panel.

## Running locally

The page loads its data with `fetch`, so serve the folder over HTTP:

```
python3 -m http.server
```

and open `http://localhost:8000/`. Maps are addressed as
`#/g2_garden?layers=Lasagna,Vase`. There is no build step, so the folder can be
served as it is from GitHub Pages.

## Project layout

* `data/maps.json` – the maps: name, coordinate calibration, object data files
  and tile details. Tiles come from the SlyMap asset bucket (`assetBase`).
* `data/marker-types.json` – icon / colour / label per object type. Types not
  listed get a fixed colour derived from their name.
* `hson/` – object data per map. Hall and Catacombs have data but no map image
  yet, so they aren't listed in `data/maps.json`.
* `js/` – the app (ES modules), `styles.css` – the styles.

Tiles are built and uploaded with the tools in the SlyMap repository.

## Dependencies

* leaflet.js (linked from their CDN)
* [leaflet-canvas-markers](https://github.com/lipton-ice-tea/leaflet-canvas-markers)
* leaflet-draw

## License

GPL-3.0, as SlyMap. See `LICENSE`.
