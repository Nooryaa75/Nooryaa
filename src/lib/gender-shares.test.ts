import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { genderShares } from "./admin-display";

describe("pourcentages hommes / femmes dans la rubrique Profils", () => {
  it("128 hommes et 176 femmes → 42 % et 58 %", () => {
    const s = genderShares({ homme: 128, femme: 176 });
    assert.equal(s.homme, 42);
    assert.equal(s.femme, 58);
    assert.equal(s.total, 304);
    assert.equal(s.hommeCount, 128);
    assert.equal(s.femmeCount, 176);
  });
  it("les deux pourcentages summent toujours à 100", () => {
    const s = genderShares({ homme: 1, femme: 2 });
    assert.equal(s.homme, 33);
    assert.equal(s.femme, 67);
    assert.equal((s.homme ?? 0) + (s.femme ?? 0), 100);
  });
  it("un seul sexe présent → 100 % et 0 %", () => {
    assert.deepEqual(genderShares({ homme: 7, femme: 0 }), {
      homme: 100, femme: 0, hommeCount: 7, femmeCount: 0, total: 7,
    });
  });
  it("aucun membre → aucun pourcentage affiché", () => {
    assert.deepEqual(genderShares({ homme: 0, femme: 0 }), {
      homme: null, femme: null, hommeCount: 0, femmeCount: 0, total: 0,
    });
  });
  it("liste encore chargée (compteurs absents) → aucun pourcentage", () => {
    assert.equal(genderShares(undefined).homme, null);
    assert.equal(genderShares({ homme: null, femme: undefined }).femme, null);
  });
});
