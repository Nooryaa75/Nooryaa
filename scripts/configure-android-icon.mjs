import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const resources = 'android/app/src/main/res';
if (!existsSync(resources)) throw new Error('Generate the Android project before configuring its icon.');

// Remove template icons, including newer adaptive overrides, before installing ours.
for (const directory of readdirSync(resources)) {
  if (!directory.startsWith('mipmap-')) continue;
  for (const file of readdirSync(join(resources, directory))) {
    if (/^ic_launcher(?:_round|_foreground|_background)?\.(png|xml|webp)$/.test(file)) {
      rmSync(join(resources, directory, file));
    }
  }
}
cpSync('android-assets/ic_launcher', resources, { recursive: true });

const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
if (!manifest.includes('android:icon="@mipmap/ic_launcher"')) {
  throw new Error('Android manifest does not reference the Nooryaa launcher icon.');
}
for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
    if (!existsSync(join(resources, `mipmap-${density}`, `${name}.png`))) {
      throw new Error(`Missing launcher resource: ${density}/${name}`);
    }
  }
}
console.log('Nooryaa launcher icon installed and verified.');