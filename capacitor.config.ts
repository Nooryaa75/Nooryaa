import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nooryaa.app',
  appName: 'Nooryaa',
  webDir: 'www',
  // Google refuse la connexion dans les vues intégrées (« wv ») : on présente
  // un navigateur mobile standard pour que la connexion reste dans l'appli.
  // Google refuse la connexion dans les vues intégrées : on présente un
  // navigateur mobile standard pour que la connexion reste dans l'appli.
  android: {
    overrideUserAgent:
      'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  ios: {
    overrideUserAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  },
  // Connexion Google native (Android) : les comptes Google du téléphone sont
  // proposés directement dans l'appli. serverClientId = clé « Application
  // Web » de Google Cloud (projet nooryaa-s-firebase).
  plugins: {
    // Affiche aussi les notifications quand l'appli est ouverte (prochain build).
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId:
        '516335009400-f78hfgk941t6bjmis93ne0mn6863dci9.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
  server: {
    // L'application affiche le site publié : toutes les mises à jour du site
    // apparaissent dans l'app sans republication sur le store.
    url: 'https://app.nooryaa.com',
    androidScheme: 'https',
    // Pages de connexion Google/Apple ouvertes DANS l'appli (sinon le
    // téléphone les ouvre dans le navigateur et l'utilisateur y reste).
    allowNavigation: [
      'app.nooryaa.com',
      'nooryaa.lovable.app',
      'oauth.lovable.app',
      '*.lovable.app',
      '*.supabase.co',
      'accounts.google.com',
      '*.google.com',
      'appleid.apple.com',
    ],
  },
};

export default config;
