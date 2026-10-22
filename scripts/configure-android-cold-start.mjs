// Force l'application Android à toujours démarrer sur la page d'accueil.
// Par défaut, Android restaure la dernière page visitée quand l'application
// a été fermée : un membre qui s'arrêtait sur l'inscription y retombait au
// prochain lancement, sans jamais revoir « Je m'inscris / Je me connecte ».
// En appelant super.onCreate(null), l'état sauvegardé est ignoré au
// démarrage à froid ; la simple mise en arrière-plan n'est pas affectée.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function coldStartActivity(source) {
  const declaration = /public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{/;
  if (!declaration.test(source)) throw new Error('Unsupported MainActivity: cold start not applied.');
  const superCall = /super\.onCreate\(\s*[^)]*\s*\)/;
  if (superCall.test(source)) {
    return source.replace(superCall, 'super.onCreate(null)');
  }
  if (/\bonCreate\s*\(/.test(source)) throw new Error('Unsupported onCreate: cold start not applied.');
  return source.replace(declaration, `$&
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(null);
  }
`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = 'android/app/src/main/java/com/nooryaa/app/MainActivity.java';
  const patched = coldStartActivity(readFileSync(path, 'utf8'));
  writeFileSync(path, patched);
  if (!readFileSync(path, 'utf8').includes('super.onCreate(null)')) {
    throw new Error('Android cold start was not applied.');
  }
  console.log('Nooryaa Android: every cold launch starts on the home page.');
}
