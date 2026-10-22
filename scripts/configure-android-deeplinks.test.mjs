import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

test("generated Android manifest has verified HTTPS confirmation links and preserves custom links", () => {
  const cwd = mkdtempSync(join(tmpdir(), "nooryaa-links-"));
  try {
    const folder = join(cwd, "android/app/src/main");
    mkdirSync(folder, { recursive: true });
    const manifest = join(folder, "AndroidManifest.xml");
    writeFileSync(manifest, '<manifest><application><activity android:name=".MainActivity"></activity></application></manifest>');
    const script = resolve("scripts/configure-android-deeplinks.mjs");
    execFileSync(process.execPath, [script], { cwd });
    const result = readFileSync(manifest, "utf8");
    assert.ok(result.includes('android:autoVerify="true"'));
    assert.ok(result.includes('android:scheme="https" android:host="app.nooryaa.com" android:path="/verification-email"'));
    assert.ok(result.includes('android:scheme="nooryaa" android:host="open"'));
    execFileSync(process.execPath, [script], { cwd });
    assert.equal(readFileSync(manifest, "utf8"), result);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("domain association uses the supplied Play signing SHA-256", () => {
  const entries = JSON.parse(readFileSync("public/.well-known/assetlinks.json", "utf8"));
  assert.equal(entries[0].target.package_name, "com.nooryaa.app");
  assert.deepEqual(entries[0].target.sha256_cert_fingerprints, ["C3:61:A0:DA:8C:3D:E4:CD:E7:05:3F:B9:97:00:95:0C:75:71:BF:32:DB:D1:3E:2B:37:1A:A2:32:4D:D4:28:FE"]);
});