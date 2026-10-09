import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Le projet iOS est régénéré à chaque build : on y installe l'icône Nooryaa
// et on vérifie qu'elle est bien prise en compte avant de lancer Xcode.
const set = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
if (!existsSync(set)) {
  throw new Error('Generate the iOS project before configuring its icon.');
}

const target = join(set, 'AppIcon-1024.png');
copyFileSync('ios-assets/AppIcon-1024.png', target);

// L'icône du modèle Capacitor ne doit jamais rester dans le projet.
rmSync(join(set, 'AppIcon-512@2x.png'), { force: true });

writeFileSync(
  join(set, 'Contents.json'),
  `${JSON.stringify(
    {
      images: [{ filename: 'AppIcon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
      info: { author: 'xcode', version: 1 },
    },
    null,
    2,
  )}\n`,
);

// Contrôle : 1024×1024, sans canal alpha (l'App Store refuse la transparence).
const png = readFileSync(target);
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
const colorType = png[25];
if (width !== 1024 || height !== 1024) {
  throw new Error(`iOS icon must be 1024x1024, got ${width}x${height}.`);
}
if (colorType === 4 || colorType === 6) {
  throw new Error('iOS icon must not carry an alpha channel.');
}

const contents = JSON.parse(readFileSync(join(set, 'Contents.json'), 'utf8'));
if (!contents.images.some((image) => image.filename === 'AppIcon-1024.png')) {
  throw new Error('iOS icon is not referenced by Contents.json.');
}

console.log('Nooryaa iOS icon installed and verified.');
