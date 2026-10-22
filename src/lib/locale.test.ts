import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolveLocale } from "./locale";

describe("default language", () => {
  test("French browser or phone uses French", () => {
    assert.equal(resolveLocale(null, "fr-FR"), "fr");
  });
  test("Arabic browser or phone uses Arabic", () => {
    assert.equal(resolveLocale(null, "ar-DZ"), "ar");
  });
  test("English browser or phone uses English", () => {
    assert.equal(resolveLocale(null, "en-US"), "en");
  });
  test("unsupported primary language defaults to English", () => {
    assert.equal(resolveLocale(null, "ja-JP"), "en");
    assert.equal(resolveLocale(null, "de-DE"), "en");
    assert.equal(resolveLocale(null), "en");
  });
  test("explicit member choice takes priority over device language", () => {
    assert.equal(resolveLocale("fr", "ar-DZ"), "fr");
    assert.equal(resolveLocale("ar", "fr-FR"), "ar");
    assert.equal(resolveLocale("en", "fr-FR"), "en");
  });
});