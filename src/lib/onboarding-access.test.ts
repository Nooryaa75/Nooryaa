import { test } from "node:test";
import assert from "node:assert/strict";
import { onboardingDestination } from "./onboarding-access";

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