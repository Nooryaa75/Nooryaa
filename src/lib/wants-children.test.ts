import { test } from "node:test";
import assert from "node:assert/strict";
import {
  wantsChildrenAnswered,
  wantsChildrenBool,
  wantsChildrenChoice,
  wantsChildrenLabel,
} from "./wants-children";

test("« Je ne sais pas » est une réponse complète : la fiche n'est plus bloquée sur cette question", () => {
  assert.equal(wantsChildrenAnswered("je_ne_sais_pas"), true);
  assert.equal(wantsChildrenAnswered("oui"), true);
  assert.equal(wantsChildrenAnswered("non"), true);
  assert.equal(wantsChildrenAnswered(""), false);
  assert.equal(wantsChildrenAnswered(null), false);
});

test("« Je ne sais pas » ne devient jamais un critère de recherche ou de compatibilité", () => {
  assert.equal(wantsChildrenBool("je_ne_sais_pas"), null);
  assert.equal(wantsChildrenBool("oui"), true);
  assert.equal(wantsChildrenBool("non"), false);
  assert.equal(wantsChildrenBool(null), null);
});

test("les anciennes réponses oui/non sont reprises, et « je ne sais pas » s'affiche tel quel", () => {
  assert.equal(wantsChildrenChoice(true), "oui");
  assert.equal(wantsChildrenChoice(false), "non");
  assert.equal(wantsChildrenChoice("je_ne_sais_pas"), "je_ne_sais_pas");
  assert.equal(wantsChildrenChoice("peut-être"), "");
  assert.equal(wantsChildrenLabel("je_ne_sais_pas"), "Je ne sais pas");
  assert.equal(wantsChildrenLabel(true), "Oui");
  assert.equal(wantsChildrenLabel(false), "Non");
  assert.equal(wantsChildrenLabel(null), undefined);
});
