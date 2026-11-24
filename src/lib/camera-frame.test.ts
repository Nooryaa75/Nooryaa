import { describe, expect, test } from "vitest";
import { centerSquare } from "./camera-frame";

describe("photo prise avec la caméra du site", () => {
  test("une webcam large ne garde que le carré visible à l'écran (bords exclus)", () => {
    expect(centerSquare(1280, 720)).toEqual({ sx: 280, sy: 0, side: 720 });
  });
  test("une caméra de téléphone en hauteur garde aussi le carré central", () => {
    expect(centerSquare(720, 1280)).toEqual({ sx: 0, sy: 280, side: 720 });
  });
});
