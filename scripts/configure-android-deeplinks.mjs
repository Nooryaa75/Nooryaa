// Ajoute le lien profond nooryaa:// à l'activité principale Android.
// Permet aux liens des emails (vérification, etc.) d'ouvrir l'application
// au lieu du navigateur, via une URL intent:// côté site.
import { readFileSync, writeFileSync } from "node:fs";

const path = "android/app/src/main/AndroidManifest.xml";
let xml = readFileSync(path, "utf8");

if (xml.includes('android:scheme="nooryaa"')) {
  console.log("Lien profond nooryaa:// déjà présent.");
  process.exit(0);
}

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

xml = xml.replace("</activity>", intentFilter);
writeFileSync(path, xml);

const check = readFileSync(path, "utf8");
if (!check.includes('android:scheme="nooryaa"')) {
  console.error("Lien profond non appliqué");
  process.exit(1);
}
console.log("Lien profond nooryaa://open ajouté à MainActivity.");
