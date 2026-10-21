import { test } from "node:test";
import assert from "node:assert/strict";
import { appBrowser, IOS_APP_OPEN_URL } from "./open-in-app";

test("iPhone browser can return to the installed app", () => {
  assert.equal(appBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", false), "ios");
  assert.equal(IOS_APP_OPEN_URL, "nooryaa://open");
});
test("native Apple and Android onboarding never show the return link", () => {
  assert.equal(appBrowser("iPhone", true, "ios"), null);
  assert.equal(appBrowser("Android", false, "android"), null);
  assert.equal(appBrowser("iPhone", false, "ios"), null);
});
test("Android browser retains the return link", () => {
  assert.equal(appBrowser("Mozilla/5.0 Android", false), "android");
});
test("iPad desktop mode is recognized without targeting desktop Macs", () => {
  assert.equal(appBrowser("Mozilla/5.0 Macintosh", false, "web", 5), "ios");
  assert.equal(appBrowser("Mozilla/5.0 Macintosh", false, "web", 0), null);
});