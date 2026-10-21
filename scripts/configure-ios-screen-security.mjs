import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Le projet iOS est régénéré à chaque build : on y injecte la détection
// d'enregistrement d'écran dans le contrôleur généré par Capacitor.
export const MARKER = 'screenCapturedChanged';

// Modifie la source de MainViewController : enregistre l'observateur
// UIScreen.capturedDidChangeNotification dans viewDidLoad et ajoute le
// gestionnaire qui prévient la WebView. Idempotent, échoue (et arrête le
// build) si le modèle généré ne correspond pas.
export function secureMainController(source) {
  if (source.includes(MARKER)) return source;
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
    '        DispatchQueue.main.async { self.screenCapturedChanged() }';
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

const path = 'ios/App/App/MainViewController.swift';
if (!existsSync(path)) {
  throw new Error('Generate the iOS project before configuring screen security.');
}
const secured = secureMainController(readFileSync(path, 'utf8'));
writeFileSync(path, secured);
if (!secured.includes(MARKER)) {
  throw new Error('Nooryaa iOS screen security was not applied.');
}
console.log('Nooryaa iOS screen security configured.');
