import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { secureActivity } from './configure-android-screen-security.mjs';

const flag = 'getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);';
test('Android blocks capture from activity creation, including cold launches', () => {
  const source = 'package com.nooryaa.app;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity {}';
  const secured = secureActivity(source);
  assert.ok(secured.includes(flag));
  assert.ok(secured.indexOf(flag) < secured.indexOf('super.onCreate(savedInstanceState)'));
  assert.equal(secureActivity(secured), secured);
});
test('existing activity setup is preserved with protection', () => {
  const source = 'public class MainActivity extends BridgeActivity { @Override public void onCreate(Bundle state) { super.onCreate(state); keepExistingSetup(); } }';
  const secured = secureActivity(source);
  assert.ok(secured.includes(flag));
  assert.ok(secured.includes('keepExistingSetup();'));
  assert.equal((secured.match(/void onCreate/g) ?? []).length, 1);
});
test('unexpected activity templates stop the build rather than omit protection', () => {
  assert.throws(() => secureActivity('class OtherActivity {}'), /not applied/);
});
test('both Android workflows apply protection before building', () => {
  const yaml = readFileSync(new URL('../codemagic.yaml', import.meta.url), 'utf8');
  for (const name of ['nooryaa-android', 'nooryaa-android-release']) {
    const workflow = yaml.split(`  ${name}:`)[1]?.split(/\n  nooryaa-/)[0];
    assert.ok(workflow?.includes('node scripts/configure-android-screen-security.mjs'));
    assert.ok(workflow?.includes('versionCode 21'));
    assert.ok(workflow?.includes('versionName "1.0.18"'));
  }
});