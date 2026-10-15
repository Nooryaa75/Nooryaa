import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Active les notifications push sur iPhone. Le projet iOS est régénéré à
// chaque build : sans cette étape, l'app n'a pas le droit de s'inscrire
// auprès d'Apple pour recevoir des notifications.
const project = 'ios/App/App.xcodeproj/project.pbxproj';
const plist = 'ios/App/App/Info.plist';
const entitlements = 'ios/App/App/App.entitlements';

if (!existsSync(project) || !existsSync(plist)) {
  throw new Error('Generate the iOS project before configuring push notifications.');
}

writeFileSync(
  entitlements,
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>$(APS_ENVIRONMENT)</string>
</dict>
</plist>
`,
);

// L'app doit pouvoir se réveiller en arrière-plan pour afficher une notification.
let info = readFileSync(plist, 'utf8');
if (!info.includes('UIBackgroundModes')) {
  info = info.replace(
    /\n<\/dict>\n<\/plist>/,
    `\n\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>remote-notification</string>\n\t</array>\n</dict>\n</plist>`,
  );
  if (!info.includes('UIBackgroundModes')) throw new Error('Info.plist could not be updated.');
  writeFileSync(plist, info);
}

// iOS ferme l'app instantanément si elle demande la position, l'appareil
// photo, le micro ou les photos sans phrase d'explication déclarée.
info = readFileSync(plist, 'utf8');
const usages = {
  NSLocationWhenInUseUsageDescription: 'Nooryaa utilise votre position pour vous proposer des profils proches de vous.',
  NSCameraUsageDescription: "Nooryaa utilise l'appareil photo pour vos photos de profil et le selfie de vérification.",
  NSMicrophoneUsageDescription: 'Nooryaa utilise le micro pour enregistrer vos messages vocaux.',
  NSPhotoLibraryUsageDescription: 'Nooryaa accède à vos photos pour choisir vos photos de profil.',
  NSPhotoLibraryAddUsageDescription: 'Nooryaa peut enregistrer des photos dans votre galerie.',
};
for (const [key, text] of Object.entries(usages)) {
  if (info.includes(`<key>${key}</key>`)) continue;
  info = info.replace(/\n<\/dict>\n<\/plist>/, `\n\t<key>${key}</key>\n\t<string>${text}</string>\n</dict>\n</plist>`);
  if (!info.includes(`<key>${key}</key>`)) throw new Error(`Info.plist: ${key} could not be added.`);
}
writeFileSync(plist, info);

// Chaque configuration de compilation doit connaître le fichier
// d'autorisations et l'environnement de notification correspondant.
const lines = readFileSync(project, 'utf8').split('\n');
const environments = { Debug: 'development', Release: 'production' };
let injected = 0;

for (const [name, environment] of Object.entries(environments)) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== `name = ${name};`) continue;
    let end = i - 1;
    while (end >= 0 && lines[end].trim() !== '};') end--;
    if (end < 0) continue;
    const indent = `${lines[end].match(/^\s*/)[0]}\t`;
    lines.splice(
      end,
      0,
      `${indent}CODE_SIGN_ENTITLEMENTS = App/App.entitlements;`,
      `${indent}APS_ENVIRONMENT = ${environment};`,
    );
    injected++;
    // Les deux lignes insérées décalent la ligne courante : on repart après elle.
    i += 2;
  }
}

if (injected < 2) {
  throw new Error(`Expected to configure iOS build settings, configured ${injected}.`);
}

const result = lines.join('\n');
if (!result.includes('APS_ENVIRONMENT = development;') || !result.includes('APS_ENVIRONMENT = production;')) {
  throw new Error('iOS push environments were not applied to the project.');
}
writeFileSync(project, result);

// Sans ces deux fonctions, iOS donne bien le jeton à l'app mais Capacitor
// ne le reçoit jamais : le téléphone n'est donc jamais enregistré.
const delegate = 'ios/App/App/AppDelegate.swift';
if (!existsSync(delegate)) throw new Error('AppDelegate.swift not found.');
let swift = readFileSync(delegate, 'utf8');
if (!swift.includes('capacitorDidRegisterForRemoteNotifications')) {
  const idx = swift.lastIndexOf('}');
  swift = `${swift.slice(0, idx)}
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
${swift.slice(idx)}`;
  writeFileSync(delegate, swift);
}
console.log(`Nooryaa iOS push notifications configured (${injected} build settings).`);
