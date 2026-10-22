import { test } from "node:test";
import assert from "node:assert/strict";
import { presignupProfilePatch, hasPresignup } from "./presignup";

const answers = {
  gender: "femme" as const,
  pseudo: "amina_92",
  birthdate: "1990-05-12",
  origins: ["Algérie", "Maroc"],
  grewUp: "Algérie",
  city: "Le Raincy",
  country: "France",
  latitude: 48.9,
  longitude: 2.5,
};

test("les réponses guidées remplissent une fiche vide", () => {
  const p = presignupProfilePatch(answers, { pseudo: "user_123456" });
  assert.equal(p.gender, "femme");
  assert.equal(p.looking_for, "homme");
  assert.equal(p.pseudo, "amina_92");
  assert.equal(p.birthdate, "1990-05-12");
  assert.deepEqual(p.countries_origin, ["Algérie", "Maroc"]);
  assert.equal(p.country_origin, "Algérie");
  assert.equal(p.grew_up, "Algérie");
  assert.equal(p.city, "Le Raincy");
});

test("une valeur déjà saisie dans la fiche n'est jamais remplacée", () => {
  const p = presignupProfilePatch(answers, { gender: "homme", pseudo: "karim", birthdate: "1980-01-01", city: "Paris", grew_up: "France" });
  assert.equal(p.gender, undefined);
  assert.equal(p.pseudo, undefined);
  assert.equal(p.birthdate, undefined);
  assert.equal(p.city, undefined);
  assert.equal(p.grew_up, undefined);
});

test("aucune réponse guidée = rien à reprendre", () => {
  assert.equal(hasPresignup({}), false);
  assert.equal(hasPresignup({ gender: "homme" }), true);
});
