import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nooryaa.app',
  appName: 'Nooryaa',
  webDir: 'www',
  // Google refuse la connexion dans les vues intégrées (« wv ») : on présente
  // un navigateur mobile standard pour que la connexion reste dans l'appli.
  overrideUserAgent:
    'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
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
