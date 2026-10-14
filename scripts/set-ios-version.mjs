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
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`)
  // Apple exige iOS 15 minimum pour les envois App Store Connect.
  .replace(/IPHONEOS_DEPLOYMENT_TARGET = [^;]+;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 15.0;');

if (!after.includes(`MARKETING_VERSION = ${version};`) || !after.includes(`CURRENT_PROJECT_VERSION = ${build};`)) {
  throw new Error(`iOS version ${version} (${build}) was not applied to the project.`);
}
if (!after.includes('IPHONEOS_DEPLOYMENT_TARGET = 15.0;')) {
  throw new Error('iOS deployment target 15.0 was not applied to the project.');
}
if (after === before && !before.includes(`MARKETING_VERSION = ${version};`)) {
  throw new Error('No version field found in the iOS project.');
}

writeFileSync(project, after);

// Même exigence côté dépendances (CocoaPods) : sans cela, la compilation
// signale un décalage entre l'app (iOS 15) et ses modules (iOS 13).
const podfile = 'ios/App/Podfile';
if (existsSync(podfile)) {
  const podBefore = readFileSync(podfile, 'utf8');
  const podAfter = podBefore.replace(/platform :ios, '[^']+'/, "platform :ios, '15.0'");
  if (podAfter !== podBefore) {
    writeFileSync(podfile, podAfter);
  }
}

console.log(`iOS version set to ${version} (build ${build}), deployment target 15.0.`);
