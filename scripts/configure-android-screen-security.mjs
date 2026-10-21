import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function secureActivity(source) {
  const flag = 'android.view.WindowManager.LayoutParams.FLAG_SECURE';
  const call = `getWindow().addFlags(${flag});`;
  if (source.includes(call)) return source;
  const declaration = /public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{/;
  if (!declaration.test(source)) throw new Error('Unsupported MainActivity: secure window not applied.');
  const existingOnCreate = /(?:public|protected)\s+void\s+onCreate\s*\(\s*(?:android\.os\.)?Bundle\s+\w+\s*\)\s*\{/;
  if (existingOnCreate.test(source)) return source.replace(existingOnCreate, `$&\n    ${call}`);
  if (/\bonCreate\s*\(/.test(source)) throw new Error('Unsupported onCreate: secure window not applied.');
  return source.replace(declaration, `$&
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    ${call}
    super.onCreate(savedInstanceState);
  }
`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = 'android/app/src/main/java/com/nooryaa/app/MainActivity.java';
  const secured = secureActivity(readFileSync(path, 'utf8'));
  writeFileSync(path, secured);
  if (!readFileSync(path, 'utf8').includes('getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);')) {
    throw new Error('Android screen security was not applied.');
  }
  console.log('Nooryaa Android: screenshots and screen recording restricted by FLAG_SECURE.');
}