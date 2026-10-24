import { test } from "node:test";
import assert from "node:assert/strict";
import { isSupportCategory, supportCategories } from "./support-categories";

test("le service client ne propose pas le signalement", () => {
  assert.equal(supportCategories.includes("Signalement"), false);
  assert.equal(isSupportCategory("Signalement"), false);
});

test("les autres sujets du service client restent disponibles", () => {
  assert.deepEqual([...supportCategories], [
    "Partenariat",
    "Inscription",
    "Connexion / Email",
    "Suppression de compte",
    "Abonnement",
    "Autres",
  ]);
  assert.equal(isSupportCategory("Abonnement"), true);
});
