import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * The Mapbox public token, baked in at build time from MAPBOX_TOKEN (see docusaurus.config.ts).
 * Empty when the build had no token: maps then render a note instead of throwing.
 */
export function useMapboxToken(): string {
  const { siteConfig } = useDocusaurusContext();
  const token = siteConfig.customFields?.mapboxToken;
  return typeof token === 'string' ? token : '';
}
