import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { centerSquare } from "./camera-frame";

describe("photo prise avec la caméra du site", () => {
  it("une webcam large ne garde que le carré visible à l'écran (bords exclus)", () => {
    assert.deepEqual(centerSquare(1280, 720), { sx: 280, sy: 0, side: 720 });
  });
  it("une caméra de téléphone en hauteur garde aussi le carré central", () => {
    assert.deepEqual(centerSquare(720, 1280), { sx: 0, sy: 280, side: 720 });
  });
});
