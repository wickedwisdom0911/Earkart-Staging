# Native Libraries for UVC Camera

This directory should contain the native libraries required for UVC camera functionality.

## Required Libraries

The following native libraries should be present in the appropriate ABI subdirectories:

- `libausbc.so` - Android USB Camera library (core functionality)
- `libuvc.so` - USB Video Class library
- `libusb100.so` - USB library
- `libUVCCamera.so` - UVC Camera wrapper library
- `libUACAudio.so` - USB Audio Class library

## ABI Directories

The libraries should be organized in the following structure:

```
jniLibs/
├── arm64-v8a/
│   ├── libausbc.so
│   ├── libuvc.so
│   ├── libusb100.so
│   ├── libUVCCamera.so
│   └── libUACAudio.so
├── armeabi-v7a/
│   ├── libausbc.so
│   ├── libuvc.so
│   ├── libusb100.so
│   ├── libUVCCamera.so
│   └── libUACAudio.so
├── x86/
│   ├── libausbc.so
│   ├── libuvc.so
│   ├── libusb100.so
│   ├── libUVCCamera.so
│   └── libUACAudio.so
└── x86_64/
    ├── libausbc.so
    ├── libuvc.so
    ├── libusb100.so
    ├── libUVCCamera.so
    └── libUACAudio.so
```

## Issue Resolution

If the `libausbc.so` library is missing from the release build, it indicates that the AndroidUSBCamera dependency is not properly including the native libraries. This can be resolved by:

1. Manually extracting the libraries from the dependency AAR files
2. Placing them in the appropriate jniLibs subdirectories
3. Ensuring the build.gradle configuration properly includes them

## Manual Library Extraction

To manually extract the libraries from the dependency:

1. Find the AAR files in the Gradle cache:

   ```
   ~/.gradle/caches/modules-2/files-2.1/com.github.chenyeju295.AndroidUSBCamera/
   ```

2. Extract the AAR files (they are ZIP files):

   ```bash
   unzip libausbc-3.3.6.aar
   unzip libuvc-3.3.6.aar
   ```

3. Copy the native libraries from the `jni/` directory to this `jniLibs/` directory

4. Ensure the build.gradle includes the jniLibs directory in the sourceSets configuration
