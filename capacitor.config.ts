import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delivery.restaurant',
  appName: 'Restaurant Admin',
  webDir: 'www',
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
