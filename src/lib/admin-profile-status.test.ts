import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adminProfileStatus, PROFILE_STATUS_LABELS } from "./admin-display";

const entered = {
  status: "active",
  pseudo: "amina_92", gender: "femme", birthdate: "1990-05-12",
  city: "Le Raincy", country: "France", countries_origin: ["Maroc"], grew_up: "France",
  marital_status: "celibataire", height_cm: 170, has_children: false,
  wants_children_answer: "oui",
  salat_quotidienne: true, ramadan: true, hadj: false, omra: false, porte_voile: false,
  objective: "Mariage dans 1 an", bio: "Je souhaite construire une famille dans le respect et la confiance.",
  onboarded: true, photo_verified: true, photo_verification_status: "verified",
  phone: "+33612345678",
};

describe("statut admin des profils", () => {
  it("inscription terminée → Entré", () => {
    assert.equal(PROFILE_STATUS_LABELS[adminProfileStatus(entered, 1)], "Entré");
  });
  it("fiche incomplète → Pas encore entré", () => {
    assert.equal(PROFILE_STATUS_LABELS[adminProfileStatus({ ...entered, bio: null }, 1)], "Pas encore entré");
  });
  it("selfie validé mais fiche incomplète → Pas encore entré", () => {
    assert.equal(adminProfileStatus({ ...entered, height_cm: null, marital_status: null }, 1), "inactive");
  });
  it("sans photo → Pas encore entré", () => {
    assert.equal(adminProfileStatus(entered, 0), "inactive");
  });
  it("suspendu reste Suspendu même entré", () => {
    assert.equal(adminProfileStatus({ ...entered, status: "suspended" }, 1), "suspended");
  });
  it("compte ancien déjà marqué onboarded → Entré même si la fiche est incomplète", () => {
    assert.equal(adminProfileStatus({ status: "active", onboarded: true, pseudo: "Fatima83" }, 0), "active");
  });
});
