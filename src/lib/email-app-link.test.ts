import { test } from "node:test";
import assert from "node:assert/strict";
import { emailVerificationUrl, nativeEmailDestination, parseEmailVerification } from "./email-app-link";

test("confirmation links use the associated Nooryaa HTTPS domain and keep token out of query", () => {
  const url = new URL(emailVerificationUrl("test-token", "signup"));
  assert.equal(url.origin, "https://app.nooryaa.com");
  assert.equal(url.pathname, "/verification-email");
  assert.equal(url.search, "");
  assert.deepEqual(parseEmailVerification(url.hash), { token_hash: "test-token", type: "signup" });
});
test("resend confirmation supports magiclink", () => {
  assert.deepEqual(parseEmailVerification(new URL(emailVerificationUrl("resend-token", "magiclink")).hash), { token_hash: "resend-token", type: "magiclink" });
});
test("native app accepts only the verification path on the trusted HTTPS host", () => {
  assert.equal(nativeEmailDestination(emailVerificationUrl("test-token", "signup")), "/verification-email#token_hash=test-token&type=signup");
  for (const url of ["https://evil.example/verification-email#token_hash=x&type=signup", "http://app.nooryaa.com/verification-email#token_hash=x&type=signup", "https://app.nooryaa.com/browse#token_hash=x&type=signup", "https://app.nooryaa.com/verification-email#token_hash=x&type=recovery", "https://app.nooryaa.com/verification-email", "nooryaa://open"]) {
    assert.equal(nativeEmailDestination(url), null);
  }
});