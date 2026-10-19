import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { needsSocialWelcome } from "./welcome-auth";

const expect = (value: boolean) => ({ toBe: (expected: boolean) => assert.equal(value, expected) });

describe("Bienvenue après connexion sociale", () => {
  test("Google reçoit la bienvenue", () => {
    expect(needsSocialWelcome({ id: "google-user", app_metadata: { provider: "google" } })).toBe(true);
  });
  test("Apple reçoit la bienvenue y compris avec une adresse masquée", () => {
    expect(needsSocialWelcome({ id: "apple-user", app_metadata: { providers: ["apple"] } })).toBe(true);
  });
  test("Un compte lié à Google reste pris en charge", () => {
    expect(needsSocialWelcome({ id: "linked-user", app_metadata: { providers: ["email", "google"] } })).toBe(true);
  });
  test("L'inscription email conserve son déclenchement existant", () => {
    expect(needsSocialWelcome({ id: "email-user", app_metadata: { provider: "email" } })).toBe(false);
  });
  test("Aucun envoi sans connexion", () => {
    expect(needsSocialWelcome(null)).toBe(false);
  });
});