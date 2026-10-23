import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Le projet iOS est régénéré à chaque build : on y injecte la détection
// d'enregistrement d'écran dans le contrôleur généré par Capacitor.
export const MARKER = 'screenCapturedChanged';

// Modifie la source de MainViewController : enregistre l'observateur
// UIScreen.capturedDidChangeNotification dans viewDidLoad et ajoute le
// gestionnaire qui prévient la WebView. Idempotent, échoue (et arrête le
// build) si le modèle généré ne correspond pas.
export function secureMainController(source) {
  if (/func\s+screenCapturedChanged\s*\(/.test(source)) return source;
  if (!/class\s+MainViewController\s*:\s*CAPBridgeViewController/.test(source)) {
    throw new Error('Nooryaa iOS screen security was not applied: unexpected MainViewController template.');
  }
  const loader = source.match(/override\s+func\s+viewDidLoad\s*\(\)\s*\{/);
  if (!loader) {
    throw new Error('Nooryaa iOS screen security was not applied: viewDidLoad not found.');
  }
  const observer = `${loader[0]}\n` +
    '        // Nooryaa screen security: prévient la WebView quand l\'écran est enregistré ou partagé\n' +
    '        NotificationCenter.default.addObserver(self, selector: #selector(screenCapturedChanged), name: UIScreen.capturedDidChangeNotification, object: nil)\n' +
    '        DispatchQueue.main.async { self.screenCapturedChanged() }\n';
  let out = source.replace(loader[0], observer);
  const handler = '\n' +
    '    // Nooryaa screen security\n' +
    '    @objc func screenCapturedChanged() {\n' +
    '        let captured = UIScreen.main.isCaptured\n' +
    '        guard let webView = self.bridge?.webView else { return }\n' +
    '        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent(\'nooryaa-screen-captured\', { detail: \\(captured) }))", completionHandler: nil)\n' +
    '    }\n';
  const last = out.lastIndexOf('}');
  if (last === -1) {
    throw new Error('Nooryaa iOS screen security was not applied: class body not found.');
  }
  return out.slice(0, last) + handler + out.slice(last);
}

// Capacitor 6 ne crée pas MainViewController.swift. La sous-classe est
// ajoutée au fichier AppDelegate déjà compilé, puis reliée au storyboard.
export function secureStoryboard(source) {
  const controller = source.match(/<viewController\b[^>]*customClass="(?:CAPBridgeViewController|MainViewController)"[^>]*>/);
  if (!controller) throw new Error('Nooryaa iOS screen security was not applied: unexpected storyboard template.');
  const tag = controller[0]
    .replace(/customClass="[^"]*"/, 'customClass="MainViewController"')
    .replace(/\s+customModule(?:Provider)?="[^"]*"/g, '')
    .replace(/\s*\/?>$/, ' customModule="App" customModuleProvider="target"/>');
  return source.replace(controller[0], tag);
}

export function configureScreenSecurity(root = 'ios/App/App') {
  const path = join(root, 'MainViewController.swift');
  const delegatePath = join(root, 'AppDelegate.swift');
  const storyboardPath = join(root, 'Base.lproj/Main.storyboard');
  if (!existsSync(delegatePath) || !existsSync(storyboardPath)) {
    throw new Error('Generate the iOS project before configuring screen security: AppDelegate.swift or Main.storyboard missing.');
  }
  // Validate both sources before writing so an unexpected template stops the build.
  const storyboard = secureStoryboard(readFileSync(storyboardPath, 'utf8'));
  if (existsSync(path)) {
    writeFileSync(path, secureMainController(readFileSync(path, 'utf8')));
  } else {
    let delegate = readFileSync(delegatePath, 'utf8');
    if (!/class\s+AppDelegate\s*:/.test(delegate)) {
      throw new Error('Nooryaa iOS screen security was not applied: unexpected AppDelegate template.');
    }
    if (!delegate.includes(MARKER)) {
      const controller = secureMainController([
        '@objc class MainViewController: CAPBridgeViewController {',
        '    override func viewDidLoad() { super.viewDidLoad() }',
        '    override func viewDidAppear(_ animated: Bool) {',
        '        super.viewDidAppear(animated)',
        '        screenCapturedChanged()',
        '    }',
        '}',
      ].join('\n'));
      delegate += `\n\n${controller}\n`;
    }
    writeFileSync(delegatePath, delegate);
  }
  writeFileSync(storyboardPath, storyboard);
}

function main() {
  configureScreenSecurity();
  console.log('Nooryaa iOS screen security configured.');
}

// Effets sur le projet uniquement quand le script est exécuté par Codemagic,
// pas quand ses fonctions sont importées par les tests.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
