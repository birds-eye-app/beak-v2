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

    const lines = fileContents.split(/\r\n|\r|\n/);
    const headers = lines[0].split(',');
    if (!expectedHeaders.every((header, i) => header === headers[i])) {
      const mismatched = expectedHeaders.flatMap((header, i) =>
        header !== headers[i] ? [header, headers[i]] : []
      );
      console.error(`Invalid eBird export. Expected headers do not match.`, {
        expected: expectedHeaders,
        received: headers,
        mismatched: mismatched,
      });
      throw new Error(`Invalid eBird export. Expected headers do not match.`);
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
      // Parse the date/time string as UTC to ensure consistent behavior
      // across different timezones (local development vs CI)
      // the default is something like: 2025-11-20	10:00 PM
      // certain exports (eg Leo's) look like: 11-29-25 07:40 AM or 12-04-25 04:00:00 PM
      const formats = [
        'yyyy-MM-dd HH:mm',
        'yyyy-MM-dd hh:mm a',
        'MM-dd-yy hh:mm a',
        'MM-dd-yy hh:mm:ss a',
      ];

      let localDate: Date | null = null;
      for (const format of formats) {
        const parsedDate = parse(
          `${record[11]} ${time}`,
          format,
          new Date('2000-01-01T00:00:00Z')
        );
        if (!isNaN(parsedDate.getTime())) {
          localDate = parsedDate;
          break;
        }
      }
      if (!localDate) {
        console.warn(`Invalid date/time: ${record[11]} ${record[12]}`);
        continue;
      }

      // Construct a UTC date by using the date components but interpreting them as UTC
      const dateTime = new Date(
        Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes(),
          localDate.getSeconds()
        )
      );

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
