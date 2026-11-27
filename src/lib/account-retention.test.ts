import { test } from "node:test";
import { strict as assert } from "node:assert";
import { showPatienceMessage } from "./account-retention";

test("invitation to wait only for deletion because there are too few profiles", () => {
  assert.equal(showPatienceMessage("delete", "Pas assez de profils dans ma région"), true);
  assert.equal(showPatienceMessage("suspend", "Pas assez de profils dans ma région"), false);
  assert.equal(showPatienceMessage("delete", "Autre"), false);
  assert.equal(showPatienceMessage("delete", ""), false);
});