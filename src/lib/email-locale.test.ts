import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeLocale } from "./email-i18n";

test("emails preserve supported languages and use English for unsupported languages", () => {
  assert.equal(normalizeLocale("fr-FR"), "fr");
  assert.equal(normalizeLocale("ar-DZ"), "ar");
  assert.equal(normalizeLocale("en-GB"), "en");
  assert.equal(normalizeLocale("ja-JP"), "en");
  assert.equal(normalizeLocale(undefined), "en");
});