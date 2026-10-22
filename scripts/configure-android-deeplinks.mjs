// Ajoute le lien profond nooryaa:// à l'activité principale Android.
// Permet aux liens des emails (vérification, etc.) d'ouvrir l'application
// au lieu du navigateur, via une URL intent:// côté site.
import { readFileSync, writeFileSync } from "node:fs";

const path = "android/app/src/main/AndroidManifest.xml";
let xml = readFileSync(path, "utf8");

const intentFilter = `
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="nooryaa" android:host="open" />
        </intent-filter>
    </activity>`;

if (!xml.includes("</activity>")) {
  console.error("Balise </activity> introuvable dans AndroidManifest.xml");
  process.exit(1);
}

if (!xml.includes('android:scheme="nooryaa"')) {
  xml = xml.replace("</activity>", intentFilter);
}

const appLinkFilter = `
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" android:host="app.nooryaa.com" android:path="/verification-email" />
        </intent-filter>
    </activity>`;
if (!xml.includes('android:host="app.nooryaa.com" android:path="/verification-email"')) {
  xml = xml.replace("</activity>", appLinkFilter);
}
writeFileSync(path, xml);

const check = readFileSync(path, "utf8");
if (!check.includes('android:scheme="nooryaa"') || !check.includes('android:autoVerify="true"') || !check.includes('android:host="app.nooryaa.com" android:path="/verification-email"')) {
  console.error("Lien profond non appliqué");
  process.exit(1);
}
console.log("Liens nooryaa://open et HTTPS de vérification configurés.");
