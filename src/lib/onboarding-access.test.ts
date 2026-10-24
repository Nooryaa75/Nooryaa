import { test } from "node:test";
import assert from "node:assert/strict";
import { onboardingDestination, showAccessGate } from "./onboarding-access";

test("unfinished members cannot bypass onboarding through menus or direct member links", () => {
  for (const path of ["/browse", "/recherche", "/likes", "/messages", "/compte", "/compte/profil", "/profile/test"]) {
    assert.equal(onboardingDestination(true, path), "/onboarding");
  }
  assert.equal(onboardingDestination(true, "/onboarding"), null);
});

test("completed members retain access to the member pages", () => {
  assert.equal(onboardingDestination(false, "/browse"), null);
  assert.equal(onboardingDestination(false, "/compte"), null);
});

test("the app is hidden only until the member has been verified once in the session", () => {
  // Premier chargement : rien n'est encore vérifié, l'écran de chargement s'affiche.
  assert.equal(showAccessGate(null, "user-1"), true);
  // Changement de page : le contrôle se refait en arrière-plan, la page reste visible.
  assert.equal(showAccessGate("user-1", "user-1"), false);
  // Changement de compte : il faut revalider la nouvelle fiche avant d'afficher l'app.
  assert.equal(showAccessGate("user-1", "user-2"), true);
  assert.equal(showAccessGate(null, ""), true);
});