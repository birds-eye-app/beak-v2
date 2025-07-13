import { ChirpedContextType } from './contexts/Chirped';
import { makeNewChirpedContext } from './helpers';
import { Observation } from './parseEbirdExport';

function isSpuh(observation: Observation) {
  return observation.commonName.includes('sp.');
}

export function shouldIncludeInSpeciesCounts(observation: Observation) {
  // common name filters
  // we won't include:
  // - spuhs: `gull sp.` or `sparrow sp.`
  // - hybrids: `Mallard x American Black Duck`
  if (isSpuh(observation) || observation.commonName.includes('(hybrid)')) {
    return false;
  }

  // scientific name filters
  // exclude:
  // - groupings (genus species [something group])
  // - subspecies (genus species subspecies)
  // - slashes (Empidonax alnorum/traillii)
  if (
    observation.scientificName.includes('[') ||
    observation.scientificName.includes('/') ||
    observation.scientificName.trim().split(' ').length > 2
  ) {
    return false;
  }

  return true;
}

export function shouldIncludeObservationForYear(
  observation: Observation,
  currentYear: number
) {
  return observation.dateTime.getFullYear() === currentYear;
}

// this is a mapping of the species code to the observation
export type LifeList = Record<string, Observation>;
const categoriesToIncludeInLifeList = ['species', 'issf'];

const feralRockPigeon = 'Columba livia (Feral Pigeon)';

// to calculate the life list, we need to go through each
// observation and see if we've already seen it before
// this gets a little nuanced when it comes to things like subspecies
export function calculateLifeList(
  observations: Observation[],
  currentYear: number
): LifeList {
  const lifeList: LifeList = {};

  for (const observation of observations) {
    // don't include anything in the life list after this year (since we're running this in currentYear +1)
    if (observation.dateTime.getFullYear() > currentYear) {
      continue;
    }
    if (
      !categoriesToIncludeInLifeList.includes(observation.taxonomy.category) &&
      observation.taxonomy.scientificName !== feralRockPigeon
    ) {
      continue;
    }
    const key =
      observation.taxonomy.reportAs || observation.taxonomy.speciesCode;

    if (lifeList[key]) {
      continue;
    }

    lifeList[key] = observation;
  }
  return lifeList;
}

export type SpeciesStats = {
  species: string;
  totalObservations: number;
  totalCounts: number;
};

export type SpeciesStatsMap = Map<string, SpeciesStats>;
export type SpeciesStatsRanking = SpeciesStats[];

export type HotSpotStats = {
  locationID: string;
  locationName: string;
  checklistCount: number;
  timeSpentMinutes: number;
};
export type HotSpotStatsRanking = HotSpotStats[];

export async function performChirpedCalculations(
  allObservations: Observation[],
  currentYear: number
): Promise<ChirpedContextType> {
  const chirpedObservations = makeNewChirpedContext();

  const sortedObservations = allObservations.sort(
    (a, b) => a.dateTime.getTime() - b.dateTime.getTime()
  );

  const speciesForYear = new Set<string>();
  const checklistsForYear = new Set<string>();
  const speciesStats = new Map<string, SpeciesStats>();
  const locationStatsMapping = new Map<string, HotSpotStats>();

  for (const observation of sortedObservations) {
    chirpedObservations.allObservations.push(observation);

    if (!shouldIncludeObservationForYear(observation, currentYear)) {
      continue;
    }

    if (isSpuh(observation)) {
      chirpedObservations.yearStats.numberOfSpuhs += 1;
    }

    if (typeof observation.count === 'number' && !isNaN(observation.count)) {
      chirpedObservations.yearStats.totalBirdsCounted += observation.count;
    }

    if (!checklistsForYear.has(observation.submissionId)) {
      chirpedObservations.yearStats.checklists += 1;
      const stats = locationStatsMapping.get(observation.locationId);
      if (stats) {
        stats.checklistCount += 1;
        stats.timeSpentMinutes += observation.durationMinutes || 0;
      } else {
        locationStatsMapping.set(observation.locationId, {
          locationID: observation.locationId,
          locationName: observation.location,
          checklistCount: 1,
          timeSpentMinutes: observation.durationMinutes || 0,
        });
      }

      switch (observation.protocol) {
        case 'eBird - Casual Observation':
          chirpedObservations.yearStats.checklistsByType.incidental += 1;
          break;
        case 'eBird - Stationary Count':
          chirpedObservations.yearStats.checklistsByType.stationary += 1;
          break;
        case 'eBird - Traveling Count':
          chirpedObservations.yearStats.checklistsByType.traveling += 1;
          break;
      }

      if (observation.durationMinutes && !isNaN(observation.durationMinutes)) {
        chirpedObservations.yearStats.totalTimeSpentMinutes +=
          observation.durationMinutes;
      }
      if (
        observation.distanceTraveledKm &&
        !isNaN(observation.distanceTraveledKm)
      ) {
        chirpedObservations.yearStats.totalDistanceKm +=
          observation.distanceTraveledKm;
      }
      checklistsForYear.add(observation.submissionId);
    }

    if (!shouldIncludeInSpeciesCounts(observation)) {
      continue;
    }
    chirpedObservations.yearObservations.push(observation);
    if (!speciesForYear.has(observation.scientificName)) {
      chirpedObservations.yearStats.species += 1;
      speciesForYear.add(observation.scientificName);
    }

    // species stats
    const speciesStatsForSpecies = speciesStats.get(observation.commonName);
    const count = observation.count === 'X' ? 0 : observation.count || 0;
    if (speciesStatsForSpecies) {
      speciesStatsForSpecies.totalObservations += 1;
      speciesStatsForSpecies.totalCounts += count;
    } else {
      speciesStats.set(observation.commonName, {
        species: observation.commonName,
        totalObservations: 1,
        totalCounts: count,
      });
    }
  }

  const lifeList = calculateLifeList(allObservations, currentYear);
  chirpedObservations.lifeList = Object.values(lifeList);

  // figure out which new lifers occurred this year
  Object.values(lifeList).forEach((observation) => {
    if (shouldIncludeObservationForYear(observation, currentYear)) {
      chirpedObservations.yearStats.newLifersCount += 1;
    }
  });

  // find most observed species
  const speciesStatsArray = Array.from(speciesStats.entries());
  speciesStatsArray.sort(
    (a, b) => b[1].totalObservations - a[1].totalObservations
  );
  // set the top 5 most observed species
  chirpedObservations.rankings.mostObservedByChecklistFrequency =
    speciesStatsArray.map(([, stats]) => stats);

  // find most observed species by total count
  speciesStatsArray.sort((a, b) => b[1].totalCounts - a[1].totalCounts);
  // set the top 5 most observed species
  chirpedObservations.rankings.mostObservedByTotalCount = speciesStatsArray.map(
    ([, stats]) => stats
  );

  // find top hotspots by checklist count
  const locationCountArray = Array.from(locationStatsMapping.entries());
  locationCountArray.sort((a, b) => b[1].checklistCount - a[1].checklistCount);
  chirpedObservations.rankings.topHotspotsByChecklists = locationCountArray.map(
    ([, stats]) => stats
  );
  // find top hotspots by time spent
  locationCountArray.sort(
    (a, b) => b[1].timeSpentMinutes - a[1].timeSpentMinutes
  );
  chirpedObservations.rankings.topHotspotsByTimeSpent = locationCountArray.map(
    ([, stats]) => stats
  );

  // calculate number of families and genera
  const families = new Set<string>();
  const genera = new Set<string>();
  chirpedObservations.yearObservations.forEach((observation) => {
    families.add(observation.taxonomy.familyCode);
    const genus = observation.taxonomy.scientificName.trim().split(' ')[0];
    genera.add(genus);
  });

  chirpedObservations.yearStats.families = families.size;
  chirpedObservations.yearStats.genera = genera.size;

  chirpedObservations.yearStats.numberOfHotspots = locationCountArray.length;

  return chirpedObservations;
}
