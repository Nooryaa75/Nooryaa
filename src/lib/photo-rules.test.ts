import { test } from "node:test";
import assert from "node:assert/strict";
import { canStartSelfie, enforceFaceVisible, enforceModestDress, enforceRealPhoto, enforceSinglePerson, identityDecision } from "./photo-rules";

test("une image qui n'est pas une vraie photo de personne (ex. texte) est refusée", () => {
  assert.equal(enforceRealPhoto("allow", "no"), "block");
});

test("une vraie photo de personne est acceptée", () => {
  assert.equal(enforceRealPhoto("allow", "yes"), "allow");
});

test("en cas de doute, la photo est signalée à la modération", () => {
  assert.equal(enforceRealPhoto("allow", "unsure"), "warn");
});

test("le selfie est bloqué tant qu'aucune photo n'est enregistrée", () => {
  assert.equal(canStartSelfie(0), false);
});

test("le selfie est possible dès qu'une photo est enregistrée", () => {
  assert.equal(canStartSelfie(1), true);
});

test("une photo sans visage visible est refusée", () => {
  assert.equal(enforceFaceVisible("allow", "no"), "block");
  assert.equal(enforceFaceVisible("warn", "no"), "block");
});

test("une photo où le visage n'est pas nettement visible (sombre, de loin) est refusée", () => {
  assert.equal(enforceFaceVisible("warn", "unsure"), "block");
});

test("une photo avec le visage bien visible garde son verdict", () => {
  assert.equal(enforceFaceVisible("allow", "yes"), "allow");
  assert.equal(enforceFaceVisible("warn", "yes"), "warn");
});

test("une photo d'une autre personne que le selfie ou les photos est refusée", () => {
  assert.equal(identityDecision(true, "no").verdict, "block");
});

test("une photo dont la ressemblance ne peut pas être établie est refusée", () => {
  assert.equal(identityDecision(true, "unknown").verdict, "block");
});

test("une photo qui ressemble sans certitude est acceptée mais le selfie est à refaire", () => {
  assert.equal(identityDecision(true, "maybe").verdict, "block");
});

test("une photo de la même personne est acceptée", () => {
  assert.equal(identityDecision(true, "yes").verdict, "allow");
});

test("la toute première photo n'a rien à comparer et passe au contrôle suivant", () => {
  assert.equal(identityDecision(false, "unknown").verdict, "allow");
});

test("une photo torse nu est refusée, même si le reste de l'analyse l'acceptait", () => {
  assert.equal(enforceModestDress("allow", "yes"), "block");
  assert.equal(enforceModestDress("warn", "yes"), "block");
});

test("en cas de doute sur le torse nu, la photo est signalée à l'équipe", () => {
  assert.equal(enforceModestDress("allow", "unsure"), "warn");
});

test("une photo habillée n'est pas touchée par la règle torse nu", () => {
  assert.equal(enforceModestDress("allow", "no"), "allow");
});

test("une photo de groupe ou à deux est refusée, même si le reste de l'analyse l'acceptait", () => {
  assert.equal(enforceSinglePerson("allow", "no"), "block");
  assert.equal(enforceSinglePerson("warn", "no"), "block");
});

test("en cas de doute sur une deuxième personne, la photo est signalée à l'équipe", () => {
  assert.equal(enforceSinglePerson("allow", "unsure"), "warn");
});

test("une photo avec une seule personne garde son verdict", () => {
  assert.equal(enforceSinglePerson("allow", "yes"), "allow");
});

// Règles de refus photo + selfie (Nooryaa, 24 nov. 2026)
import { photoRuleViolation, parsePhotoRuleChecks, type PhotoRuleChecks } from "./photo-rules";

const ok: PhotoRuleChecks = parsePhotoRuleChecks({ face_angle: "front", apparent_gender: "homme" });

test("une photo conforme ne déclenche aucune règle", () => {
  assert.equal(photoRuleViolation(ok, "homme"), null);
});

const refused: [string, Partial<PhotoRuleChecks>, string][] = [
  ["dans le noir", { too_dark: "yes" }, "trop_sombre"],
  ["en short", { shorts: "yes" }, "short"],
  ["visage à moitié", { face_complete: "no" }, "visage_a_moitie"],
  ["prise de profil", { face_angle: "profile" }, "photo_de_profil"],
  ["créée par l'IA", { ai_generated: "yes" }, "modifiee_ia"],
  ["avec un filtre qui change le visage", { filtered: "heavy" }, "modifiee_ia"],
  ["à caractère sexuel", { sexual: "yes" }, "caractere_sexuel"],
  ["avec du texte", { added_text: "yes" }, "texte"],
  ["de travers", { tilted: "yes" }, "photo_de_travers"],
  ["un peu de travers (doute)", { tilted: "unsure" }, "photo_de_travers"],
  ["en doute IA (plus d'avertissement)", { ai_generated: "maybe" }, "modifiee_ia"],
];
for (const [label, change, category] of refused) {
  test(`photo ${label} : refusée (photo et selfie)`, () => {
    assert.deepEqual(
      [photoRuleViolation({ ...ok, ...change }, "homme")?.verdict, photoRuleViolation({ ...ok, ...change }, "homme")?.category],
      ["block", category],
    );
    assert.equal(photoRuleViolation({ ...ok, ...change }, "homme", false)?.verdict, "block");
  });
}

test("photo d'une femme sur un profil homme : refusée", () => {
  assert.equal(photoRuleViolation({ ...ok, apparent_gender: "femme" }, "homme")?.category, "sexe_incoherent");
});

test("sexe apparent incertain : la photo n'est pas refusée", () => {
  assert.equal(photoRuleViolation({ ...ok, apparent_gender: "unknown" }, "femme"), null);
});

test("photo légèrement tournée (trois quarts) : acceptée", () => {
  assert.equal(photoRuleViolation({ ...ok, face_angle: "three_quarter" }, "homme"), null);
});

test("doute sur un short : refusé, photo comme selfie (plus d'avertissement)", () => {
  assert.equal(photoRuleViolation({ ...ok, shorts: "unsure" }, "homme")?.verdict, "block");
  assert.equal(photoRuleViolation({ ...ok, shorts: "unsure" }, "homme", false)?.verdict, "block");
});
