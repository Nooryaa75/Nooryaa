import { test } from "node:test";
import assert from "node:assert/strict";
import { showPaidPlans } from "./paid-plans";

test("the iPhone app never shows paid plans, even when subscriptions are on", () => {
  assert.equal(showPaidPlans(true, "ios"), false);
  assert.equal(showPaidPlans(false, "ios"), false);
});

test("no Premium offer anywhere while subscriptions are switched off", () => {
  assert.equal(showPaidPlans(false, null), false);
  assert.equal(showPaidPlans(false, "android"), false);
});

test("web and Android show plans only when subscriptions are switched on", () => {
  assert.equal(showPaidPlans(true, null), true);
  assert.equal(showPaidPlans(true, "android"), true);
});
