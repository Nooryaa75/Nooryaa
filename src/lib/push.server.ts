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

/**
 * Envoie une notification push mobile à tous les appareils d'un membre.
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

  const { data: tokens } = await supabaseAdmin
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);
  if (!tokens || tokens.length === 0) return;

  const token = await accessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  for (const row of tokens) {
    try {
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
            android: { priority: "HIGH" },
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        // Jeton périmé (app désinstallée, etc.) : on le supprime au lieu de réessayer.
        if (res.status === 404 || (res.status === 400 && text.includes("UNREGISTERED"))) {
          await supabaseAdmin.from("push_tokens").delete().eq("token", row.token);
        } else {
          console.error(`FCM send failed [${res.status}]: ${text}`);
        }
      }
    } catch (e) {
      console.error("FCM send exception", e);
    }
  }
}
