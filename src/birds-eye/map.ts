import { Feature, GeoJsonProperties, Geometry } from "geojson";
import mapboxgl from "mapbox-gl";
import { GeoJSONSource, Map } from "mapbox-gl";

import { RootLayerIDs, SubLayerIDs } from "./constants";
import { Lifer } from "./api";

export function addSourceAndLayer(
  mapRef: Map,
  sourceId: RootLayerIDs,
  features: Feature<Geometry, GeoJsonProperties>[],
  visibility: "visible" | "none",
) {
  console.debug(
    `Adding source and layer for ${sourceId}, visibility: ${visibility}`,
  );
  mapRef.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: features,
    },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    clusterProperties: {
      sum: ["+", ["get", "liferCount", ["properties"]]],
      species_codes: [
        "concat",
        ["concat", ["get", "speciesCodes", ["properties"]], ","],
      ],
    },
  });

  // we're leaving the cluster circles here even for the ones with the opacity set to 0
  // this is so we want the cluster click mechanics still.
  // the downside is that this will render too much and also cause unnecessary collisions

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.ClusterCircles}`,
    type: "circle",
    source: sourceId,
    filter: ["has", "point_count"],
    paint: {
      "circle-stroke-color": "black",
      "circle-stroke-width": 2,
      "circle-stroke-opacity":
        sourceId === RootLayerIDs.HistoricalLifers ? 1 : 0,
      "circle-color": [
        "interpolate",
        ["linear", 0.5],
        ["get", "sum"],
        15,
        "#fadd00",
        250,
        "#ff70ba",
      ],
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "sum"],
        10,
        15,
        250,
        40,
      ],
      "circle-opacity": sourceId === RootLayerIDs.HistoricalLifers ? 1 : 0,
    },
    layout: {
      visibility: visibility,
    },
  });

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.ClusterCount}`,
    type: "symbol",
    source: sourceId,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "sum"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      visibility: sourceId === RootLayerIDs.NewLifers ? "none" : visibility,
    },
  });

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.UnclusteredPointsCircle}`,
    type: "circle",
    source: sourceId,
    filter: ["!", ["has", "point_count"]],
    layout: {
      visibility: visibility,
    },
    paint: {
      "circle-stroke-color": "black",
      "circle-stroke-width": 2,
      "circle-color": [
        "interpolate",
        ["linear", 0.5],
        ["get", "liferCount"],
        15,
        "#fadd00",
        250,
        "#ff70ba",
      ],
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "liferCount"],
        10,
        10,
        250,
        40,
      ],
    },
  });

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.UnclusteredPointsCount}`,
    type: "symbol",
    source: sourceId,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["get", "liferCount"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      visibility: visibility,
    },
  });

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.UnclusteredPointsLabel}`,
    type: "symbol",
    filter: ["!", ["has", "point_count"]],
    source: sourceId,
    layout: {
      "text-field": ["get", "title"],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [0, 1.25],
      "text-size": 15,
      "text-anchor": "top",
      "icon-size": 0.5,
      visibility: visibility,
    },
  });

  // inspect a cluster on click
  mapRef.on("click", `${sourceId}.${SubLayerIDs.ClusterCircles}`, (e) => {
    const features = mapRef.queryRenderedFeatures(e.point, {
      layers: [`${sourceId}.${SubLayerIDs.ClusterCircles}`],
    });
    const clusterId = features[0].properties?.cluster_id;
    mapRef
      .getSource<GeoJSONSource>(sourceId)!
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        mapRef.easeTo({
          // @ts-expect-error untyped event
          center: features[0].geometry.coordinates,
          zoom: zoom! + 1,
        });
      });
  });

  mapRef.on(
    "click",
    `${sourceId}.${SubLayerIDs.UnclusteredPointsCircle}`,
    (e) => {
      // @ts-expect-error untyped event
      const coordinates = e.features[0].geometry.coordinates.slice();
      const lifers = JSON.parse(e.features![0].properties!.lifers) as Lifer[];

      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const html: string[] = [
        "<div class=hotspot-popup-container >",
        `<a class=ebird-hotspot-link href="https://ebird.org/hotspot/${lifers[0].location_id}/" target="_blank">eBird↗</a>`,
      ];
      lifers
        // sort by most recent
        .sort((a: Lifer, b: Lifer) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .map((lifer: Lifer) => {
          const date = new Date(lifer.date);
          const localeDate = date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          });

          html.push(`<div>${localeDate} - ${lifer.common_name} </div>`);
        });
      html.push("</div>");

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(html.join("\n"))
        .addTo(mapRef);
    },
  );
}
