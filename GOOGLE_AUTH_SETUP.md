# Google Auth Setup for Android

This guide will help you set up Google Authentication for the Restaurant Admin app on Android.

## Prerequisites

1. Google Cloud Console project
2. Android Studio (for building the app)
3. Google Services configuration

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sign-In API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sign-In API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Android" as application type
4. Fill in the details:
   - Package name: `com.delivery.restaurant`
   - SHA-1 certificate fingerprint (see step 3)
5. Click "Create"
6. Copy the Client ID

## Step 3: Get SHA-1 Certificate Fingerprint

### For Debug Build:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### For Release Build:
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

## Step 4: Update Configuration Files

### 1. Update Capacitor Config
Edit `capacitor.config.ts`:
```typescript
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
    forceCodeForRefreshToken: true
  }
}
```

### 2. Update Android Configuration
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="server_client_id">YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com</string>
</resources>
```

## Step 5: Build and Test

1. Build the app:
```bash
npm run build
npx cap sync android
```

2. Open in Android Studio:
```bash
npx cap open android
```

3. Run the app on a device or emulator

## Troubleshooting

### Common Issues:

1. **"Google Sign-In failed"**
   - Check that the Client ID matches in both `capacitor.config.ts` and `strings.xml`
   - Verify the package name matches your app's package name
   - Ensure the SHA-1 fingerprint is correct

2. **"Network error"**
   - Check internet connection
   - Verify Google Play Services is installed and updated

3. **"Invalid client"**
   - Double-check the Client ID format
   - Ensure the OAuth 2.0 client is configured for Android

### Testing:

- The app will fall back to a demo login if Google Auth fails
- Check the console logs for detailed error messages
- Test on both debug and release builds

## Security Notes

- Never commit your actual Client ID to version control
- Use environment variables for production builds
- Keep your keystore files secure
- Regularly rotate your OAuth credentials

## Demo Mode

If Google Auth is not configured, the app will automatically fall back to a demo login with these credentials:
- Email: demo@restaurant.com
- Name: Demo Restaurant Owner
- This allows testing the app without Google Auth setup 