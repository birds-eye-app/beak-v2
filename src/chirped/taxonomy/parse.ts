import { promises as fs } from 'fs';
import Papa from 'papaparse';
import * as path from 'path';

// SCIENTIFIC_NAME,COMMON_NAME,SPECIES_CODE,CATEGORY,TAXON_ORDER,COM_NAME_CODES,SCI_NAME_CODES,BANDING_CODES,ORDER,FAMILY_COM_NAME,FAMILY_SCI_NAME,REPORT_AS,EXTINCT,EXTINCT_YEAR,FAMILY_CODE
// Struthio camelus,Common Ostrich,ostric2,species,2.0,COOS,STCA,,Struthioniformes,Ostriches,Struthionidae,,,,struth1
// Struthio molybdophanes,Somali Ostrich,ostric3,species,7.0,SOOS,STMO,,Struthioniformes,Ostriches,Struthionidae,,,,struth1
// Struthio camelus/molybdophanes,Common/Somali Ostrich,y00934,slash,8.0,SOOS COOS,STMO STCA,,Struthioniformes,Ostriches,Struthionidae,,,,struth1
// Casuarius casuarius,Southern Cassowary,soucas1,species,10.0,SOCA,CACA,,Casuariiformes,Cassowaries and Emu,Casuariidae,,,,casuar1
// Casuarius bennetti,Dwarf Cassowary,dwacas1,species,11.0,DWCA,CABE,,Casuariiformes,Cassowaries and Emu,Casuariidae,,,,casuar1
// Casuarius unappendiculatus,Northern Cassowary,norcas1,species,12.0,NOCA,CAUN,,Casuariiformes,Cassowaries and Emu,Casuariidae,,,,casuar1
// Dromaius novaehollandiae,Emu,emu1,species,13.0,EMU COEM,DRNO,,Casuariiformes,Cassowaries and Emu,Casuariidae,,,,casuar1

export interface Taxonomy {
  scientificName: string;
  commonName: string;
  speciesCode: string;
  category: string;
  taxonOrder: number;
  comNameCodes: string;
  sciNameCodes: string;
  bandingCodes: string;
  order: string;
  familyComName: string;
  familySciName: string;
  reportAs?: string;
  extinct: boolean;
  extinctYear?: number;
  familyCode: string;
}

const expectedHeaders = [
  'SCIENTIFIC_NAME',
  'COMMON_NAME',
  'SPECIES_CODE',
  'CATEGORY',
  'TAXON_ORDER',
  'COM_NAME_CODES',
  'SCI_NAME_CODES',
  'BANDING_CODES',
  'ORDER',
  'FAMILY_COM_NAME',
  'FAMILY_SCI_NAME',
  'REPORT_AS',
  'EXTINCT',
  'EXTINCT_YEAR',
  'FAMILY_CODE',
];

// read the local taxonomy file into the interface type
// then save it disk as json that we can embed into the app
export const parseTaxonomy = async () => {
  const filePath = path.join(__dirname, 'taxonomy.csv');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const results: Taxonomy[] = [];

  const parsed = Papa.parse(fileContents, {
    delimiter: ',',
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error('Error parsing taxonomy file' + parsed.errors);
  }

  (parsed.data as string[][]).forEach((record: string[], index) => {
    const [
      scientificName,
      commonName,
      speciesCode,
      category,
      taxonOrder,
      comNameCodes,
      sciNameCodes,
      bandingCodes,
      order,
      familyComName,
      familySciName,
      reportAs,
      extinct,
      extinctYear,
      familyCode,
    ] = record;
    if (index === 0) {
      if (!expectedHeaders.every((header, i) => header === record[i])) {
        throw new Error('Invalid headers in CSV');
      }

      return;
    }

    results.push({
      scientificName,
      commonName,
      speciesCode,
      category,
      taxonOrder: parseFloat(taxonOrder),
      comNameCodes,
      sciNameCodes,
      bandingCodes,
      order,
      familyComName,
      familySciName,
      reportAs,
      extinct: extinct === 'TRUE',
      extinctYear:
        extinctYear.trim() !== '' ? parseInt(extinctYear) : undefined,
      familyCode,
    });
  });

  return results;
};

export const parseTaxonomyToJson = async () => {
  const results = await parseTaxonomy();

  // change the formatting slightly to make it a mapping
  // of scientific names to the taxonomy object
  const taxonomyMap: Record<string, Taxonomy> = {};
  results.forEach((result) => {
    taxonomyMap[result.scientificName] = result;
  });

  // check to make sure the keys are unique / the same length
  const uniqueKeys = new Set<string>();
  results.forEach((result) => {
    uniqueKeys.add(result.scientificName);
  });
  if (uniqueKeys.size !== results.length) {
    throw new Error('Duplicate scientific names found');
  }

  const filePath = path.join(__dirname, 'taxonomy.json');

  await fs.writeFile(filePath, JSON.stringify(taxonomyMap, null, 2));
};
