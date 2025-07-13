import { expect, test } from "vitest";

import { fetchTaxonomyForSpecies } from "../../../src/chirped/taxonomy/fetch";
test("fetchTaxonomyForSpecies", async () => {
  const t = fetchTaxonomyForSpecies("Struthio camelus");

  expect(t).toEqual({
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
  });
});
