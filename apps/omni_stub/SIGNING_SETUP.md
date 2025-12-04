# Signing Configuration for Omni Stub

## Overview

The `omni_stub` app is configured to use the **same signing certificate** as the main `earkart_omni` app. This ensures seamless upgrades between the stub and the full app without losing Device Owner privileges.

## Signing Files

### 1. Keystore File

- **File**: `android/earkart-release-key.jks`
- **Source**: Copied from `apps/earkart_omni/android/earkart-release-key.jks`
- **Purpose**: Contains the private key and certificate for signing

### 2. Key Properties

- **File**: `android/key.properties`
- **Content**:
  ```
  storePassword=earkart123
  keyPassword=earkart123
  keyAlias=earkart-key
  storeFile=earkart-release-key.jks
  ```

## Build Configuration

The `android/app/build.gradle.kts` file includes:

```kotlin
// Load keystore properties
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

// Signing configuration
signingConfigs {
    create("release") {
        keyAlias = keystoreProperties["keyAlias"] as String?
        keyPassword = keystoreProperties["keyPassword"] as String?
        storeFile = keystoreProperties["storeFile"]?.let { file(it) }
        storePassword = keystoreProperties["storePassword"] as String?
    }
}

// Build types with signing
buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
        isMinifyEnabled = true
        isShrinkResources = false
        proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
}
```

## Why Same Signing is Critical

### 1. **Device Owner Continuity**

- Device Owner status is tied to the **package name** AND **signing certificate**
- If apps have different certificates, Android treats them as different apps
- This would break Device Owner privileges during upgrade

### 2. **Seamless Upgrade Process**

- `omni_stub` (version 1.0.0) → `earkart_omni` (version 2.0.0+)
- Same certificate = Android recognizes as app update
- Different certificate = Android treats as separate app installation

### 3. **Security Compliance**

- Enterprise environments require consistent app signing
- Device Owner apps must maintain certificate integrity
- Prevents unauthorized app replacements

## Building Signed APKs

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

The release build will automatically use the signing configuration.

## Verification

To verify the signing configuration:

1. **Check keystore exists**:

   ```bash
   ls android/earkart-release-key.jks
   ```

2. **Check key.properties**:

   ```bash
   cat android/key.properties
   ```

3. **Verify APK signature** (after building):
   ```bash
   keytool -printcert -jarfile build/app/outputs/flutter-apk/app-release.apk
   ```

## Security Notes

### ⚠️ **Important Security Considerations**

1. **Keystore Protection**: The keystore file contains sensitive private keys
2. **Password Security**: Store passwords securely in CI/CD systems
3. **Access Control**: Limit access to signing files
4. **Backup**: Keep secure backups of the keystore file

### 🔒 **Production Recommendations**

1. **Use Environment Variables**: Store passwords in secure environment variables
2. **CI/CD Integration**: Use secure signing in automated builds
3. **Key Rotation**: Plan for certificate renewal/rotation
4. **Audit Trail**: Log all signing activities

## Troubleshooting

### Common Issues

1. **"Keystore not found"**

   - Verify `earkart-release-key.jks` exists in `android/` directory
   - Check `key.properties` file path

2. **"Wrong password"**

   - Verify passwords in `key.properties` match the keystore
   - Check for typos in password fields

3. **"Key alias not found"**

   - Verify `keyAlias=earkart-key` matches the keystore
   - Use `keytool -list -keystore earkart-release-key.jks` to check aliases

4. **"Certificate mismatch"**
   - Ensure both apps use the exact same keystore file
   - Verify no modifications to the keystore

## Integration with earkart_omni

Both apps now share **100% compatibility**:

- ✅ **Same package name**: `com.example.earkart_omni`
- ✅ **Same signing certificate**: `earkart-release-key.jks`
- ✅ **Same key alias**: `earkart-key`
- ✅ **Same AndroidManifest.xml**: Identical permissions and configuration
- ✅ **Same Device Admin policies**: Complete Device Owner support
- ✅ **Same USB device support**: FTDI, Arduino, UVC cameras
- ✅ **Same Gradle/Kotlin versions**: Perfect build compatibility
- ✅ **Compatible version codes**: `omni_stub` (1.x.x) → `earkart_omni` (2.x.x+)

This ensures **perfect compatibility** for Device Owner provisioning and seamless upgrades with zero configuration differences.
