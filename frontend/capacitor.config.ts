import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.physiotwin.app',
  appName: 'PhysioTwin',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    CapacitorHealth: {
      healthConnect: {
        permissions: [
          'READ_HEART_RATE',
          'READ_OXYGEN_SATURATION',
          'READ_SLEEP',
          'READ_STEPS'
        ]
      }
    }
  }
};

export default config;
