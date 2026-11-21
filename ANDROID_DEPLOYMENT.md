# 📱 VoiceSphere Android App Build & Deployment Guide

This guide documents the native Android packaging, build pipeline, keystore signing, and distribution paths for **VoiceSphere**.

---

## 🚀 1. Available Artifacts

The Android build produces two production-ready distribution packages:

| File | Purpose | Size | Location |
| :--- | :--- | :--- | :--- |
| **`voicesphere.apk`** | **Direct Sideload & Install** (v2/v3 signed) | ~3.2 MB | `public/voicesphere.apk` |
| **`voicesphere.aab`** | **Google Play Store Publishing** (App Bundle) | ~3.0 MB | `public/voicesphere.aab` |
| **`app-debug.apk`** | **Developer Testing** (Unsigned/Debug keystore) | ~4.1 MB | `android/app/build/outputs/apk/debug/app-debug.apk` |

---

## 🌐 2. How to Download & Install

### Option A: Direct Web Download (Zero App Store Required)
1. On any Android device (phone, tablet, or Chromebook), navigate to:
   - **`https://voicesphere.pages.dev/voicesphere.apk`**
2. Or click the **`Download Android App`** button in the VoiceSphere navigation header or hero.
3. Open the downloaded file and tap **Install**.
4. Grant microphone access when prompted to participate in 3D spatial audio rooms.

### Option B: Progressive Web App (PWA / WebAPK)
1. In Chrome, Brave, or Edge on Android, open:
   - **`https://voicesphere.pages.dev/`**
2. Tap the browser menu (`⋮`) and select **`Add to Home screen`** or tap the **`Install App`** banner.
3. Android will automatically install VoiceSphere as a standalone WebAPK with its own home screen icon and full-screen experience.

---

## 🏬 3. Deploying to Google Play Store (Production)

To publish VoiceSphere to the Google Play Store:

1. **Sign in to Google Play Console**:
   - Go to [play.google.com/console](https://play.google.com/console).
2. **Create New App**:
   - App Name: `VoiceSphere – Inclusive Social Audio`
   - Default language: `English (United States)`
   - App or game: `App`
   - Free or paid: `Free`
3. **Upload App Bundle**:
   - Navigate to **Production** > **Create new release**.
   - Upload `public/voicesphere.aab`.
   - Release name: `1.0.0 (1)`.
   - Release notes:
     ```text
     Initial release of VoiceSphere – The disability-inclusive 3D spatial social audio platform. Features real-time AAC symbol speech, mutual consent live captions, 10 disability presets, and zero tracking.
     ```
4. **Content Rating & Privacy Policy**:
   - Privacy Policy URL: `https://voicesphere.pages.dev/` (zero audio storage, mutual transcript consent).
   - Target Age: `13+` or `Everyone`.
5. **Review & Rollout**:
   - Submit for Google review. Once approved, the app will be live globally on Google Play!

---

## 🛠️ 4. Technical Architecture & Permissions

### Permissions Declared (`AndroidManifest.xml`)
- `android.permission.INTERNET`: Connects to Global Edge and Cloudflare KV.
- `android.permission.RECORD_AUDIO`: Captures microphone input for WebRTC spatial voice rooms.
- `android.permission.MODIFY_AUDIO_SETTINGS`: Routes audio to loudspeaker, earpiece, or Bluetooth headsets.
- `android.permission.ACCESS_NETWORK_STATE`: Handles seamless WiFi-to-cellular handover.
- `android.permission.BLUETOOTH` & `BLUETOOTH_CONNECT`: Direct support for wireless hearing aids and headsets.
- `android.permission.WAKE_LOCK`: Keeps real-time audio running smoothly with screen locked.
- `android.permission.FOREGROUND_SERVICE_MICROPHONE`: Background stage speaking support.

### Keystore Information
- **Alias**: `voicesphere`
- **Validity**: 10,000 days (until 2054)
- **Signature Schemes**: APK Signature Scheme v2 + v3

---

## 🔄 5. Building From Source

To rebuild the APK and AAB locally:

```powershell
# Set environment
$env:JAVA_HOME = "C:\Users\DILEEP GOVINDU\.jdks\ms-21.0.12.1"
$env:ANDROID_HOME = "C:\Users\DILEEP GOVINDU\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

# Sync Capacitor assets
npx cap sync android

# Build Release APK and AAB
cd android
.\gradlew.bat assembleRelease bundleRelease

# Sign release APK
& "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" sign --ks android/voicesphere-release.keystore --ks-pass pass:voicesphere123 --ks-key-alias voicesphere --key-pass pass:voicesphere123 --out ../public/voicesphere.apk app/build/outputs/apk/release/app-release-unsigned.apk
```
