@echo off
echo 🔧 Fixing Android Version Compatibility Issues...

echo.
echo 📝 Updating plugin build.gradle...
powershell -Command "(Get-Content 'android\capacitor-cordova-android-plugins\build.gradle') -replace 'classpath ''com\.android\.tools\.build:gradle:8\.7\.2''', 'classpath ''com.android.tools.build:gradle:8.1.4''' | Set-Content 'android\capacitor-cordova-android-plugins\build.gradle'"
powershell -Command "(Get-Content 'android\capacitor-cordova-android-plugins\build.gradle') -replace 'sourceCompatibility JavaVersion\.VERSION_21', 'sourceCompatibility JavaVersion.VERSION_17' | Set-Content 'android\capacitor-cordova-android-plugins\build.gradle'"
powershell -Command "(Get-Content 'android\capacitor-cordova-android-plugins\build.gradle') -replace 'targetCompatibility JavaVersion\.VERSION_21', 'targetCompatibility JavaVersion.VERSION_17' | Set-Content 'android\capacitor-cordova-android-plugins\build.gradle'"

echo.
echo 🔄 Syncing project...
npx cap sync android

echo.
echo ✅ Fixed! You can now open Android Studio.
echo 📱 Run: npx cap open android
pause 