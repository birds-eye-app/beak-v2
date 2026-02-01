import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl, { GeoJSONSource, Map, Marker } from 'mapbox-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { BarLoader } from 'react-spinners';
import { useDebounce } from 'use-debounce';
import { SpeciesSelectionList } from './SpeciesSelectionList';
import { WaitAndUploadModal } from './WaitAndUploadModal';
import {
  fetchLifers,
  fetchPopularHotspots,
  fetchRegionalAndNearbyLifers,
  HomeLocationInfo,
  hotspotsToGeoJson,
  Lifer,
  lifersToGeoJson,
  LocationByLiferResponse,
  nearbyObservationsToGeoJson,
  PopularHotspot,
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

const MODE: 'development' | 'production' = 'production'; // 'development' or 'production' - hardcoded for Docusaurus

const LayerToggle = ({
  id,
  label,
  checked,
  onClick,
  tooltip,
}: {
  id: RootLayerIDs;
  label: string;
  checked: boolean;
  onClick: (e: { target: { id: string } }) => void;
  tooltip?: string;
}) => {
  return (
    <label className="form-control" htmlFor={id}>
      <input type="radio" id={id} checked={checked} onChange={onClick} />
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {label}
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoIcon
              style={{
                fontSize: 14,
                marginLeft: 4,
                cursor: 'help',
                opacity: 0.7,
              }}
            />
          </Tooltip>
        )}
      </span>
    </label>
  );
};

const MonthSelector = ({
  selectedMonth,
  onMonthChange,
}: {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
}) => {
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: isNarrow ? '2px' : '8px',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
      }}
    >
      {months.map((month, index) => {
        const monthNumber = index + 1;
        return (
          <label
            key={monthNumber}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              padding: isNarrow ? '4px 4px' : '4px 6px',
              borderRadius: '3px',
              backgroundColor:
                selectedMonth === monthNumber ? '#4CAF50' : 'transparent',
              color: selectedMonth === monthNumber ? 'white' : 'black',
              transition: 'all 0.2s ease',
            }}
            title={month}
          >
            <input
              type="radio"
              name="month"
              value={monthNumber}
              checked={selectedMonth === monthNumber}
              onChange={() => onMonthChange(monthNumber)}
              style={{ display: 'none' }}
            />
            {isNarrow ? month[0] : month}
          </label>
        );
      })}
    </div>
  );
};

const HotspotsList = ({
  visibleHotspots,
  activeLayerId,
}: {
  visibleHotspots: PopularHotspot[];
  activeLayerId: RootLayerIDs;
}) => {
  const topHotspots = visibleHotspots
    .sort((a, b) =>
      activeLayerId === RootLayerIDs.LikelyCommonSpecies
        ? (b.likely_common_and_uncommon_species_count || 0) -
          (a.likely_common_and_uncommon_species_count || 0)
        : b.avg_weekly_checklists - a.avg_weekly_checklists
    )
    .slice(0, 20);

  if (topHotspots.length === 0) {
    return null;
  }

  const isLikelySpeciesLayer =
    activeLayerId === RootLayerIDs.LikelyCommonSpecies;

  return (
    <div className="right-species-bar">
      <h3>
        {isLikelySpeciesLayer ? 'Top Species Diversity' : 'Top Hotspots'} (
        {topHotspots.length})
      </h3>
      <div className="checkbox-scroll-list">
        {topHotspots.map((hotspot, index) => (
          <div
            key={hotspot.locality_id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: '4px 0',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span
              style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '25px' }}
            >
              #{index + 1}
            </span>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                {hotspot.locality_name}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {isLikelySpeciesLayer
                  ? `${hotspot.likely_common_and_uncommon_species_count || 0} likely species (±${(hotspot.likely_common_species_std_error || 0).toFixed(1)})`
                  : `${Math.round(hotspot.avg_weekly_checklists)} weekly checklists`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
  const mapRef = useRef<Map | undefined>(undefined);
  const mapContainerRef = useRef<HTMLElement>(null);

  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [debouncedCenter] = useDebounce(center, 500);
  const [debouncedZoom] = useDebounce(zoom, 500);

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
  const [homeLocation, setHomeLocation] = useState<HomeLocationInfo | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [visibleHotspots, setVisibleHotspots] = useState<PopularHotspot[]>([]);
  const [debouncedVisibleHotspots] = useDebounce(visibleHotspots, 50);

  useEffect(() => {
    if (fileId === '') return;

    // Set Mapbox token - in Docusaurus, we'll use a direct assignment for now
    mapboxgl.accessToken =
      'pk.eyJ1IjoiZGF2aWR0bWVhZG93cyIsImEiOiJjbTF0djNteTgwNzYzMnFvbGJrdjU3YzMzIn0.3sZJbLI9SKeK4Zs2ZFsuaA';

    if (!homeLocation) {
      console.warn('No home location set, using default initial center');
    } else {
      console.debug(
        `Using home location: ${homeLocation.location_name} (${homeLocation.checklist_count} checklists)`
      );
    }
    const initialCenter = homeLocation
      ? { lng: homeLocation.longitude, lat: homeLocation.latitude }
      : INITIAL_CENTER;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: initialCenter,
      zoom: INITIAL_ZOOM,
    });

    // Add location search control
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for a location',
      marker: false,
    });
    mapRef.current.addControl(geocoder, 'bottom-left');

    mapRef.current!.on('load', () => {
      fetchLifers(initialCenter.lat, initialCenter.lng, fileId).then((data) => {
        const lifersFeatures = lifersToGeoJson(data);
        addSourceAndLayer(
          mapRef.current!,
          RootLayerIDs.HistoricalLifers,
          lifersFeatures,
          activeLayerId === RootLayerIDs.HistoricalLifers ? 'visible' : 'none'
        );
      });

      fetchRegionalAndNearbyLifers(
        initialCenter.lat,
        initialCenter.lng,
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

      // Calculate dynamic radius based on zoom level and fetch popular hotspots
      const currentZoom = mapRef.current!.getZoom();
      const radiusKm = Math.max(
        10,
        Math.min(1000, 200 / Math.pow(2, currentZoom - 8))
      );
      fetchPopularHotspots(
        initialCenter.lat,
        initialCenter.lng,
        radiusKm,
        selectedMonth
      ).then((data) => {
        if (!data) return;
        addSourceAndLayer(
          mapRef.current!,
          RootLayerIDs.PopularHotspots,
          hotspotsToGeoJson(data),
          activeLayerId === RootLayerIDs.PopularHotspots ? 'visible' : 'none'
        );

        // Also add the likely common species layer using the same data
        addSourceAndLayer(
          mapRef.current!,
          RootLayerIDs.LikelyCommonSpecies,
          hotspotsToGeoJson(data),
          activeLayerId === RootLayerIDs.LikelyCommonSpecies
            ? 'visible'
            : 'none'
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
  }, [fileId, homeLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    // const timeOfLastRender = performance.now();
    const markers: { [key: string]: Marker } = {};
    const markersOnScreen: { [key: string]: { [key: string]: Marker } } = {};

    const updateVisibleSpecies = () => {
      // Only update visible species for NewLifers layer
      if (activeLayerId !== RootLayerIDs.NewLifers) return;

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

    const updateVisibleHotspots = () => {
      // Update visible hotspots for both PopularHotspots and LikelyCommonSpecies layers
      if (
        activeLayerId !== RootLayerIDs.PopularHotspots &&
        activeLayerId !== RootLayerIDs.LikelyCommonSpecies
      )
        return;

      const source = mapRef.current?.getSource(activeLayerId) as GeoJSONSource;
      if (!source) return;

      const renderedFeatures =
        mapRef.current!.querySourceFeatures(activeLayerId);

      const hotspotMap: { [key: string]: PopularHotspot } = {};
      renderedFeatures?.forEach((feature) => {
        if (!feature.properties) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coords = (feature.geometry as any)?.coordinates;
        const locationId = feature.properties.location_id || '';

        // Skip if we already have this hotspot (deduplicate)
        if (hotspotMap[locationId]) return;

        const hotspot: PopularHotspot = {
          locality_id: locationId,
          locality_name: feature.properties.title || 'Unknown Hotspot',
          latitude: coords?.[1] || 0,
          longitude: coords?.[0] || 0,
          avg_weekly_checklists:
            feature.properties.avg_weekly_checklists ||
            feature.properties.checklist_count ||
            0,
          likely_common_and_uncommon_species_count:
            feature.properties.likely_common_and_uncommon_species_count || 0,
          likely_common_species_std_error:
            feature.properties.likely_common_species_std_error || 0,
        };

        hotspotMap[locationId] = hotspot;
      });

      setVisibleHotspots(Object.values(hotspotMap));
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

      // Handle clustered lifers markers
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

        if (!markersOnScreen[activeLayerId]?.[id])
          marker.addTo(mapRef.current!);
      }

      // for every marker we've added previously, remove those that are no longer visible
      if (markersOnScreen[activeLayerId]) {
        for (const id in markersOnScreen[activeLayerId]) {
          if (!newMarkers[id]) {
            markersOnScreen[activeLayerId][id].remove();
          }
        }
      }

      markersOnScreen[activeLayerId] = newMarkers;
    };

    // after the GeoJSON data is loaded, update markers on the screen on every frame
    mapRef.current!.on('render', () => {
      if (!mapRef.current!.isSourceLoaded(activeLayerId)) return;
      updateVisibleSpecies();
      updateVisibleHotspots();
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

  // Effect to update hotspots when map moves or zooms
  useEffect(() => {
    if (!mapLoaded) return;
    if (
      activeLayerId !== RootLayerIDs.PopularHotspots &&
      activeLayerId !== RootLayerIDs.LikelyCommonSpecies
    )
      return;
    if (!fileId) return;

    setShowLoading(true);
    // Calculate dynamic radius based on debounced zoom level
    const radiusKm = Math.max(
      10,
      Math.min(1000, 200 / Math.pow(2, debouncedZoom - 8))
    );

    fetchPopularHotspots(
      debouncedCenter.lat,
      debouncedCenter.lng,
      radiusKm,
      selectedMonth
    )
      .then((data) => {
        if (!data) return;

        // Update popular hotspots source
        const hotspotsSource = mapRef.current!.getSource(
          RootLayerIDs.PopularHotspots
        ) as GeoJSONSource | undefined;
        if (hotspotsSource) {
          hotspotsSource.setData({
            type: 'FeatureCollection',
            features: hotspotsToGeoJson(data),
          });
        }

        // Update likely common species source (uses same data)
        const likelySpeciesSource = mapRef.current!.getSource(
          RootLayerIDs.LikelyCommonSpecies
        ) as GeoJSONSource | undefined;
        if (likelySpeciesSource) {
          likelySpeciesSource.setData({
            type: 'FeatureCollection',
            features: hotspotsToGeoJson(data),
          });
        }
      })
      .finally(() => {
        setShowLoading(false);
      });
  }, [
    debouncedCenter.lat,
    debouncedCenter.lng,
    debouncedZoom,
    mapLoaded,
    fileId,
    activeLayerId,
    selectedMonth,
  ]);

  const handleClick = useCallback((e: { target: { id: string } }) => {
    setActiveLayerId(e.target.id as RootLayerIDs);
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current!.flyTo({
            center: [longitude, latitude],
            zoom: 12,
            essential: true,
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
          // eslint-disable-next-line no-undef
          alert(
            'Unable to get your current location. Please make sure location permissions are enabled.'
          );
        }
      );
    } else {
      // eslint-disable-next-line no-undef
      alert('Geolocation is not supported by this browser.');
    }
  }, []);

  const flyToHomeLocation = useCallback(() => {
    if (homeLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [homeLocation.longitude, homeLocation.latitude],
        zoom: 12,
        essential: true,
      });
    }
  }, [homeLocation]);

  const handleUploadComplete = useCallback(
    (fileId: string, homeLocationData?: HomeLocationInfo) => {
      setFileId(fileId);
      setShowUploadModal(false);
      if (homeLocationData) {
        setHomeLocation(homeLocationData);
      }
    },
    []
  );

  return (
    <div className="root-container">
      <WaitAndUploadModal
        showModal={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
        }}
        onUploadComplete={handleUploadComplete}
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
          label="Show potential new lifers"
          tooltip="You need to be fairly zoomed in for these to display properly."
          checked={activeLayerId === RootLayerIDs.NewLifers}
          onClick={handleClick}
        />
        <LayerToggle
          id={RootLayerIDs.PopularHotspots}
          label="Show popular hotspots"
          checked={activeLayerId === RootLayerIDs.PopularHotspots}
          onClick={handleClick}
        />
        <LayerToggle
          id={RootLayerIDs.LikelyCommonSpecies}
          label="Show likely common species diversity"
          checked={activeLayerId === RootLayerIDs.LikelyCommonSpecies}
          onClick={handleClick}
        />
        {(activeLayerId === RootLayerIDs.PopularHotspots ||
          activeLayerId === RootLayerIDs.LikelyCommonSpecies) && (
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}
        <button onClick={() => setShowUploadModal(true)}>Change CSV</button>
        {homeLocation && (
          <button
            onClick={flyToHomeLocation}
            title={`Home location: ${homeLocation.location_name} (${homeLocation.checklist_count} checklists) - Your home location is calculated as the hotspot where you've submitted the most checklists`}
          >
            🏠 Home
          </button>
        )}
        <button onClick={getCurrentLocation} title="Go to current location">
          📍 Current Location
        </button>
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
      {(activeLayerId === RootLayerIDs.PopularHotspots ||
        activeLayerId === RootLayerIDs.LikelyCommonSpecies) && (
        <HotspotsList
          visibleHotspots={debouncedVisibleHotspots}
          activeLayerId={activeLayerId}
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
