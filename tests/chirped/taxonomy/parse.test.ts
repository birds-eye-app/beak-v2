import { expect, test } from "vitest";
import {
  parseTaxonomy,
  Taxonomy,
  parseTaxonomyToJson,
} from "../../../src/chirped/taxonomy/parse";

test("parseTaxonomy", async () => {
  const results = await parseTaxonomy();
  expect(results.length).toBe(17415);

  // check if we can use sci name as a unique key
  const uniqueKeys = new Set<string>();
  results.forEach((result) => {
    uniqueKeys.add(result.scientificName);
  });
  expect(uniqueKeys.size).toBe(results.length);

  // i suspect reportAs should always point from an ISSF to the species
  const hasReportAses = results.filter((r) => r.reportAs !== "");
  // expect all of these to have a reportAs that points to a species
  hasReportAses.forEach((r) => {
    const reportAs = results.find((rr) => rr.speciesCode === r.reportAs);
    expect(reportAs).toBeDefined();
    expect(reportAs?.category).toBe("species");
  });

  const expected = {
    bandingCodes: "",
    category: "species",
    comNameCodes: "COOS",
    commonName: "Common Ostrich",
    extinct: false,
    extinctYear: undefined,
    familyCode: "struth1",
    familyComName: "Ostriches",
    familySciName: "Struthionidae",
    order: "Struthioniformes",
    reportAs: "",
    sciNameCodes: "STCA",
    scientificName: "Struthio camelus",
    speciesCode: "ostric2",
    taxonOrder: 2,
  } as Taxonomy;

  const first = results[0];

  expect(first).toEqual(expected);
});

test("parseTaxonomyToJson", async () => {
  await parseTaxonomyToJson();
});
