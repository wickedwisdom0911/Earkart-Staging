# Android Enterprise Provisioning Configuration

This directory contains the Android Enterprise provisioning configuration for the Earkart Omni app.

## Files

- `provisioning_config.json` - Main provisioning configuration file
- `PROVISIONING_README.md` - This documentation file

## Configuration Details

The provisioning configuration includes the following key settings:

### Device Admin Configuration

- **Component Name**: `com.example.earkart_omni/.DeviceAdminReceiver`
- **Package Download**: Configured to download from S3 bucket
- **Checksum**: SHA1 verification for APK integrity

### Network Configuration

- **WiFi SSID**: `Clinic-WiFi`
- **WiFi Password**: `StrongPassword123`
- **Skip Encryption**: `true` (for faster provisioning)

### Provisioning Options

- **Skip User Setup**: `true` (automated setup)
- **Skip User Consent**: `true` (no user interaction required)
- **Leave System Apps**: `true` (preserve system functionality)

## Usage Instructions

### 1. Update Configuration Values

Before using this configuration, update the following values in `provisioning_config.json`:

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://YOUR-BUCKET.s3.amazonaws.com/earkart_omni-v1.0.0.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "SHA1:YOUR_ACTUAL_SHA1_CHECKSUM",
  "android.app.extra.PROVISIONING_WIFI_SSID": "YOUR_CLINIC_WIFI_SSID",
  "android.app.extra.PROVISIONING_WIFI_PASSWORD": "YOUR_WIFI_PASSWORD"
}
```

### 2. Generate APK Checksum

#### Standard SHA1 Checksum (for most Android devices):

```bash
# For Windows
certutil -hashfile your-app.apk SHA1

# For macOS/Linux
shasum -a 1 your-app.apk
```

#### Samsung SHA256 Base64 Checksum (for Samsung devices):

```bash
# For macOS/Linux
cat your-app.apk | openssl dgst -binary -sha256 | openssl base64 | tr '+/' '-_' | tr -d '='

# For Windows PowerShell
$apkPath = "your-app.apk"; $bytes = [System.IO.File]::ReadAllBytes($apkPath); $sha256 = [System.Security.Cryptography.SHA256]::Create(); $hash = $sha256.ComputeHash($bytes); $base64 = [System.Convert]::ToBase64String($hash); $base64 = $base64.Replace('+', '-').Replace('/', '_').Replace('=', ''); Write-Output $base64
```

### 3. Upload APK to S3

1. Build your APK: `flutter build apk --release`
2. Upload to your S3 bucket
3. Update the download URL in the configuration
4. Update the checksum value

### 4. Deploy Configuration

The provisioning configuration can be deployed using:

1. **QR Code**: Generate a QR code containing the JSON configuration
2. **NFC**: Write the configuration to an NFC tag
3. **Manual Entry**: Enter the configuration manually during device setup

## Security Considerations

- Change the default WiFi password to a strong, unique password
- Use HTTPS for APK downloads
- Regularly rotate WiFi credentials
- Monitor device provisioning logs
- Consider using certificate-based authentication for enhanced security

## Troubleshooting

### Common Issues

1. **APK Download Fails**

   - Verify the S3 URL is accessible
   - Check the SHA1 checksum matches
   - Ensure the APK is signed correctly

2. **WiFi Connection Issues**

   - Verify SSID and password are correct
   - Check if the network requires additional authentication
   - Ensure the device supports the WiFi security protocol

3. **Device Admin Not Activated**
   - Verify the component name matches your app's package structure
   - Check that the DeviceAdminReceiver is properly configured
   - Ensure the app has the necessary permissions

### Logs

Check device logs for provisioning issues:

```bash
adb logcat | grep -i provisioning
adb logcat | grep -i device_admin
```

## Support

For issues related to Android Enterprise provisioning, refer to:

- [Android Enterprise Documentation](https://developers.google.com/android/work)
- [Device Owner Setup Guide](https://developers.google.com/android/work/dpc-setup)
