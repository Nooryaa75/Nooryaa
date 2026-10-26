import { describe, it, expect } from "vitest";
import { adminProfileStatus, PROFILE_STATUS_LABELS } from "./admin-display";

describe("statut admin des profils", () => {
  it("profil validé → Actif", () => {
    expect(PROFILE_STATUS_LABELS[adminProfileStatus({ status: "active", photo_verified: true })]).toBe("Actif");
  });
  it("profil non validé → Non actif", () => {
    expect(PROFILE_STATUS_LABELS[adminProfileStatus({ status: "active", photo_verified: false })]).toBe("Non actif");
  });
  it("suspendu reste Suspendu même vérifié", () => {
    expect(adminProfileStatus({ status: "suspended", photo_verified: true })).toBe("suspended");
  });
});
