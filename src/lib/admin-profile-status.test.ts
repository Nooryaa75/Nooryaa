import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adminProfileStatus, PROFILE_STATUS_LABELS } from "./admin-display";

describe("statut admin des profils", () => {
  it("profil validé → Actif", () => {
    assert.equal(PROFILE_STATUS_LABELS[adminProfileStatus({ status: "active", photo_verified: true })], "Actif");
  });
  it("profil non validé → Non actif", () => {
    assert.equal(PROFILE_STATUS_LABELS[adminProfileStatus({ status: "active", photo_verified: false })], "Non actif");
  });
  it("suspendu reste Suspendu même vérifié", () => {
    assert.equal(adminProfileStatus({ status: "suspended", photo_verified: true }), "suspended");
  });
});
