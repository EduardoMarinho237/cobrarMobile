import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cobrarmobile.app',
  appName: 'Cobrar Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    allowNavigation: ['187.127.30.189']
  }
};

export default config;
