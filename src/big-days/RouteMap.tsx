import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Checklist } from './api';
import { formatTime } from './format';
import { useMapboxToken } from '../mapboxToken';

type Props = {
  checklists: Checklist[];
  dark: boolean;
  height?: number;
};

/**
 * The day's route: every checklist with coordinates as a numbered stop, in start-time order,
 * joined by a line. Stops are the checklist's locality coordinates (a hotspot's pin or the
 * personal location), so a traveling count shows as a dot at its start, not a track.
 */
export function RouteMap({ checklists, dark, height = 320 }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const token = useMapboxToken();

  useEffect(() => {
    if (!container.current) return;
    const stops = checklists.filter((c) => c.lat != null && c.lon != null);
    if (stops.length === 0 || !token) return;

    mapboxgl.accessToken = token;
    let map: Map;
    try {
      // No WebGL (old hardware, hardened browsers, headless) throws here; the checklist
      // list beside the map is the content, so degrade to a note rather than crash the page.
      map = new mapboxgl.Map({
        container: container.current,
        style: dark
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/outdoors-v12',
        center: [stops[0].lon as number, stops[0].lat as number],
        zoom: 10,
        attributionControl: true,
        cooperativeGestures: true,
      });
    } catch (e) {
      console.warn('Big Days route map unavailable:', e);
      setUnsupported(true);
      return;
    }
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      const coords = stops.map((c) => [c.lon as number, c.lat as number]);
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': dark ? '#81c784' : '#2e7d32',
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [1.5, 1.5],
        },
      });
      stops.forEach((c, i) => {
        const el = document.createElement('div');
        el.className = 'big-days-stop';
        el.textContent = String(i + 1);
        const popup = new mapboxgl.Popup({
          offset: 16,
          closeButton: false,
        }).setHTML(
          `<strong>${escapeHtml(c.locality)}</strong><br/>` +
            `${c.time ? formatTime(c.time) + ' · ' : ''}${c.n_species} species`
        );
        new mapboxgl.Marker({ element: el })
          .setLngLat([c.lon as number, c.lat as number])
          .setPopup(popup)
          .addTo(map);
      });
      if (coords.length > 1) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new mapboxgl.LngLatBounds(
            coords[0] as [number, number],
            coords[0] as [number, number]
          )
        );
        map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [checklists, dark, token]);

  const withCoords = checklists.filter((c) => c.lat != null && c.lon != null);
  if (withCoords.length === 0 || unsupported || !token) {
    return (
      <div className="big-days-map-empty">
        {!token
          ? 'Map unavailable in this build.'
          : unsupported
            ? 'The route map needs WebGL, which this browser has turned off.'
            : 'No coordinates on these checklists.'}
      </div>
    );
  }
  return (
    <div
      ref={container}
      className="big-days-map"
      style={{ height }}
      aria-label="Map of the day's checklists"
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
