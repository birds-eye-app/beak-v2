import { describe, expect, test } from 'vitest';
import {
  performChirpedCalculations,
  shouldIncludeInSpeciesCounts,
  calculateLifeList,
} from '../../src/chirped/calculate';
import {
  Observation,
  parseObservations,
} from '../../src/chirped/parseEbirdExport';
import * as path from 'path';
import * as fs from 'fs';
import { ChirpedContextType } from '../../src/chirped/contexts/Chirped';
import Papa from 'papaparse';
import { fetchTaxonomyForSpecies } from '../../src/chirped/taxonomy/fetch';
import { parse } from 'date-fns';
import { CurrentYear } from '../../src/chirped/Chirped';

const exampleObservation: Observation = {
  submissionId: 'S162264673',
  commonName: 'Snow Goose',
  scientificName: 'Anser caerulescens',
  taxonomicOrder: 257,
  count: 5,
  stateProvince: 'US-NY',
  county: 'Queens',
  locationId: 'L109145',
  location: 'Jamaica Bay Wildlife Refuge--West Pond',
  latitude: 40.6188482,
  longitude: -73.8307995,
  date: '2024-02-19',
  time: '10:26 AM',
  dateTime: new Date('2024-02-19 10:26 AM'),
  protocol: 'eBird - Traveling Count',
  durationMinutes: 203,
  allObsReported: true,
  distanceTraveledKm: 5.057,
  areaCoveredHa: undefined,
  numberOfObservers: 2,
  mlCatalogNumbers: undefined,
  observationDetails: undefined,
  taxonomy: {
    bandingCodes: '',
    category: 'species',
    comNameCodes: 'SNGO',
    commonName: 'Snow Goose',
    extinct: false,
    extinctYear: undefined,
    familyCode: 'anatid1',
    familyComName: 'Ducks, Geese, and Swans',
    familySciName: 'Anatidae',
    order: 'Anseriformes',
    reportAs: '',
    sciNameCodes: 'ANCA',
    scientificName: 'Anser caerulescens',
    speciesCode: 'snogoo',
    taxonOrder: 257,
  },
};

describe('performChirpedCalculations', () => {
  describe('allObservations', async () => {
    const observations: Observation[] = [
      {
        ...exampleObservation,
        dateTime: new Date('2024-01-01T10:00:00Z'),
        date: '2024-01-01',
        scientificName: 'Species A',
      },
      {
        ...exampleObservation,
        dateTime: new Date('2024-02-01T10:00:00Z'),
        date: '2024-02-01',
        scientificName: 'Species B',
      },
      {
        ...exampleObservation,
        dateTime: new Date('2022-01-01T10:00:00Z'),
        date: '2022-01-01',
        scientificName: 'Species A',
      },
      {
        ...exampleObservation,
        dateTime: new Date('2024-03-01T10:00:00Z'),
        date: '2024-03-01',
        scientificName: 'Species C',
      },
    ];

    const currentYear = 2024;
    const result = await performChirpedCalculations(observations, currentYear);

    test('should contain all observations', async () => {
      expect(result.allObservations.length).toBe(4);
    });
    test('should sort observations by date', async () => {
      expect(result.allObservations[0].date).toBe('2022-01-01');
      expect(result.allObservations[3].date).toBe('2024-03-01');
    });
  });

  describe('yearObservations', async () => {
    const observations: Observation[] = [
      {
        ...exampleObservation,
        dateTime: new Date('2024-01-01T10:00:00Z'),
        date: '2024-01-01',
        scientificName: 'Species A',
      },
      {
        ...exampleObservation,
        dateTime: new Date('2024-02-01T10:00:00Z'),
        date: '2024-02-01',
        scientificName: 'Species B',
      },
      {
        ...exampleObservation,
        dateTime: new Date('2022-01-01T10:00:00Z'),
        date: '2022-01-01',
        scientificName: 'Species A',
      },
      {
        ...exampleObservation,
        dateTime: new Date('2024-03-01T10:00:00Z'),
        date: '2024-03-01',
        scientificName: 'Species C',
      },
    ];

    const currentYear = 2024;
    const result = await performChirpedCalculations(observations, currentYear);

    test('should only contain year observations', async () => {
      expect(result.yearObservations.length).toBe(3);
    });

    test('uses the current year argument', async () => {
      const result = await performChirpedCalculations(observations, 2022);
      expect(result.yearObservations.length).toBe(1);
    });
  });
  describe('lifers', async () => {
    const observations: Observation[] = [
      {
        ...exampleObservation,
        dateTime: new Date('2024-01-01T10:00:00Z'),
        date: '2024-01-01',
        scientificName: 'Anser caerulescens',
        taxonomy: {
          ...exampleObservation.taxonomy,
          scientificName: 'Anser caerulescens',
          speciesCode: 'snogoo',
        },
      },
      {
        ...exampleObservation,
        dateTime: new Date('2024-02-01T10:00:00Z'),
        date: '2024-02-01',
        scientificName: 'Red-necked Spurfowl',
        taxonomy: {
          ...exampleObservation.taxonomy,
          scientificName: 'Red-necked Spurfowl',
          speciesCode: 'renfra1',
        },
      },
      {
        ...exampleObservation,
        dateTime: new Date('2022-01-01T10:00:00Z'),
        date: '2022-01-01',
        scientificName: 'Anser caerulescens',
        taxonomy: {
          ...exampleObservation.taxonomy,
          scientificName: 'Anser caerulescens',
          speciesCode: 'snogoo',
        },
      },
      {
        ...exampleObservation,
        dateTime: new Date('2024-03-01T10:00:00Z'),
        date: '2024-03-01',
        scientificName: 'Yellow-necked Spurfowl',
        taxonomy: {
          ...exampleObservation.taxonomy,
          scientificName: 'Yellow-necked Spurfowl',
          speciesCode: 'yenspu1',
        },
      },
    ];

    const currentYear = 2024;
    const result = await performChirpedCalculations(observations, currentYear);

    test('should only contain lifers', async () => {
      expect(result.lifeList.length).toBe(3);
    });

    test('should only contain the first observation of a species', async () => {
      const result = await performChirpedCalculations(observations, 2024);
      const snowGeese = result.lifeList.filter(
        (obs) => obs.scientificName === 'Anser caerulescens'
      );

      expect(snowGeese.length).toBe(1);
      expect(snowGeese[0].date).toBe('2022-01-01');
    });

    test('works with my life list', async () => {
      const csvFilePath = path.join(__dirname, 'MyEBirdData.csv');
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const actual = await parseObservations(csvData);
      const currentYear = 2024;

      const result = await performChirpedCalculations(actual, currentYear);

      expect(result.lifeList.length).toBe(601);
    });
  });

  describe('yearStats', async () => {
    test('should stats', async () => {
      const observations: Observation[] = [
        {
          ...exampleObservation,
          submissionId: 'S1',
          dateTime: new Date('2024-01-01T10:00:00Z'),
          date: '2024-01-01',
          scientificName: 'Species A',
          durationMinutes: 10,
          distanceTraveledKm: 1,
          taxonomy: {
            ...exampleObservation.taxonomy,
            speciesCode: 'speciesa',
          },
        },
        {
          ...exampleObservation,
          submissionId: 'S2',
          dateTime: new Date('2024-02-01T10:00:00Z'),
          date: '2024-02-01',
          scientificName: 'Species B',
          durationMinutes: 20,
          distanceTraveledKm: 2,
          taxonomy: {
            ...exampleObservation.taxonomy,
            speciesCode: 'speciesb',
          },
        },
        {
          ...exampleObservation,
          submissionId: 'S3',
          dateTime: new Date('2024-03-01T10:00:00Z'),
          date: '2024-03-01',
          scientificName: 'Species C',
          durationMinutes: 30,
          distanceTraveledKm: 3,
          taxonomy: {
            ...exampleObservation.taxonomy,
            speciesCode: 'speciesc',
          },
        },
        {
          ...exampleObservation,
          submissionId: 'S3',
          dateTime: new Date('2024-03-01T10:00:00Z'),
          date: '2024-03-01',
          scientificName: 'Species D',
          durationMinutes: 30,
          distanceTraveledKm: 3,
          taxonomy: {
            ...exampleObservation.taxonomy,
            speciesCode: 'speciesd',
          },
        },
      ];

      const currentYear = 2024;
      const result = await performChirpedCalculations(
        observations,
        currentYear
      );
      const expectedStats: ChirpedContextType['yearStats'] = {
        species: 4,
        checklists: 3,
        newLifersCount: 4,
        totalTimeSpentMinutes: 60,
        totalDistanceKm: 6,
        totalBirdsCounted: 20,
        numberOfSpuhs: 0,
        checklistsByType: {
          incidental: 0,
          stationary: 0,
          traveling: 3,
        },
        families: 1,
        genera: 1,
        numberOfHotspots: 1,
      };

      expect(result.yearStats).toEqual(expectedStats);
    });

    test('with my own data', async () => {
      const csvFilePath = path.join(__dirname, 'MyEBirdData.csv');
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const actual = await parseObservations(csvData);
      const currentYear = 2024;

      const result = await performChirpedCalculations(actual, currentYear);

      const expectedStats: ChirpedContextType['yearStats'] = {
        checklists: 365,
        checklistsByType: {
          incidental: 48,
          stationary: 26,
          traveling: 291,
        },
        newLifersCount: 455,
        numberOfSpuhs: 23,
        species: 591,
        totalBirdsCounted: 34120,
        totalDistanceKm: 672.567,
        totalTimeSpentMinutes: 23286,
        families: 78,
        genera: 353,
        numberOfHotspots: 201,
      };

      expect(result.yearStats).toEqual(expectedStats);
    });
  });
});

describe('shouldIncludeInSpeciesCounts', () => {
  test('filters based on common names', async () => {
    const commonNameTests = ['gull sp.', 'Graylag x Swan Goose (hybrid)'];

    for (const commonName of commonNameTests) {
      const observation: Observation = {
        ...exampleObservation,
        commonName,
      };
      expect(shouldIncludeInSpeciesCounts(observation)).toBe(false);
    }
  });
  test('filters based on scientific names', async () => {
    const commonNameTests = ['gull sp.', 'Graylag x Swan Goose (hybrid)'];

    for (const commonName of commonNameTests) {
      const observation: Observation = {
        ...exampleObservation,
        commonName,
      };
      expect(shouldIncludeInSpeciesCounts(observation)).toBe(false);
    }
  });
});

type EbirdlifeList = {
  rowNumber: number;
  taxonOrder: number;
  category: string;
  commonName: string;
  scientificName: string;
  count: number;
  location: string;
  stateProvince: string;
  date: string;
  locationId: string;
  subId: string;
  exotic: string;
  countable: boolean;
};

// check https://ebird.org/lifelist against the output of this
function parseEbirdLifeList() {
  const csvFilePath = path.join(__dirname, 'ebird_world_life_list.csv');
  const csvData = fs.readFileSync(csvFilePath, 'utf8');

  const parsed = Papa.parse(csvData, {
    delimiter: ',',
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error('Error parsing taxonomy file' + parsed.errors);
  }

  const expectedHeaders = [
    'Row #',
    'Taxon Order',
    'Category',
    'Common Name',
    'Scientific Name',
    'Count',
    'Location',
    'S/P',
    'Date',
    'LocID',
    'SubID',
    'Exotic',
    'Countable',
  ];

  const results: EbirdlifeList[] = [];
  (parsed.data as string[][]).forEach((record: string[], index) => {
    if (index === 0) {
      if (!expectedHeaders.every((header, i) => header === record[i])) {
        throw new Error('Invalid headers in CSV');
      }

      return;
    }

    const [
      rowNumber,
      taxonOrder,
      category,
      commonName,
      scientificName,
      count,
      location,
      stateProvince,
      date,
      locationId,
      subId,
      exotic,
      countable,
    ] = record;

    const isCountable = countable === '1';

    if (!isCountable) {
      return;
    }

    // need to convert 29 Aug 2024 to 2024-08-29
    const parsedDate = parse(date, 'dd MMM yyyy', new Date());

    results.push({
      rowNumber: parseInt(rowNumber, 10),
      taxonOrder: parseInt(taxonOrder, 10),
      category,
      commonName,
      scientificName,
      count: parseInt(count, 10),
      location,
      stateProvince,
      date: parsedDate.toISOString().split('T')[0],
      locationId,
      subId,
      exotic,
      countable: isCountable,
    });
  });

  return results.sort((a, b) => {
    return a.date.localeCompare(b.date);
  });
}

describe('calculateLifeList', () => {
  async function calculateMyLifeList() {
    const csvFilePath = path.join(__dirname, 'MyEBirdData.csv');
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const actual = await parseObservations(csvData);

    return calculateLifeList(actual, CurrentYear);
  }
  test('should work with my data', async () => {
    const result = await calculateMyLifeList();

    // make sure it includes the damn pigeon
    expect(result['rocpig']).toBeDefined();

    expect(Object.entries(result).length).toBe(601);
  });

  test('it matches the ebird life list', async () => {
    const myResult = await calculateMyLifeList();

    const ebirdLifeList = parseEbirdLifeList();

    // first test the sets of species code

    // transform each into a comparable object with keys for the code
    // and values for the date
    const myResultMapping: Record<string, string> = {};
    Object.entries(myResult).forEach(([key, value]) => {
      myResultMapping[key] = value.date;
    });

    const ebirdLifeListMapping: Record<string, string> = {};
    ebirdLifeList.forEach((record) => {
      ebirdLifeListMapping[
        fetchTaxonomyForSpecies(record.scientificName).speciesCode
      ] = record.date;
    });

    // expect(myResultMapping).toEqual(ebirdLifeListMapping);

    const myResultKeys = new Set(Object.keys(myResultMapping));
    const ebirdLifeListKeys = new Set(Object.keys(ebirdLifeListMapping));
    expect(myResultKeys).toEqual(ebirdLifeListKeys);

    // expect(Object.entries(myResult).length).toBe(ebirdLifeList.length);
  });
});
