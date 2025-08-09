import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delivery.restaurant',
  appName: 'Restaurant Admin',
  webDir: 'www',
  server: {
    allowNavigation: [
      'http://192.168.1.7:3000',
      'http://192.168.1.3:3000'
    ],
    cleartext: true,
    androidScheme: 'http',
    iosScheme: 'http'
  },
  plugins: {
    SocialLogin: {
      google: {
        clientId: '165799531253-rfm5v23nv4i8igk97cno4s33bp2qrivp.apps.googleusercontent.com',
        serverClientId: '165799531253-rfm5v23nv4i8igk97cno4s33bp2qrivp.apps.googleusercontent.com'
      }
    }
  }
};

export default config;
