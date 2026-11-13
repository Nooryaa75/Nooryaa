import { test } from "node:test";
import assert from "node:assert/strict";
import { pseudoValid } from "./pseudo";

test("un pseudo d'une ou deux lettres est refusé", () => {
  assert.equal(pseudoValid("W"), false);
  assert.equal(pseudoValid("Ab"), false);
});

test("un pseudo de 3 lettres est accepté", () => {
  assert.equal(pseudoValid("Ali"), true);
});

test("les chiffres ne comptent pas comme lettres", () => {
  assert.equal(pseudoValid("A12345"), false);
  assert.equal(pseudoValid("Ama92"), true);
});

test("les lettres arabes comptent", () => {
  assert.equal(pseudoValid("عمر"), true);
});

test("le pseudo provisoire user_ n'est pas un vrai pseudo", () => {
  assert.equal(pseudoValid("user_ff2c0d62d4"), false);
});

test("un pseudo en phrase (avec des espaces) est refusé", () => {
  assert.equal(pseudoValid("Le boureur arrive"), false);
  assert.equal(pseudoValid("Um Sarai"), false);
});

test("un pseudo d'un seul mot est accepté, avec des chiffres à la fin", () => {
  assert.equal(pseudoValid("amina_92"), true);
  assert.equal(pseudoValid("Amina92"), true);
});

test("des mots collés par un tiret, un point ou un _ sont refusés", () => {
  assert.equal(pseudoValid("Le-boureur-arrive"), false);
  assert.equal(pseudoValid("Le-boureur"), false);
  assert.equal(pseudoValid("samira_raincy"), false);
  assert.equal(pseudoValid("le.boureur"), false);
});

test("les espaces au début ou à la fin ne comptent pas", () => {
  assert.equal(pseudoValid("Hafidou6 "), true);
});

test("un pseudo de plus de 20 caractères est refusé", () => {
  assert.equal(pseudoValid("abcdefghijklmnopqrstu"), false);
  assert.equal(pseudoValid("abcdefghijklmnopqrst"), true);
});

test("une adresse email n'est pas un pseudo", () => {
  assert.equal(pseudoValid("nanbobo74@gmail.com"), false);
});
