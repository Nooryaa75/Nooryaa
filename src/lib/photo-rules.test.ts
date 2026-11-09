import { describe, expect, it } from "vitest";
import { canStartSelfie, enforceRealPhoto } from "./photo-rules";

describe("vraie photo obligatoire", () => {
  it("refuse une image qui n'est pas une vraie photo de personne (ex. texte)", () => {
    expect(enforceRealPhoto("allow", "no")).toBe("block");
  });
  it("accepte une vraie photo de personne", () => {
    expect(enforceRealPhoto("allow", "yes")).toBe("allow");
  });
  it("signale à la modération en cas de doute", () => {
    expect(enforceRealPhoto("allow", "unsure")).toBe("warn");
  });
});

describe("photo avant selfie", () => {
  it("bloque le selfie tant qu'aucune photo n'est enregistrée", () => {
    expect(canStartSelfie(0)).toBe(false);
  });
  it("autorise le selfie dès qu'une photo est enregistrée", () => {
    expect(canStartSelfie(1)).toBe(true);
  });
});
