import Papa from 'papaparse';
import { parse } from 'date-fns';
import { Taxonomy } from './taxonomy/parse';
import { fetchTaxonomyForSpecies } from './taxonomy/fetch';

export interface Observation {
  submissionId: string;
  commonName: string;
  scientificName: string;
  taxonomicOrder: number;
  count: number | 'X'; // Can be 'X' or a number
  stateProvince: string;
  county: string;
  locationId: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string; // ISO format recommended
  time: string; // Time in "hh:mm AM/PM" format
  dateTime: Date; // Parsed date and time
  protocol: string;
  durationMinutes?: number;
  allObsReported: boolean; // 1 for true, 0 for false
  distanceTraveledKm?: number;
  areaCoveredHa?: number;
  numberOfObservers: number;
  breedingCode?: string;
  observationDetails?: string;
  checklistComments?: string;
  mlCatalogNumbers?: string;
  taxonomy: Taxonomy;
}

// Submission ID,Common Name,Scientific Name,Taxonomic Order,Count,State/Province,County,Location ID,Location,Latitude,Longitude,Date,Time,Protocol,Duration (Min),All Obs Reported,Distance Traveled (km),Area Covered (ha),Number of Observers,Breeding Code,Observation Details,Checklist Comments,ML Catalog Numbers
const expectedHeaders = [
  'Submission ID',
  'Common Name',
  'Scientific Name',
  'Taxonomic Order',
  'Count',
  'State/Province',
  'County',
  'Location ID',
  'Location',
  'Latitude',
  'Longitude',
  'Date',
  'Time',
  'Protocol',
  'Duration (Min)',
  'All Obs Reported',
  'Distance Traveled (km)',
  'Area Covered (ha)',
  'Number of Observers',
  'Breeding Code',
  'Observation Details',
  'Checklist Comments',
  'ML Catalog Numbers',
];

export async function parseObservations(
  fileContents: string
): Promise<Observation[]> {
  return new Promise((resolve, reject) => {
    if (!fileContents) {
      return [];
    }

    const lines = fileContents.split('\n');
    const headers = lines[0].split(',');
    if (!expectedHeaders.every((header, i) => header === headers[i])) {
      throw new Error('Invalid headers in CSV');
    }

    const observations: Observation[] = [];

    const parsed = Papa.parse(fileContents, {
      delimiter: ',',
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      reject(parsed.errors);
    }

    for (const record of parsed.data as string[][]) {
      // ignore header
      if (record[0] === 'Submission ID') {
        continue;
      }
      let time = record[12];
      if (time === '') {
        // ebird casual observations frequently come in with no time
        time = '12:00 PM';
      }
      const dateTime = parse(
        `${record[11]} ${time}`,
        'yyyy-MM-dd hh:mm a',
        new Date()
      );
      if (isNaN(dateTime.getTime())) {
        console.warn(`Invalid date/time: ${record[11]} ${record[12]}`);
        continue;
      }

      const taxonomy = fetchTaxonomyForSpecies(record[2]);

      observations.push({
        submissionId: record[0],
        commonName: record[1],
        scientificName: record[2],
        taxonomicOrder: parseInt(record[3], 10),
        count: record[4] === 'X' ? 'X' : parseInt(record[4], 10),
        stateProvince: record[5],
        county: record[6],
        locationId: record[7],
        location: record[8],
        latitude: parseFloat(record[9]),
        longitude: parseFloat(record[10]),
        date: record[11],
        time: record[12],
        dateTime: dateTime,
        protocol: record[13],
        durationMinutes: parseInt(record[14], 10),
        allObsReported: record[15] === '1',
        distanceTraveledKm: record[16] ? parseFloat(record[16]) : undefined,
        areaCoveredHa: record[17] ? parseFloat(record[17]) : undefined,
        numberOfObservers: parseInt(record[18], 10),
        breedingCode: record[19],
        observationDetails: record[20],
        checklistComments: record[21],
        mlCatalogNumbers: record[22],
        taxonomy,
      });
    }

    // finally sort by date
    observations.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    resolve(observations);
  });
}
