import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { GeoJSONSource, Map } from 'mapbox-gl';

import { RootLayerIDs, SubLayerIDs } from './constants';
import { Lifer } from './api';

export function addSourceAndLayer(
  mapRef: Map,
  sourceId: RootLayerIDs,
  features: Feature<Geometry, GeoJsonProperties>[],
  visibility: 'visible' | 'none'
) {
  console.debug(
    `Adding source and layer for ${sourceId}, visibility: ${visibility}`
  );

  // Popular hotspots don't need clustering
  const sourceConfig =
    sourceId === RootLayerIDs.PopularHotspots
      ? {
          type: 'geojson' as const,
          data: {
            type: 'FeatureCollection' as const,
            features: features,
          },
        }
      : {
          type: 'geojson' as const,
          data: {
            type: 'FeatureCollection' as const,
            features: features,
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
          clusterProperties: {
            sum: ['+', ['get', 'liferCount', ['properties']]],
            species_codes: [
              'concat',
              ['concat', ['get', 'speciesCodes', ['properties']], ','],
            ],
          },
        };

  mapRef.addSource(sourceId, sourceConfig);

  // we're leaving the cluster circles here even for the ones with the opacity set to 0
  // this is so we want the cluster click mechanics still.
  // the downside is that this will render too much and also cause unnecessary collisions

  // Only add cluster layers for sources that support clustering
  if (sourceId !== RootLayerIDs.PopularHotspots) {
    mapRef.addLayer({
      id: `${sourceId}.${SubLayerIDs.ClusterCircles}`,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-stroke-color': 'black',
        'circle-stroke-width': 2,
        'circle-stroke-opacity':
          sourceId === RootLayerIDs.HistoricalLifers ? 1 : 0,
        'circle-color': [
          'interpolate',
          ['linear', 0.5],
          ['get', 'sum'],
          15,
          '#fadd00',
          250,
          '#ff70ba',
        ],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'sum'],
          10,
          15,
          250,
          40,
        ],
        'circle-opacity': sourceId === RootLayerIDs.HistoricalLifers ? 1 : 0,
      },
      layout: {
        visibility: visibility,
      },
    });
  }

  if (sourceId !== RootLayerIDs.PopularHotspots) {
    mapRef.addLayer({
      id: `${sourceId}.${SubLayerIDs.ClusterCount}`,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'sum'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        visibility: sourceId === RootLayerIDs.NewLifers ? 'none' : visibility,
      },
    });
  }

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.UnclusteredPointsCircle}`,
    type: 'circle',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    layout: {
      visibility: visibility,
      'circle-sort-key':
        sourceId === RootLayerIDs.PopularHotspots
          ? ['-', ['get', 'checklist_count']] // Sort circles by popularity (negative for descending)
          : ['-', ['get', 'liferCount']],
    },
    paint: {
      'circle-stroke-color': 'white',
      'circle-stroke-width': 2,
      'circle-color':
        sourceId === RootLayerIDs.PopularHotspots
          ? [
              'interpolate',
              ['linear'],
              ['get', 'checklist_count'],
              0,
              '#3F51B5', // Blue for low activity
              200,
              '#FF9800', // Orange for medium activity
              1000,
              '#F44336', // Red for high activity
            ]
          : [
              'interpolate',
              ['linear', 0.5],
              ['get', 'liferCount'],
              15,
              '#fadd00',
              250,
              '#ff70ba',
            ],
      'circle-radius':
        sourceId === RootLayerIDs.PopularHotspots
          ? [
              'interpolate',
              ['linear'],
              ['get', 'checklist_count'],
              0,
              8,
              200,
              12,
              1000,
              18,
            ]
          : ['interpolate', ['linear'], ['get', 'liferCount'], 10, 10, 250, 40],
      'circle-opacity': sourceId === RootLayerIDs.PopularHotspots ? 0.8 : 1,
    },
  });

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.UnclusteredPointsCount}`,
    type: 'symbol',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field':
        sourceId === RootLayerIDs.PopularHotspots
          ? ['get', 'checklist_count']
          : ['get', 'liferCount'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': sourceId === RootLayerIDs.PopularHotspots ? 10 : 12,
      'symbol-sort-key':
        sourceId === RootLayerIDs.PopularHotspots
          ? ['-', ['get', 'checklist_count']] // Sort by popularity (negative for descending)
          : ['-', ['get', 'liferCount']],
      'text-allow-overlap': false, // Prevent text overlap
      'text-ignore-placement': false, // Respect collision detection
      visibility: visibility,
    },
    paint: {
      'text-color':
        sourceId === RootLayerIDs.PopularHotspots ? 'white' : 'black',
      'text-halo-color':
        sourceId === RootLayerIDs.PopularHotspots ? 'rgba(0,0,0,0.7)' : 'white',
      'text-halo-width': 1,
    },
  });

  mapRef.addLayer({
    id: `${sourceId}.${SubLayerIDs.UnclusteredPointsLabel}`,
    type: 'symbol',
    filter: ['!', ['has', 'point_count']],
    source: sourceId,
    layout: {
      'text-field': ['get', 'title'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-offset': [
        0,
        sourceId === RootLayerIDs.PopularHotspots ? 1.5 : 1.25,
      ],
      'text-size': sourceId === RootLayerIDs.PopularHotspots ? 12 : 15,
      'text-anchor': 'top',
      'icon-size': 0.5,
      'symbol-sort-key':
        sourceId === RootLayerIDs.PopularHotspots
          ? ['-', ['get', 'checklist_count']] // Sort by popularity (negative for descending)
          : ['-', ['get', 'liferCount']],
      'text-optional': true, // Allow text to be hidden when there's collision
      'text-allow-overlap': false, // Prevent label overlap
      'text-ignore-placement': false, // Respect collision detection
      visibility: visibility,
    },
    paint: {
      'text-color':
        sourceId === RootLayerIDs.PopularHotspots ? '#333' : 'black',
      'text-halo-color': 'white',
      'text-halo-width': 1.5,
    },
  });

  // inspect a cluster on click (only for clustered layers)
  if (sourceId !== RootLayerIDs.PopularHotspots) {
    mapRef.on('click', `${sourceId}.${SubLayerIDs.ClusterCircles}`, (e) => {
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
  }

  // Add click handlers for unclustered points
  mapRef.on(
    'click',
    `${sourceId}.${SubLayerIDs.UnclusteredPointsCircle}`,
    (e) => {
      // @ts-expect-error untyped event
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features![0].properties!;

      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      if (sourceId === RootLayerIDs.PopularHotspots) {
        // Handle hotspot popup
        const locationName = properties.title || 'Unknown Hotspot';
        const locationId = properties.location_id;
        const checklistCount = properties.checklist_count || 0;

        const html = [
          '<div class=hotspot-popup-container>',
          `<h4>${locationName}</h4>`,
          `<p>${checklistCount} average weekly checklists</p>`,
          `<a class=ebird-hotspot-link href="https://ebird.org/hotspot/${locationId}/" target="_blank">View on eBird ↗</a>`,
          '</div>',
        ].join('\n');

        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(mapRef);
      } else {
        // Handle lifer popup
        const lifers = JSON.parse(properties.lifers) as Lifer[];

        const html: string[] = [
          '<div class=hotspot-popup-container >',
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
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            });

            html.push(`<div>${localeDate} - ${lifer.common_name} </div>`);
          });
        html.push('</div>');

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(html.join('\n'))
          .addTo(mapRef);
      }
    }
  );
}
