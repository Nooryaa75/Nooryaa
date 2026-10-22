import { test } from "node:test";
import assert from "node:assert/strict";
import { profileCompletion } from "./profile-completion";

test("profil vide = 0 %", () => {
  assert.equal(profileCompletion({}).percent, 0);
});

test("profil complet = 100 %", () => {
  const r = profileCompletion({
    primary_photo_url: "x", bio: "a".repeat(40), city: "Paris", height_cm: 170, body_type: "Mince",
    profession: "P", education_level: "E", country_origin: "Algérie", grew_up: "France", objective: "O",
    activities: "Sport", preferences: { valeurs: ["Foi"] }, personality: "Calme", smoker: false,
  });
  assert.equal(r.percent, 100);
  assert.equal(r.missing.length, 0);
});
