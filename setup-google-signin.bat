@echo off
echo ========================================
echo Google Sign-In Setup Helper
echo ========================================
echo.

echo Step 1: Getting SHA-1 Fingerprint...
echo.

REM Try to get SHA-1 from debug keystore
if exist "%USERPROFILE%\.android\debug.keystore" (
    echo Found debug keystore, getting SHA-1...
    keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android | findstr "SHA1"
) else (
    echo Debug keystore not found. Creating one...
    keytool -genkey -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
    echo.
    echo Now getting SHA-1...
    keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android | findstr "SHA1"
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Copy the SHA-1 fingerprint above
echo 2. Go to: https://console.cloud.google.com/
echo 3. Create a new project or select existing
echo 4. Enable Google Sign-In API
echo 5. Go to Credentials > Create OAuth 2.0 Client ID
echo 6. Choose Android application type
echo 7. Package name: com.delivery.restaurant
echo 8. Paste the SHA-1 fingerprint
echo 9. Download google-services.json
echo 10. Place it in: android/app/google-services.json
echo.
echo ========================================
echo Current Status: Demo mode enabled
echo ========================================
echo The app will work with demo login until
echo you complete the Google Cloud Console setup.
echo.
pause 