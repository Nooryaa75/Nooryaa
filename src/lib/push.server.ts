import { supabaseAdmin } from "@/integrations/supabase/client.server";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri: string;
  project_id: string;
};

function b64urlFromString(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlFromBuffer(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Échange la clé de compte de service contre un jeton d'accès Google (valable 1 h). */
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    `${b64urlFromString(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.` +
    b64urlFromString(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: sa.token_uri,
        iat: now,
        exp: now + 3600,
      }),
    );
  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");
  const keyData = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64urlFromBuffer(signature)}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Google token error [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google token response without access_token");
  return json.access_token;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(sa: ServiceAccount) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const value = await getAccessToken(sa);
  cachedToken = { value, expiresAt: Date.now() + 55 * 60_000 };
  return value;
}

/* ============ iPhone : envoi direct via le service de notifications Apple ============ */

/** Identifiant de l'application sur l'App Store (codemagic.yaml / capacitor.config.ts). */
const IOS_BUNDLE_ID = "com.nooryaa.app";

type ApnsCredentials = { key: string; keyId: string; teamId: string };

function apnsCredentials(): ApnsCredentials | null {
  const key = process.env["APNS_P8_KEY"];
  const keyId = process.env["APNS_KEY_ID"];
  const teamId = process.env["APNS_TEAM_ID"];
  if (!key || !keyId || !teamId) return null;
  return { key, keyId, teamId };
}

let cachedApnsJwt: { value: string; expiresAt: number } | null = null;

/** Fabrique le jeton de sécurité Apple (valable 1 h, signé avec la clé .p8). */
async function apnsJwt(creds: ApnsCredentials): Promise<string> {
  if (cachedApnsJwt && cachedApnsJwt.expiresAt > Date.now() + 60_000) return cachedApnsJwt.value;
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    `${b64urlFromString(JSON.stringify({ alg: "ES256", kid: creds.keyId }))}.` +
    b64urlFromString(JSON.stringify({ iss: creds.teamId, iat: now }));

  const pem = creds.key.replace(/-----BEGIN (?:PRIVATE|EC PRIVATE) KEY-----/g, "")
    .replace(/-----END (?:PRIVATE|EC PRIVATE) KEY-----/g, "")
    .replace(/\s+/g, "");
  const keyData = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64urlFromBuffer(signature)}`;
  cachedApnsJwt = { value: jwt, expiresAt: Date.now() + 55 * 60_000 };
  return jwt;
}

/** Envoie une notification à un iPhone. Renvoie true si Apple l'a acceptée. */
async function sendApns(
  deviceToken: string,
  title: string,
  body: string | null,
  path: string,
  badge: number,
): Promise<boolean> {
  const creds = apnsCredentials();
  if (!creds) return false;
  const jwt = await apnsJwt(creds);
  try {
    const res = await fetch(`https://api.push.apple.com/3/device/${deviceToken}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": IOS_BUNDLE_ID,
        "apns-push-type": "alert",
        "apns-priority": "10",
      },
      body: JSON.stringify({
        aps: {
          alert: { title, body: body ?? "" },
          sound: "default",
          badge,
          "interruption-level": "active",
        },
        path,
      }),
    });
    if (res.ok) return true;
    const text = await res.text();
    // Jeton périmé ou téléphone qui n'a plus l'appli : on le supprime.
    if (res.status === 410 || (res.status === 400 && /BadDeviceToken|Unregistered/i.test(text))) {
      await (supabaseAdmin.from("push_tokens" as never) as any).delete().eq("token", deviceToken);
    } else {
      console.error(`APNs send failed [${res.status}]: ${text}`);
    }
  } catch (e) {
    console.error("APNs send exception", e);
  }
  return false;
}

/**
 * Envoie une notification push mobile à tous les appareils d'un membre.
 * Android passe par Google ; iPhone passe directement par Apple (clé .p8).
 * Silencieuse en cas d'erreur : ne bloque jamais l'action de l'utilisateur.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string | null,
  path: string,
): Promise<void> {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) return;
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw) as ServiceAccount;
  } catch {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON invalide");
    return;
  }

  // Types automatiques pas encore régénérés pour cette table récente.
  const { data: tokens } = await (supabaseAdmin.from("push_tokens" as never) as any)
    .select("token, platform")
    .eq("user_id", userId);
  if (!tokens || tokens.length === 0) return;

  const useApns = !!apnsCredentials();
  const token = await accessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  // Pastille sur l'icône de l'appli : messages non lus + notifications non lues.
  const [unreadNotifs, unreadMessages] = await Promise.all([
    (supabaseAdmin.from("notifications" as never) as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
    (supabaseAdmin.from("messages" as never) as any)
      .select("id", { count: "exact", head: true })
      .eq("receiver", userId)
      .is("read_at", null)
      .is("deleted_at", null),
  ]);
  const badge = (unreadNotifs.count ?? 0) + (unreadMessages.count ?? 0);

  for (const row of tokens) {
    try {
      // iPhone : envoi direct à Apple si la clé est configurée.
      if (row.platform === "ios" && useApns) {
        const ok = await sendApns(row.token, title, body, path, badge);
        if (ok) console.log(`APNs push sent to ${userId}`);
        continue;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: { title, body: body ?? "" },
            data: { path },
            android: { priority: "HIGH", notification: { channel_id: "nooryaa", sound: "default" } },
            // iPhone : sans ces réglages la notification arrive en silence.
            apns: {
              payload: { aps: { sound: "default", badge, "interruption-level": "active" } },
            },
          },
        }),
      });
      if (res.ok) {
        console.log(`FCM push sent to ${userId}`);
      } else {
        const text = await res.text();
        // Jeton périmé (app désinstallée, etc.) : on le supprime au lieu de réessayer.
        if (res.status === 404 || (res.status === 400 && text.includes("UNREGISTERED"))) {
          await (supabaseAdmin.from("push_tokens" as never) as any).delete().eq("token", row.token);
        } else {
          console.error(`FCM send failed [${res.status}]: ${text}`);
        }
      }
    } catch (e) {
      console.error("FCM send exception", e);
    }
  }
}
