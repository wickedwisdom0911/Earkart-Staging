# Omni Stub - Android Enterprise Device Owner Provisioning App

This is a lightweight Flutter stub app designed for Android Enterprise Device Owner provisioning. The app is less than 10 MB and serves as a minimal provisioning tool that can install the full version of the Omni app.

## Features

- **Device Owner Check**: Verifies if the app is running with Device Owner privileges
- **Silent APK Installation**: Attempts to silently install the full app from a predefined location
- **Minimal Dependencies**: Uses only core Flutter and Kotlin dependencies
- **QR Code Provisioning Ready**: Configured for Android Enterprise QR code provisioning

## Package Information

- **Package Name**: `com.example.earkart_omni`
- **Target SDK**: 34
- **Minimum SDK**: 31
- **Flutter Version**: 3.x compatible

## Key Components

### Flutter App (`lib/main.dart`)

- Simple UI showing "Setting up device… please wait"
- Continue button that checks Device Owner status
- Attempts to install full app from `/storage/emulated/0/Download/full_earkart_omni.apk`

### Device Admin Receiver (`android/app/src/main/kotlin/com/example/earkart_omni/DeviceAdminReceiver.kt`)

- Handles Device Admin events
- Logs admin actions for debugging

### Main Activity (`android/app/src/main/kotlin/com/example/earkart_omni/MainActivity.kt`)

- Implements method channel for Flutter-Android communication
- Checks Device Owner status using `DevicePolicyManager.isDeviceOwnerApp()`
- Handles silent APK installation using `PackageInstaller` API

### Device Admin Policy (`android/app/src/main/res/xml/device_admin_receiver.xml`)

- Defines all required Device Owner policies
- Enables comprehensive device management capabilities

## Required Permissions

The app includes **complete compatibility** with `earkart_omni` - identical AndroidManifest.xml:

- `android.permission.REQUEST_INSTALL_PACKAGES`
- `android.permission.MANAGE_EXTERNAL_STORAGE`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.permission.BIND_DEVICE_ADMIN`
- USB device support (FTDI, Arduino, UVC cameras)
- Camera, Bluetooth, Audio, Network permissions
- Device Owner specific permissions
- Android 12+ QR provisioning support
- Complete medical device functionality permissions

## Usage

1. **Provision as Device Owner**: Use Android Enterprise QR code provisioning or ADB commands to set this app as Device Owner
2. **Launch App**: The app will automatically check Device Owner status
3. **Install Full App**: Click "Continue" to attempt silent installation of the full app
4. **Manual Installation**: If silent installation fails, the app will prompt for manual installation

## Building

### Debug Build (Unsigned)

```bash
cd apps/omni_stub
flutter build apk --debug
```

### Release Build (Signed)

```bash
cd apps/omni_stub
flutter build apk --release
```

**Note**: The release build is automatically signed with the same certificate as `earkart_omni` for seamless upgrades. See [SIGNING_SETUP.md](SIGNING_SETUP.md) for details.

## Device Owner Provisioning

To provision this app as Device Owner:

### Via ADB (for testing):

```bash
adb shell dpm set-device-owner com.example.earkart_omni/.DeviceAdminReceiver
```

### Via QR Code (for production):

Create a QR code with the following JSON:

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.example.earkart_omni/.DeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": "com.example.earkart_omni"
}
```

## File Structure

```
apps/omni_stub/
├── lib/
│   └── main.dart
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── kotlin/com/example/earkart_omni/
│   │   │   │   ├── DeviceAdminReceiver.kt
│   │   │   │   └── MainActivity.kt
│   │   │   ├── res/xml/
│   │   │   │   └── device_admin_receiver.xml
│   │   │   └── AndroidManifest.xml
│   │   ├── build.gradle.kts
│   │   └── proguard-rules.pro
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradle.properties
│   └── local.properties
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

## Signing & Upgrade Compatibility

- **Same Certificate**: Both `omni_stub` and `earkart_omni` use the same signing certificate (`earkart-release-key.jks`)
- **Seamless Upgrades**: Device Owner privileges are preserved when upgrading from stub to full app
- **Package Compatibility**: Both apps share the same package name (`com.example.earkart_omni`)
- **Version Management**: `omni_stub` uses version 1.x.x, `earkart_omni` should use 2.x.x+

## Notes

- The app expects the full APK to be located at `/storage/emulated/0/Download/full_earkart_omni.apk`
- Silent installation requires Device Owner privileges
- The app is designed to be as lightweight as possible while maintaining all required functionality
- All Device Owner policies are enabled to support comprehensive device management
- **Critical**: Both apps must be signed with the same certificate for Device Owner continuity
