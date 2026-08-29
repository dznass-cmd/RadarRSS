import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dznasscmd.radarrss',
  appName: 'Radar RSS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a0b0e',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0b0e',
      overlaysWebView: false,
    },
  },
};

export default config;
