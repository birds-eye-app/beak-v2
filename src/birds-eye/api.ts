import { Feature, GeoJsonProperties, Geometry } from "geojson";
// For now, use hardcoded values since process.env is not available in Docusaurus browser environment
const viteBaseURL = 'http://localhost:8000/';

// hard code route to render backend... probably just wanna move this over to vercel or 
// fix render site hosting at some point
const isDevelopment = false; // Set to true for local development
const apiBaseUrl = isDevelopment ? viteBaseURL : 'https://cloaca.onrender.com/'

export type Lifer = {
  common_name: string;
  latitude: number;
  longitude: number;
  date: string;
  taxonomic_order: number;
  location: string;
  location_id: string;
  species_code: string;
};

export type Species = {
  species_code: string;
  common_name: string;
  taxonomic_order: number;
};

type Location = {
  location_name: string;
  latitude: number;
  longitude: number;
  location_id: string;
};

export type LocationToLifers = {
  location: Location;
  lifers: Lifer[];
};

export type LocationByLiferResponse = {
  [key: string]: LocationToLifers;
};

export function lifersToGeoJson(response: LocationByLiferResponse) {
  return Object.values(response).map((l) => {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [l.location.longitude, l.location.latitude],
      },
      properties: {
        title: l.location.location_name,
        lifers: l.lifers,
        liferCount: l.lifers.length,
        speciesCodes: l.lifers.map((lifer) => lifer.species_code).join(","),
      },
    } as Feature<Geometry, GeoJsonProperties>;
  });
}

// for now at least turn the lifers list into the previously used LocationByLifeResponse

export function lifersListToLocation(lifersList: Lifer[]) {
  const locationByLiferResponse: LocationByLiferResponse = {};
  lifersList.forEach((lifer) => {
    const locationId = lifer.location_id;
    if (locationByLiferResponse[locationId]) {
      locationByLiferResponse[locationId].lifers.push(lifer);
    } else {
      locationByLiferResponse[locationId] = {
        location: {
          location_name: lifer.location,
          latitude: lifer.latitude,
          longitude: lifer.longitude,
          location_id: locationId,
        },
        lifers: [lifer],
      };
    }
  });

  return locationByLiferResponse;
}
export function nearbyObservationsToGeoJson(
  lifers: LocationByLiferResponse,
): Feature<Geometry, GeoJsonProperties>[] {
  if (!lifers) return [];
  return Object.values(lifers).flatMap((entry) => {
    const feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [entry.location.longitude, entry.location.latitude],
      },
      properties: {
        title: entry.location.location_name,
        lifers: entry.lifers,
        liferCount: entry.lifers.length,
        speciesCodes: entry.lifers.map((lifer) => lifer.species_code).join(","),
      },
    };

    return feature as Feature<Geometry, GeoJsonProperties>;
  });
}

export async function fetchRegionalAndNearbyLifers(
  latitude: number,
  longitude: number,
  fileId: string,
) {
  const regionalLifers = await fetchRegionalLifers(latitude, longitude, fileId);
  const nearbyObservations = await fetchNearbyObservations(
    latitude,
    longitude,
    fileId,
  );

  if (!regionalLifers || !nearbyObservations) {
    return;
  }

  console.debug(
    `[fetchRegionalAndNearbyLifers] regionalLifers: ${regionalLifers?.length}, nearbyObservations: ${Object.keys(nearbyObservations).length}`,
  );

  regionalLifers.forEach((lifer) => {
    const existingLocation = nearbyObservations[lifer.location_id];
    if (existingLocation) {
      // only add it if we don't already have it
      const existingObservation = existingLocation.lifers.find(
        // todo: maybe use a unique id?
        (l) => l.species_code === lifer.species_code && l.date === lifer.date,
      );
      if (!existingObservation) {
        existingLocation.lifers.push(lifer);
      }
    } else {
      nearbyObservations[lifer.location_id] = {
        location: {
          location_name: lifer.location,
          latitude: lifer.latitude,
          longitude: lifer.longitude,
          location_id: lifer.location_id,
        },
        lifers: [lifer],
      };
    }
  });

  return nearbyObservations;
}

// todo: dedupe all of this
export const uploadCsv = async (file: File) => {
  console.debug("Uploading file:", file);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}v1/upload_lifers_csv`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.debug("Upload response:", data);
  return data as { key: string };
};

export const checkHealthy = async () => {
  try {
    // sleep 2s
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await fetch(`${apiBaseUrl}v1/health`);
    return response.ok;
  } catch (error) {
    console.error("Health check error:", error);
    return false;
  }
};

export const fetchLifers = async (
  latitude: number,
  longitude: number,
  fileId: string,
) => {
  const baseUrl = `${apiBaseUrl}v1/lifers_by_location`;

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    file_id: fileId,
  });

  const url = `${baseUrl}?${params}`;

  try {
    const response = await fetch(url, {});
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const fetchNearbyObservations = async (
  latitude: number,
  longitude: number,
  fileId: string,
): Promise<LocationByLiferResponse | undefined> => {
  const baseUrl = `${apiBaseUrl}v1/nearby_observations`;

  // Create a URLSearchParams object to handle query parameters
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    file_id: fileId,
  });

  // Construct the full URL with query parameters
  const url = `${baseUrl}?${params}`;

  try {
    const response = await fetch(url, {});
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as LocationByLiferResponse;
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const fetchRegionalLifers = async (
  latitude: number,
  longitude: number,
  fileId: string,
): Promise<Lifer[] | undefined> => {
  const baseUrl = `${apiBaseUrl}v1/regional_new_potential_lifers`;

  // Create a URLSearchParams object to handle query parameters
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    file_id: fileId,
  });

  // Construct the full URL with query parameters
  const url = `${baseUrl}?${params}`;

  try {
    const response = await fetch(url, {});
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
