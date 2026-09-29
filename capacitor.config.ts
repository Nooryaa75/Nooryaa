import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nooryaa.app',
  appName: 'Nooryaa',
  webDir: 'www',
  server: {
    // L'application affiche le site publié : toutes les mises à jour du site
    // apparaissent dans l'app sans republication sur le store.
    url: 'https://app.nooryaa.com',
    androidScheme: 'https',
  },
};

export default config;
