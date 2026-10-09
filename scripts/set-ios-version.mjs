import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Numéros de version de l'app iPhone, à passer en paramètres :
//   node scripts/set-ios-version.mjs 1.0.0 1
// Le projet iOS est régénéré à chaque build : sans cette étape, il resterait
// bloqué sur la version 1.0 (build 1) du modèle Capacitor.
const [version, build] = process.argv.slice(2);
if (!/^\d+\.\d+(\.\d+)?$/.test(version ?? '') || !/^\d+$/.test(build ?? '')) {
  throw new Error('Usage: node scripts/set-ios-version.mjs <version> <build>');
}

const project = 'ios/App/App.xcodeproj/project.pbxproj';
if (!existsSync(project)) {
  throw new Error('Generate the iOS project before setting its version.');
}

const before = readFileSync(project, 'utf8');
const after = before
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);

if (!after.includes(`MARKETING_VERSION = ${version};`) || !after.includes(`CURRENT_PROJECT_VERSION = ${build};`)) {
  throw new Error(`iOS version ${version} (${build}) was not applied to the project.`);
}
if (after === before && !before.includes(`MARKETING_VERSION = ${version};`)) {
  throw new Error('No version field found in the iOS project.');
}

writeFileSync(project, after);
console.log(`iOS version set to ${version} (build ${build}).`);
