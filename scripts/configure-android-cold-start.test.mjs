import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coldStartActivity } from './configure-android-cold-start.mjs';
import { secureActivity } from './configure-android-screen-security.mjs';

test('cold launches ignore the saved page and start on the home page', () => {
  const source = 'package com.nooryaa.app;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity {}';
  const patched = coldStartActivity(source);
  assert.ok(patched.includes('super.onCreate(null)'));
  assert.equal(coldStartActivity(patched), patched);
});

test('an existing activity setup keeps its code but drops the saved state', () => {
  const source = 'public class MainActivity extends BridgeActivity { @Override public void onCreate(Bundle state) { super.onCreate(state); keepExistingSetup(); } }';
  const patched = coldStartActivity(source);
  assert.ok(patched.includes('super.onCreate(null)'));
  assert.ok(patched.includes('keepExistingSetup();'));
  assert.equal((patched.match(/void onCreate/g) ?? []).length, 1);
});

test('combines with screen protection in any order', () => {
  const source = 'public class MainActivity extends BridgeActivity {}';
  const secureFirst = coldStartActivity(secureActivity(source));
  const coldFirst = secureActivity(coldStartActivity(source));
  for (const result of [secureFirst, coldFirst]) {
    assert.ok(result.includes('super.onCreate(null)'));
    assert.ok(result.includes('FLAG_SECURE'));
    assert.equal((result.match(/void onCreate/g) ?? []).length, 1);
  }
});

test('unexpected activity templates stop the build rather than omit the fix', () => {
  assert.throws(() => coldStartActivity('class OtherActivity {}'), /not applied/);
});

test('both Android workflows apply the cold start fix before building', () => {
  const yaml = readFileSync(new URL('../codemagic.yaml', import.meta.url), 'utf8');
  for (const name of ['nooryaa-android', 'nooryaa-android-release']) {
    const workflow = yaml.split(`  ${name}:`)[1]?.split(/\n  nooryaa-/)[0];
    assert.ok(workflow?.includes('node scripts/configure-android-cold-start.mjs'));
  }
});
