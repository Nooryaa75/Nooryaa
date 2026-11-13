import { test } from "node:test";
import assert from "node:assert/strict";
import { canStartSelfie, enforceFaceVisible, enforceRealPhoto } from "./photo-rules";

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
