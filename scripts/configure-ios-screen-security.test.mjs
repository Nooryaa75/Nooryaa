import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configureScreenSecurity, secureStoryboard, secureMainController } from './configure-ios-screen-security.mjs';

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
    assert.ok(workflow?.includes('set-ios-version.mjs 1.0.2 21'));
    assert.ok(workflow.indexOf('npx cap add ios') < workflow.indexOf('node scripts/configure-ios-screen-security.mjs'));
  }
});

const storyboard = '<document><viewController id="BYZ-38-t0r" customClass="CAPBridgeViewController" customModule="Capacitor" sceneMemberID="viewController"/></document>';

test('Capacitor 6 generated project is protected without a MainViewController file', () => {
  const root = mkdtempSync(join(tmpdir(), 'nooryaa-ios-security-'));
  try {
    mkdirSync(join(root, 'Base.lproj'));
    const delegate = 'import UIKit\nimport Capacitor\n@UIApplicationMain\nclass AppDelegate: UIResponder, UIApplicationDelegate { var window: UIWindow? }';
    writeFileSync(join(root, 'AppDelegate.swift'), delegate);
    writeFileSync(join(root, 'Base.lproj/Main.storyboard'), storyboard);
    configureScreenSecurity(root);
    const secured = readFileSync(join(root, 'AppDelegate.swift'), 'utf8');
    assert.ok(secured.startsWith(delegate));
    assert.ok(secured.includes(jsEvent));
    assert.ok(secured.includes('UIScreen.capturedDidChangeNotification'));
    assert.ok(secured.includes('override func viewDidAppear'));
    const linked = readFileSync(join(root, 'Base.lproj/Main.storyboard'), 'utf8');
    assert.ok(linked.includes('customClass="MainViewController"'));
    assert.ok(linked.includes('customModule="App" customModuleProvider="target"'));
    configureScreenSecurity(root);
    assert.equal(readFileSync(join(root, 'AppDelegate.swift'), 'utf8'), secured);
    assert.equal(readFileSync(join(root, 'Base.lproj/Main.storyboard'), 'utf8'), linked);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('unknown storyboard stops configuration rather than silently omit protection', () => {
  assert.throws(() => secureStoryboard('<viewController customClass="OtherController"/>'), /not applied/);
});
