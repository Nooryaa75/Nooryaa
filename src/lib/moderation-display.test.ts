import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { moderationKind, parseModerationChecks, selfieForEvent } from "./moderation-display";

describe("détail d'un événement de modération", () => {
  it("reconnaît le type d'événement", () => {
    assert.equal(moderationKind({ source: "message", categories: ["insulte"] }), "message");
    assert.equal(moderationKind({ source: "voice", categories: [] }), "vocal");
    assert.equal(moderationKind({ source: "photo", categories: ["selfie_verification"] }), "selfie");
    assert.equal(moderationKind({ source: "photo", categories: ["photo_identity"] }), "identite");
    assert.equal(moderationKind({ source: "photo", categories: ["torse_nu"] }), "photo");
  });
  it("traduit le résumé d'un contrôle photo", () => {
    const rows = parseModerationChecks("Photo de profil — visage:yes / torse nu:no / IA:maybe");
    assert.deepEqual(rows, [
      { label: "Visage", value: "Oui" },
      { label: "Torse nu", value: "Non" },
      { label: "IA", value: "Peut-être" },
    ]);
  });
  it("un message écrit n'a pas de lignes de contrôle", () => {
    assert.deepEqual(parseModerationChecks("tu es nul — vraiment"), []);
  });
  it("choisit le selfie pris juste avant l'événement", () => {
    const u = "abc";
    const names = [`${u}-2026-11-23T10-00-00-000Z`, `${u}-2026-11-23T12-00-00-000Z`, `${u}-2026-11-23T15-00-00-000Z`];
    assert.equal(selfieForEvent(names, u, "2026-11-23T12:00:05.000Z"), `${u}-2026-11-23T12-00-00-000Z`);
    assert.equal(selfieForEvent(names, u, "2026-11-23T09:00:00.000Z"), null);
  });
});

describe("âge apparent dans le détail", () => {
  it("rend l'âge déclaré lisible", () => {
    const rows = parseModerationChecks("Photo de profil — âge apparent:30-40 vs déclaré:36 (ok)");
    assert.deepEqual(rows, [{ label: "Âge apparent", value: "30-40 · âge déclaré 36 (écart accepté)" }]);
  });
});
