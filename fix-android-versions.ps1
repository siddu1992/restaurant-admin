# Android Version Fix Script
# This script automatically fixes Java and AGP version compatibility issues

Write-Host "🔧 Fixing Android Version Compatibility Issues..." -ForegroundColor Yellow

# Function to replace text in a file
function Replace-InFile {
    param(
        [string]$FilePath,
        [string]$OldText,
        [string]$NewText,
        [string]$Description
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match [regex]::Escape($OldText)) {
            $content = $content -replace [regex]::Escape($OldText), $NewText
            Set-Content $FilePath $content -NoNewline
            Write-Host "✅ Fixed $Description in $FilePath" -ForegroundColor Green
        }
        else {
            Write-Host "ℹ️  $Description already correct in $FilePath" -ForegroundColor Blue
        }
    }
    else {
        Write-Host "❌ File not found: $FilePath" -ForegroundColor Red
    }
}

# Fix main build.gradle
Replace-InFile -FilePath "android/build.gradle" -OldText "classpath 'com.android.tools.build:gradle:8.7.2'" -NewText "classpath 'com.android.tools.build:gradle:8.1.4'" -Description "AGP version"

# Fix app build.gradle
Replace-InFile -FilePath "android/app/build.gradle" -OldText "sourceCompatibility JavaVersion.VERSION_21" -NewText "sourceCompatibility JavaVersion.VERSION_17" -Description "Java source compatibility"
Replace-InFile -FilePath "android/app/build.gradle" -OldText "targetCompatibility JavaVersion.VERSION_21" -NewText "targetCompatibility JavaVersion.VERSION_17" -Description "Java target compatibility"

# Fix plugins build.gradle
Replace-InFile -FilePath "android/capacitor-cordova-android-plugins/build.gradle" -OldText "classpath 'com.android.tools.build:gradle:8.7.2'" -NewText "classpath 'com.android.tools.build:gradle:8.1.4'" -Description "AGP version"
Replace-InFile -FilePath "android/capacitor-cordova-android-plugins/build.gradle" -OldText "sourceCompatibility JavaVersion.VERSION_21" -NewText "sourceCompatibility JavaVersion.VERSION_17" -Description "Java source compatibility"
Replace-InFile -FilePath "android/capacitor-cordova-android-plugins/build.gradle" -OldText "targetCompatibility JavaVersion.VERSION_21" -NewText "targetCompatibility JavaVersion.VERSION_17" -Description "Java target compatibility"

Write-Host "`n🎯 Summary of fixes:" -ForegroundColor Cyan
Write-Host "   ✅ AGP Version: 8.1.4 (compatible)" -ForegroundColor Green
Write-Host "   ✅ Java Version: 17 (compatible)" -ForegroundColor Green
Write-Host "   ❌ AGP Version: 8.7.2 (incompatible)" -ForegroundColor Red
Write-Host "   ❌ Java Version: 21 (incompatible)" -ForegroundColor Red

Write-Host "`n🔄 Syncing project..." -ForegroundColor Yellow
& npx cap sync android

Write-Host "`n✅ Android version compatibility issues fixed!" -ForegroundColor Green
Write-Host "📱 You can now open Android Studio with: npx cap open android" -ForegroundColor Cyan 