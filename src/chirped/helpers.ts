import { ErrorInfo } from "react";
import { ChirpedContextType } from "./contexts/Chirped";

export function makeNewChirpedContext(): ChirpedContextType {
  return {
    allObservations: [],
    yearObservations: [],
    lifeList: [],
    rankings: {
      mostObservedByChecklistFrequency: [],
      mostObservedByTotalCount: [],
      topHotspotsByChecklists: [],
      topHotspotsByTimeSpent: [],
    },
    yearStats: {
      species: 0,
      checklists: 0,
      newLifersCount: 0,
      totalTimeSpentMinutes: 0,
      totalDistanceKm: 0,
      totalBirdsCounted: 0,
      numberOfSpuhs: 0,
      checklistsByType: {
        incidental: 0,
        stationary: 0,
        traveling: 0,
      },
      families: 0,
      genera: 0,
      numberOfHotspots: 0,
    },
  };
}

export const onError = (error: Error, info: ErrorInfo) => {
  console.error(error, info);
};
