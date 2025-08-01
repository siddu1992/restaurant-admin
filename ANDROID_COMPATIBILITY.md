# Android Compatibility Guide

## ⚠️ IMPORTANT: Version Compatibility Issues

### The Problem
Your Android Studio version is **NOT compatible** with:
- **Java 21** (causes `error: invalid source release: 21`)
- **Android Gradle Plugin (AGP) 8.7.2** (causes compatibility issues)

### The Solution
You **MUST** use:
- **Java 17** (compatible with your Android Studio)
- **AGP 8.1.4** (compatible with your Android Studio)

## 🔧 Current Working Configuration

### 1. Main build.gradle (`android/build.gradle`)
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.1.4'  // ✅ CORRECT
    classpath 'com.google.gms:google-services:4.4.2'
}
```

### 2. App build.gradle (`android/app/build.gradle`)
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17  // ✅ CORRECT
    targetCompatibility JavaVersion.VERSION_17  // ✅ CORRECT
}
```

### 3. Plugins build.gradle (`android/capacitor-cordova-android-plugins/build.gradle`)
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.1.4'  // ✅ CORRECT
}

compileOptions {
    sourceCompatibility JavaVersion.VERSION_17  // ✅ CORRECT
    targetCompatibility JavaVersion.VERSION_17  // ✅ CORRECT
}
```

## ❌ What NOT to Change

**DO NOT** change these values back to:
- ❌ `JavaVersion.VERSION_21` (will cause build failure)
- ❌ `classpath 'com.android.tools.build:gradle:8.7.2'` (incompatible)

## 🚨 Why This Keeps Happening

1. **Android Studio Auto-Update**: Sometimes Android Studio suggests "updating" to newer versions
2. **Plugin Updates**: Some plugins might try to use newer versions
3. **Manual Changes**: Accidentally changing versions in build files

## 🔄 How to Fix If It Breaks Again

If you see `error: invalid source release: 21`, run these commands:

```bash
# 1. Fix the main build.gradle
# Change in android/build.gradle:
# classpath 'com.android.tools.build:gradle:8.1.4'

# 2. Fix the app build.gradle  
# Change in android/app/build.gradle:
# sourceCompatibility JavaVersion.VERSION_17
# targetCompatibility JavaVersion.VERSION_17

# 3. Fix the plugins build.gradle
# Change in android/capacitor-cordova-android-plugins/build.gradle:
# classpath 'com.android.tools.build:gradle:8.1.4'
# sourceCompatibility JavaVersion.VERSION_17
# targetCompatibility JavaVersion.VERSION_17

# 4. Sync the project
npx cap sync android

# 5. Open in Android Studio
npx cap open android
```

## 📋 Compatibility Matrix

| Android Studio Version | Compatible AGP | Compatible Java |
|----------------------|----------------|-----------------|
| Your Current Version | 8.1.4 ✅ | 17 ✅ |
| Your Current Version | 8.7.2 ❌ | 21 ❌ |

## 🎯 Summary

**Keep these versions for successful builds:**
- ✅ AGP: 8.1.4
- ✅ Java: 17
- ✅ Gradle: 8.11.1 (current)

**Never change to:**
- ❌ AGP: 8.7.2
- ❌ Java: 21

This configuration works with your current Android Studio setup and will build successfully! 🎉 