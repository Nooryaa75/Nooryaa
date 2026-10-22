import { describe, expect, test } from "bun:test";
import { resolveLocale } from "./locale";

describe("default language", () => {
  test("French browser or phone uses French", () => {
    expect(resolveLocale(null, "fr-FR")).toBe("fr");
  });
  test("Arabic browser or phone uses Arabic", () => {
    expect(resolveLocale(null, "ar-DZ")).toBe("ar");
  });
  test("English browser or phone uses English", () => {
    expect(resolveLocale(null, "en-US")).toBe("en");
  });
  test("unsupported primary language defaults to English", () => {
    expect(resolveLocale(null, "ja-JP")).toBe("en");
    expect(resolveLocale(null, "de-DE")).toBe("en");
    expect(resolveLocale(null)).toBe("en");
  });
  test("explicit member choice takes priority over device language", () => {
    expect(resolveLocale("fr", "ar-DZ")).toBe("fr");
    expect(resolveLocale("ar", "fr-FR")).toBe("ar");
    expect(resolveLocale("en", "fr-FR")).toBe("en");
  });
});