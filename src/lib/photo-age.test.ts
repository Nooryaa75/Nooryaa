import { test } from "node:test";
import assert from "node:assert/strict";
import { ageGap, ageGapMatch, appearsMinor, MAX_AGE_GAP } from "./photo-age";

test("an age gap up to 10 years passes without blocking", () => {
  assert.equal(ageGap(18, 23, 27), 5);
  assert.equal(ageGapMatch(18, 23, 27), "ok");
  assert.equal(ageGapMatch(30, 40, 40), "ok"); // écart de 10 ans, la limite haute
  assert.equal(ageGapMatch(33, 28, 38), "ok"); // âge déclaré dans la fourchette
});

test("only a gap above 10 years refuses the photo", () => {
  assert.equal(ageGap(18, 40, 44), 22); // le cas prilege1 : 18 déclarés, 42 apparents
  assert.equal(ageGapMatch(18, 40, 44), "mismatch");
  assert.equal(ageGapMatch(30, 19, 19), "mismatch"); // écart de 11 ans
  assert.equal(MAX_AGE_GAP, 10);
});

test("no usable face or no declared age is unknown", () => {
  assert.equal(ageGapMatch(33, 0, 0), "unknown");
  assert.equal(ageGapMatch(Number.NaN, 20, 30), "unknown");
});

test("a person appearing under 18 is refused", () => {
  assert.equal(appearsMinor(12, 16), true);
  assert.equal(appearsMinor(15, 18), false);
  assert.equal(appearsMinor(0, 0), false);
});
