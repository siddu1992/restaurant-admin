# Google Sign-In Setup for Android

## Error Analysis
The error you're seeing (`code: "10", message: "Something went wrong"`) indicates that the Google Sign-In configuration is incomplete for Android.

## Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sign-In API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sign-In API"
   - Click "Enable"

### 2. Configure OAuth 2.0
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure for Android:
   - Application type: Android
   - Package name: `com.delivery.restaurant`
   - SHA-1 certificate fingerprint: (see step 3)

### 3. Get SHA-1 Fingerprint
Run this command in your project directory:
```bash
cd restaurant-admin
npx cap run android --target=debug
```

Or manually:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 4. Download google-services.json
1. In Google Cloud Console, go to "Project Settings"
2. Click "Add app" > "Android"
3. Enter package name: `com.delivery.restaurant`
4. Enter SHA-1 fingerprint from step 3
5. Download `google-services.json`
6. Place it in: `restaurant-admin/android/app/google-services.json`

### 5. Update Capacitor Config
Replace the client ID in `capacitor.config.ts`:
```typescript
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // Use Android client ID
    forceCodeForRefreshToken: true
  }
}
```

### 6. Rebuild the App
```bash
cd restaurant-admin
npm run build
npx cap sync android
npx cap run android
```

## Common Issues & Solutions

### Error Code 10: "Something went wrong"
- **Cause**: Missing or incorrect `google-services.json`
- **Solution**: Ensure file is in correct location and has valid configuration

### Error Code 12501: "Sign-in was cancelled"
- **Cause**: User cancelled the sign-in
- **Solution**: This is normal user behavior

### Error Code 7: "Network error"
- **Cause**: No internet connection or Google Play Services issues
- **Solution**: Check internet connection and update Google Play Services

### "Google Play Services not available"
- **Cause**: Device doesn't have Google Play Services
- **Solution**: Test on device with Google Play Services installed

## Testing
1. Use a physical Android device (not emulator)
2. Ensure device has Google Play Services
3. Sign in with a Google account that has access to the app

## Debug Mode
The app now includes better error handling and will show specific error messages for different failure types.

## Fallback
If Google Sign-In fails, the app will fall back to a demo login for testing purposes. 