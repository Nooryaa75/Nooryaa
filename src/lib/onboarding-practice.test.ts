import { test } from "node:test";
import assert from "node:assert/strict";
import { practiceChecks } from "./onboarding-practice";

const base = {
  gender: "femme",
  salat_quotidienne: null,
  ramadan: null,
  hadj: null,
  omra: null,
  porte_voile: null,
};

test("les questions de pratique religieuse sont obligatoires tant qu'elles restent sans réponse", () => {
  const unanswered = practiceChecks(base).filter(([, ok]) => !ok).map(([label]) => label);
  assert.deepEqual(unanswered, [
    "Salat quotidienne",
    "Ramadan",
    "Avez-vous fait le Hadj ?",
    "Avez-vous fait la Omra ?",
    "Portez-vous le voile ?",
  ]);
});

test("répondre « Non » à une question la valide : le blocage vient de l'absence de réponse", () => {
  const answered = practiceChecks({
    ...base,
    salat_quotidienne: false,
    ramadan: false,
    hadj: false,
    omra: false,
    porte_voile: false,
  });
  assert.deepEqual(answered.filter(([, ok]) => !ok), []);
});

test("« Portez-vous le voile ? » n'est exigée que des femmes", () => {
  const man = practiceChecks({ ...base, gender: "homme" }).find(([label]) => label === "Portez-vous le voile ?");
  assert.deepEqual(man, ["Portez-vous le voile ?", true]);
  const woman = practiceChecks({ ...base, gender: "femme" }).find(([label]) => label === "Portez-vous le voile ?");
  assert.deepEqual(woman, ["Portez-vous le voile ?", false]);
});
