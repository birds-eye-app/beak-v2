import { Observation, parseObservations } from "../../src/chirped/parseEbirdExport";
import * as path from "path";
import * as fs from "fs";
import { expect, test } from "vitest";

test("parseObservations", async () => {
  const csvFilePath = path.join(__dirname, "MyEBirdData.csv");
  const csvData = fs.readFileSync(csvFilePath, "utf8");
  const actual = await parseObservations(csvData);

  expect(actual.length).toBe(4999);
  const first = actual[0];

  const expected: Observation = {
    allObsReported: false,
    areaCoveredHa: undefined,
    breedingCode: undefined,
    checklistComments: undefined,
    commonName: "Northern Harrier",
    count: "X",
    county: "St. Bernard",
    date: "2022-11-21",
    dateTime: new Date("2022-11-21T17:00:00.000Z"),
    distanceTraveledKm: undefined,
    durationMinutes: NaN,
    latitude: 29.819019,
    location: "Hopedale",
    locationId: "L21909958",
    longitude: -89.61216,
    mlCatalogNumbers: undefined,
    numberOfObservers: 1,
    observationDetails: undefined,
    protocol: "eBird - Casual Observation",
    scientificName: "Circus hudsonius",
    stateProvince: "US-LA",
    submissionId: "S131890239",
    taxonomicOrder: 8228,
    taxonomy: {
      bandingCodes: "NOHA",
      category: "species",
      comNameCodes: "",
      commonName: "Northern Harrier",
      extinct: false,
      familyCode: "accipi1",
      familyComName: "Hawks, Eagles, and Kites",
      familySciName: "Accipitridae",
      order: "Accipitriformes",
      reportAs: "",
      sciNameCodes: "CIHU",
      scientificName: "Circus hudsonius",
      speciesCode: "norhar2",
      taxonOrder: 8228,
    },
    time: "",
  };

  expect(first).toEqual(expected);

  // check that all have their dates parsed correctly
  const invalidDates = actual.filter((obs) => isNaN(obs.dateTime.getTime()));
  expect(invalidDates.length).toBe(0);
});
