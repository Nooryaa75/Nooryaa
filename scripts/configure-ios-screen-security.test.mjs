import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MARKER, secureMainController } from './configure-ios-screen-security.mjs';

const template = [
  'import UIKit',
  'import Capacitor',
  '',
  '@objc class MainViewController: CAPBridgeViewController {',
  '',
  '    override func viewDidLoad() {',
  '        super.viewDidLoad()',
  '    }',
  '}',
].join('\n');

const jsEvent = "window.dispatchEvent(new CustomEvent('nooryaa-screen-captured', { detail: \\(captured) }))";

test('iOS reports screen capture to the WebView, including cold launches', () => {
  const secured = secureMainController(template);
  assert.ok(secured.includes('UIScreen.capturedDidChangeNotification'));
  assert.ok(secured.includes(jsEvent));
  assert.ok(secured.indexOf('UIScreen.capturedDidChangeNotification') < secured.indexOf(jsEvent));
  assert.equal((secured.match(/func viewDidLoad/g) ?? []).length, 1);
  assert.equal(secureMainController(secured), secured);
});

test('existing controller setup is preserved with protection', () => {
  const source = 'class MainViewController: CAPBridgeViewController { override func viewDidLoad() { super.viewDidLoad(); keepExistingSetup(); } }';
  const secured = secureMainController(source);
  assert.ok(secured.includes('keepExistingSetup();'));
  assert.ok(secured.includes(jsEvent));
  assert.equal((secured.match(/func viewDidLoad/g) ?? []).length, 1);
});

test('unexpected controller templates stop the build rather than omit protection', () => {
  assert.throws(() => secureMainController('class OtherViewController {}'), /not applied/);
});

test('both iOS workflows apply protection and carry the next build', () => {
  const yaml = readFileSync(new URL('../codemagic.yaml', import.meta.url), 'utf8');
  for (const name of ['nooryaa-ios-check', 'nooryaa-ios-release']) {
    const workflow = yaml.split(`  ${name}:`)[1]?.split(/\n  nooryaa-/)[0];
    assert.ok(workflow?.includes('node scripts/configure-ios-screen-security.mjs'));
    assert.ok(workflow?.includes('set-ios-version.mjs 1.0.1 18'));
  }
});
