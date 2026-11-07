import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { canMessage } from "./reveal";
import { FREE_DAILY_LIKES, isLikeLimitError } from "./like-limit";
import { memberReason } from "./member-reason";

const me = { id: "me", gender: "femme" };
const other = { id: "other", gender: "homme" };
const graph = (iLiked: string[], likedMe: string[]) => ({ iLiked: new Set(iLiked), likedMe: new Set(likedMe) });

describe("likes et discussion", () => {
  test("la version gratuite donne 5 likes par jour", () => {
    assert.equal(FREE_DAILY_LIKES, 5);
  });
  test("le refus de la base pour limite atteinte est reconnu", () => {
    assert.equal(isLikeLimitError({ message: "LIKE_LIMIT_REACHED" }), true);
    assert.equal(isLikeLimitError({ message: "duplicate key" }), false);
  });
  test("discussion possible seulement après un match", () => {
    assert.equal(canMessage(me, other, graph(["other"], ["other"])), true);
  });
  test("pas de discussion si seul l'autre a liké (même pour une femme)", () => {
    assert.equal(canMessage(me, other, graph([], ["other"])), false);
  });
  test("pas de discussion si je suis seul·e à avoir liké", () => {
    assert.equal(canMessage(other, me, graph(["me"], [])), false);
  });
});

describe("avertissement photo dans la langue du membre", () => {
  const tr = (s: string, l: string) => (l === "en" && s === "Texte fixe" ? "Fixed text" : l === "en" && s === "Générique" ? "Generic" : s);
  test("texte fixe traduit par le catalogue", () => {
    assert.equal(memberReason({ reason: "Texte fixe", reasonFr: "Détail FR" }, "Générique", "en", tr), "Fixed text");
  });
  test("texte de l'analyse déjà rédigé en anglais gardé", () => {
    assert.equal(memberReason({ reason: "Use a clearer photo.", reasonFr: "Utilisez une photo plus nette." }, "Générique", "en", tr), "Use a clearer photo.");
  });
  test("texte resté en français remplacé par le message générique traduit", () => {
    assert.equal(memberReason({ reason: "Photo floue.", reasonFr: "Photo floue." }, "Générique", "en", tr), "Generic");
  });
});
