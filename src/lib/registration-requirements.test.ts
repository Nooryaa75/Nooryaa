import { test } from "node:test";
import assert from "node:assert/strict";
import { registrationChecks, registrationComplete } from "./registration-requirements";

const complete = {
  pseudo: "amina_92", gender: "femme", birthdate: "1990-05-12",
  city: "Le Raincy", country: "France", countries_origin: ["Maroc"], grew_up: "France",
  marital_status: "celibataire", height_cm: 170, has_children: false,
  children_count: null, wants_children_answer: "je_ne_sais_pas",
  salat_quotidienne: true, ramadan: true, hadj: false, omra: false, porte_voile: false,
  objective: "Mariage dans 1 an", bio: "Je souhaite construire une famille dans le respect et la confiance.",
  onboarded: true, photo_verified: true, photo_verification_status: "verified",
};

test("le pays de résidence doit être renseigné avant les questions suivantes", () => {
  assert.deepEqual(registrationChecks({ ...complete, country: null }).find(([, label]) => label === "Pays de résidence"), [0, "Pays de résidence", false]);
  assert.equal(registrationComplete({ ...complete, country: null }, 1, true), false);
});
test("le lieu où la personne a grandi est obligatoire dans la première partie", () => {
  assert.deepEqual(registrationChecks({ ...complete, grew_up: null }).find(([, label]) => label === "Où as-tu grandi ?"), [0, "Où as-tu grandi ?", false]);
});
test("un pseudo provisoire ne permet pas de terminer l'inscription", () => {
  assert.equal(registrationComplete({ ...complete, pseudo: "user_ff2c0d62d4" }, 2, true), false);
});
test("un selfie validé ne remplace pas les informations complémentaires de Fatima83", () => {
  assert.equal(registrationComplete({ ...complete, pseudo: "Fatima83", height_cm: null, marital_status: null, bio: null }, 1, true), false);
});
test("chaque réponse obligatoire manquante empêche l'accès même si onboarded est vrai", () => {
  for (const field of ["pseudo", "gender", "birthdate", "city", "country", "grew_up", "marital_status", "height_cm", "has_children", "wants_children_answer", "salat_quotidienne", "ramadan", "hadj", "omra", "porte_voile", "objective", "bio"]) {
    assert.equal(registrationComplete({ ...complete, [field]: null }, 1, true), false, field);
  }
});
test("le voile n'est obligatoire que pour une femme", () => {
  assert.equal(registrationComplete({ ...complete, gender: "homme", porte_voile: null }, 1, true), true);
  assert.equal(registrationComplete({ ...complete, porte_voile: null }, 1, true), false);
});
test("le nombre d'enfants est obligatoire uniquement si la personne en a", () => {
  assert.equal(registrationComplete({ ...complete, has_children: true }, 1, true), false);
  assert.equal(registrationComplete({ ...complete, has_children: true, children_count: 2 }, 1, true), true);
});
test("une panne de vérification reste non bloquante seulement avec une fiche complète", () => {
  assert.equal(registrationComplete({ ...complete, photo_verified: false, photo_verification_status: "pending" }, 1, true), true);
  assert.equal(registrationComplete({ ...complete, photo_verified: false, photo_verification_status: "pending", bio: null }, 1, true), false);
});
test("photo et téléphone restent obligatoires", () => {
  assert.equal(registrationComplete(complete, 0, true), false);
  assert.equal(registrationComplete(complete, 1, false), false);
  assert.equal(registrationComplete(complete, 1, true), true);
});
test("le bouton Suivant ne s'active que si toutes les questions de la page sont remplies", () => {
  const stepOk = (p: object, step: number) =>
    registrationChecks(p).filter(([s]) => s === step).every(([, , ok]) => ok);
  assert.equal(stepOk(complete, 0), true);
  assert.equal(stepOk(complete, 1), true);
  assert.equal(stepOk(complete, 2), true);
  assert.equal(stepOk({ ...complete, height_cm: null }, 0), false);
  assert.equal(stepOk({ ...complete, ramadan: null }, 1), false);
  assert.equal(stepOk({ ...complete, objective: "" }, 2), false);
  assert.equal(stepOk({ ...complete, bio: "trop court" }, 2), false);
  // Une page complète ne débloque pas les suivantes : chaque page est contrôlée seule.
  assert.equal(stepOk({ ...complete, salat_quotidienne: null }, 1), false);
  assert.equal(stepOk({ ...complete, salat_quotidienne: null }, 0), true);
});