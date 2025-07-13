import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import mapboxgl, { GeoJSONSource, Map, Marker } from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { BarLoader } from 'react-spinners';
import { useDebounce } from 'use-debounce';
import { SpeciesSelectionList } from './SpeciesSelectionList';
import { WaitAndUploadModal } from './WaitAndUploadModal';
import {
  fetchLifers,
  fetchRegionalAndNearbyLifers,
  Lifer,
  lifersToGeoJson,
  LocationByLiferResponse,
  nearbyObservationsToGeoJson,
  Species,
} from './api';
import {
  allLayerIdRoots,
  allSubLayerIds,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  RootLayerIDs,
} from './constants';
import { addSourceAndLayer } from './map';

const MODE = 'production'; // 'development' or 'production' - hardcoded for Docusaurus

const LayerToggle = ({
  id,
  label,
  checked,
  onClick,
}: {
  id: RootLayerIDs;
  label: string;
  checked: boolean;
  onClick: (e: { target: { id: string } }) => void;
}) => {
  return (
    <label className="form-control" htmlFor={id}>
      <input type="radio" id={id} checked={checked} onChange={onClick} />
      {label}
    </label>
  );
};

function filterResponseToSpecies(
  response: LocationByLiferResponse,
  speciesFilter: SpeciesFilter
) {
  if (speciesFilter === 'all') return response;
  if (speciesFilter === 'none') return {};
  const filteredData: LocationByLiferResponse = {};
  Object.entries(response).forEach(([key, value]) => {
    const matchingLifers = value.lifers.filter((lifer) => {
      return speciesFilter.includes(lifer.species_code);
    });

    if (matchingLifers.length > 0) {
      filteredData[key] = {
        location: value.location,
        lifers: matchingLifers,
      };
    }
  });

  return filteredData;
}

export type SpeciesFilter = 'all' | 'none' | string[];

export function BirdMap() {
  const mapRef = useRef<Map>();
  const mapContainerRef = useRef<HTMLElement>();

  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [debouncedCenter] = useDebounce(center, 500);

  const [activeLayerId, setActiveLayerId] = useState(
    RootLayerIDs.HistoricalLifers
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [fileId, setFileId] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');
  const [visibleSpecies, setVisibleSpecies] = useState<Lifer[]>([]);
  // debouncing this since it seems to flicker a lot due to rendering?
  const [debouncedVisibleSpecies] = useDebounce(visibleSpecies, 50);

  useEffect(() => {
    if (fileId === '') return;

    // Set Mapbox token - in Docusaurus, we'll use a direct assignment for now
    mapboxgl.accessToken =
      'pk.eyJ1IjoiZGF2aWR0bWVhZG93cyIsImEiOiJjbTF0djNteTgwNzYzMnFvbGJrdjU3YzMzIn0.3sZJbLI9SKeK4Zs2ZFsuaA';
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    mapRef.current!.on('load', () => {
      fetchLifers(INITIAL_CENTER.lat, INITIAL_CENTER.lng, fileId).then(
        (data) => {
          const lifersFeatures = lifersToGeoJson(data);
          addSourceAndLayer(
            mapRef.current!,
            RootLayerIDs.HistoricalLifers,
            lifersFeatures,
            activeLayerId === RootLayerIDs.HistoricalLifers ? 'visible' : 'none'
          );
        }
      );

      fetchRegionalAndNearbyLifers(
        INITIAL_CENTER.lat,
        INITIAL_CENTER.lng,
        fileId
      ).then((data) => {
        if (!data) return;
        addSourceAndLayer(
          mapRef.current!,
          RootLayerIDs.NewLifers,
          nearbyObservationsToGeoJson(
            filterResponseToSpecies(data, speciesFilter)
          ),
          activeLayerId === RootLayerIDs.NewLifers ? 'visible' : 'none'
        );
      });

      setMapLoaded(true);
    });

    // update map state on move so that we can use the lat/long values elsewhere (fetching data, etc)
    mapRef.current!.on('move', () => {
      const mapCenter = mapRef.current!.getCenter();
      const mapZoom = mapRef.current!.getZoom();

      // update state
      setCenter({ lng: mapCenter.lng, lat: mapCenter.lat });
      setZoom(mapZoom);
    });

    return () => {
      mapRef.current!.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    if (!mapRef.current) return;
    // const timeOfLastRender = performance.now();
    const markers: { [key: string]: Marker } = {};
    const markersOnScreen: { [key: string]: { [key: string]: Marker } } = {};

    const updateVisibleSpecies = () => {
      const source = mapRef.current?.getSource(
        RootLayerIDs.NewLifers
      ) as GeoJSONSource;
      if (!source) return;

      const renderedFeatures =
        mapRef.current!.querySourceFeatures(activeLayerId);

      const visibleSpeciesTemp: Lifer[] = [];
      const clusterIdToLifers: { [key: string]: Lifer[] } = {};
      renderedFeatures?.forEach((feature) => {
        if (!feature.properties) return;
        if (!!feature.properties?.cluster === true) {
          const clusterId = feature.properties.cluster_id;
          const point_count = feature.properties.point_count;

          if (clusterIdToLifers[clusterId]) {
            visibleSpeciesTemp.push(...clusterIdToLifers[clusterId]);
            return;
          }

          // todo probably should cache this smartly?
          source.getClusterLeaves(
            clusterId,
            point_count,
            0,
            function (
              err,
              aFeatures:
                | Feature<Geometry, GeoJsonProperties>[]
                | null
                | undefined
            ): void {
              if (err) return;
              if (!aFeatures) return;
              const lifersForCluster = aFeatures
                .flatMap((f) => {
                  return f.properties?.lifers as Lifer[];
                })
                .flat();
              clusterIdToLifers[clusterId] = lifersForCluster;
              visibleSpeciesTemp.push(...lifersForCluster);
            }
          );
        } else {
          visibleSpeciesTemp.push(
            ...(JSON.parse(feature.properties.lifers) as Lifer[])
          );
        }

        setVisibleSpecies(visibleSpeciesTemp);
      });
    };

    const updateMarkers = () => {
      if (activeLayerId !== RootLayerIDs.NewLifers) return;
      // reset markers on screen for other layers
      for (const rootLayer in markersOnScreen) {
        if (rootLayer !== activeLayerId) {
          console.debug(`removing markers for ${rootLayer}`);
          for (const id in markersOnScreen[rootLayer]) {
            markersOnScreen[rootLayer][id].remove();
          }
        }
      }

      const newMarkers: { [key: string]: Marker } = {};
      const features = mapRef.current!.querySourceFeatures(activeLayerId);

      // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
      // and add it to the map if it's not there already
      for (const feature of features) {
        // @ts-expect-error untyped feature
        const coords = feature.geometry.coordinates;
        const properties = feature.properties;
        if (!properties?.cluster) continue;
        const id = properties.cluster_id;

        let marker = markers[id];
        if (!marker) {
          // @ts-expect-error untyped properties
          const el = createCustomHTMLMarker(properties);
          marker = markers[id] = new mapboxgl.Marker({
            // @ts-expect-error mismatched types
            element: el,
          }).setLngLat(coords);
        }
        newMarkers[id] = marker;

        if (!markersOnScreen[id]) marker.addTo(mapRef.current!);
      }
      // for every marker we've added previously, remove those that are no longer visible
      for (const id in markersOnScreen[activeLayerId]) {
        if (!newMarkers[id]) {
          markersOnScreen[activeLayerId][id].remove();
        }
      }

      markersOnScreen[activeLayerId] = newMarkers;
    };

    // after the GeoJSON data is loaded, update markers on the screen on every frame
    mapRef.current!.on('render', () => {
      if (!mapRef.current!.isSourceLoaded(activeLayerId)) return;
      updateVisibleSpecies();
      updateMarkers();
    });
  }, [activeLayerId]);

  const visibleSpeciesWithLocation = useMemo(() => {
    return groupVisibleSpeciesByLocation(debouncedVisibleSpecies);
  }, [debouncedVisibleSpecies]);

  useEffect(() => {
    if (!mapLoaded) return;

    allLayerIdRoots.forEach((rootLayerId) => {
      const layerIds = allSubLayerIds.map(
        (subLayerId) => `${rootLayerId}.${subLayerId}`
      );
      layerIds.forEach((layerId) => {
        if (mapRef.current!.getLayer(layerId)) {
          const visibility = activeLayerId === rootLayerId ? 'visible' : 'none';
          console.debug(`Setting visibility for ${layerId} to ${visibility}`);
          mapRef.current!.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    });
  }, [activeLayerId, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;
    if (activeLayerId !== RootLayerIDs.NewLifers) return;

    // we do this since for now:
    // 1. We have regional lifers that don't recompute past the initial load
    // 2. At this level you can't really see the nearby ones
    if (zoom < 6) {
      return;
    }

    setShowLoading(true);
    fetchRegionalAndNearbyLifers(
      debouncedCenter.lat,
      debouncedCenter.lng,
      fileId
    )
      .then((data) => {
        if (!data) return;
        const lifersSource = mapRef.current!.getSource(
          RootLayerIDs.NewLifers
        ) as GeoJSONSource | undefined;
        if (!lifersSource) return;
        lifersSource.setData({
          type: 'FeatureCollection',
          features: nearbyObservationsToGeoJson(
            filterResponseToSpecies(data, speciesFilter)
          ),
        });
      })
      .finally(() => {
        setShowLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedCenter.lat,
    debouncedCenter,
    mapLoaded,
    fileId,
    activeLayerId,
    speciesFilter,
  ]);

  const handleClick = useCallback((e: { target: { id: string } }) => {
    setActiveLayerId(e.target.id as RootLayerIDs);
  }, []);

  return (
    <div className="root-container">
      <WaitAndUploadModal
        showModal={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
        }}
        onUploadComplete={(fileId: string) => {
          setFileId(fileId);
          setShowUploadModal(false);
        }}
        canClose={fileId !== ''}
      />
      <div className="topBar">
        <LayerToggle
          id={RootLayerIDs.HistoricalLifers}
          label="Show historical lifers"
          checked={activeLayerId === RootLayerIDs.HistoricalLifers}
          onClick={handleClick}
        />
        <LayerToggle
          id={RootLayerIDs.NewLifers}
          label="Show potential new lifers. Note: you need be fairly zoomed in for these to display properly."
          checked={activeLayerId === RootLayerIDs.NewLifers}
          onClick={handleClick}
        />
        <button onClick={() => setShowUploadModal(true)}>Change CSV</button>
      </div>
      <div
        id="map-container"
        // @ts-expect-error something something ref error
        ref={mapContainerRef!}
      />
      {showLoading && <BarLoader className="loadingBar" width={200} />}
      {MODE === 'development' && (
        <div className="sidebar">
          Longitude: {center.lng.toFixed(4)} | Latitude: {center.lat.toFixed(4)}{' '}
          | Zoom: {zoom.toFixed(2)} | Mode: {MODE}
        </div>
      )}
      {Object.keys(visibleSpeciesWithLocation).length > 0 && (
        <SpeciesSelectionList
          visibleSpeciesWithLocation={visibleSpeciesWithLocation}
          onUpdateToCheckedCodes={(checkedCodes) => {
            console.debug(`updating species filter to ${checkedCodes}`);
            setSpeciesFilter(checkedCodes);
          }}
        />
      )}
    </div>
  );
}

export type VisibleSpeciesWithLocation = {
  [key: string]: { species: Species; lifers: Lifer[] };
};

function groupVisibleSpeciesByLocation(
  visibleSpecies: Lifer[]
): VisibleSpeciesWithLocation {
  const visibleSpeciesWithLocation: VisibleSpeciesWithLocation = {};
  visibleSpecies.forEach((lifer) => {
    if (!visibleSpeciesWithLocation[lifer.species_code]) {
      visibleSpeciesWithLocation[lifer.species_code] = {
        species: {
          common_name: lifer.common_name,
          species_code: lifer.species_code,
          taxonomic_order: lifer.taxonomic_order,
        },
        lifers: [],
      };
    }

    visibleSpeciesWithLocation[lifer.species_code].lifers.push(lifer);
  });

  return visibleSpeciesWithLocation;
}

function parseSpeciesCodeStringToSet(speciesCodes: string) {
  return [...new Set(speciesCodes.split(','))].filter(
    (code) => code.trim().length > 1
  );
}

function createCustomHTMLMarker(props: {
  [x: string]: unknown;
  species_codes: string;
}) {
  const speciesCodes = parseSpeciesCodeStringToSet(
    props.species_codes as string
  );

  let classification = '';
  if (speciesCodes.length <= 10) {
    classification = 'small';
  } else if (speciesCodes.length <= 50) {
    classification = 'medium';
  } else {
    classification = 'large';
  }
  let radius = 30;
  let backgroundColor = '#fadd00';
  switch (classification) {
    case 'small':
      break;
    case 'medium':
      radius = 30;
      backgroundColor = '#F2C74D';
      break;
    case 'large':
      radius = 50;
      backgroundColor = '#ff70ba';
      break;
  }
  const width = radius;
  const height = radius;

  const html = `<div>
        <circle class="cluster-classification" class="cluster-classification-${classification}" style="width: ${width}px; height: ${height}px; background-color: ${backgroundColor};">
          <text dominant-baseline="central">
            ${speciesCodes.length}
          </text>
        </circle>
      </div>`;

  const el = document.createElement('div');
  el.innerHTML = html;
  return el.firstChild!;
}
