import { describe, expect, it } from "vitest";
import { isSupportCategory, supportCategories } from "./support-categories";

describe("sujets du service client", () => {
  it("ne propose pas le signalement", () => {
    expect(supportCategories).not.toContain("Signalement");
    expect(isSupportCategory("Signalement")).toBe(false);
  });

  it("garde les autres sujets", () => {
    expect(supportCategories).toEqual([
      "Partenariat",
      "Inscription",
      "Connexion / Email",
      "Suppression de compte",
      "Abonnement",
      "Autres",
    ]);
    expect(isSupportCategory("Abonnement")).toBe(true);
  });
});
