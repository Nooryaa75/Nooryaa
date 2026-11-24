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
  assert.deepEqual(identityDecision(true, "maybe"), { verdict: "review", requireSelfie: true });
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
