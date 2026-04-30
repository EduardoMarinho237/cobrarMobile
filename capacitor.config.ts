import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cobrarmobile.app',
  appName: 'Cobrar Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
