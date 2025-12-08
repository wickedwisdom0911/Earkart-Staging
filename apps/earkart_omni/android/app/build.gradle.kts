import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Load keystore properties - REQUIRED for signing
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")

if (!keystorePropertiesFile.exists()) {
    throw GradleException(
        "ERROR: key.properties file not found at ${keystorePropertiesFile.absolutePath}\n" +
        "Please create the keystore file and key.properties file. See: https://flutter.dev/docs/deployment/android#signing-the-app"
    )
}

keystoreProperties.load(FileInputStream(keystorePropertiesFile))

// Validate required properties
val requiredProperties = listOf("storeFile", "keyAlias", "storePassword", "keyPassword")
val missingProperties = requiredProperties.filter { keystoreProperties[it] == null || keystoreProperties[it].toString().isEmpty() }

if (missingProperties.isNotEmpty()) {
    throw GradleException(
        "ERROR: Missing required properties in key.properties: ${missingProperties.joinToString(", ")}\n" +
        "Required properties: storeFile, keyAlias, storePassword, keyPassword"
    )
}

// Resolve keystore file path (relative to app directory where build.gradle.kts is located)
val keystorePath = keystoreProperties["storeFile"] as String
// Resolve path relative to the app module directory (where this build.gradle.kts file is)
// Use project.file() to ensure it resolves relative to this module's directory
val keystoreFile = project.file(keystorePath)

// Debug: Print the resolved path
println("═══════════════════════════════════════════════════════════")
println("DEBUG: Keystore Configuration")
println("═══════════════════════════════════════════════════════════")
println("  Path from key.properties: $keystorePath")
println("  Resolved absolute path: ${keystoreFile.absolutePath}")
println("  File exists: ${keystoreFile.exists()}")
println("  Project directory: ${project.projectDir.absolutePath}")
println("═══════════════════════════════════════════════════════════")

if (!keystoreFile.exists()) {
    throw GradleException(
        """
        ═══════════════════════════════════════════════════════════
        ERROR: Keystore file not found!
        ═══════════════════════════════════════════════════════════
        Expected location: ${keystoreFile.absolutePath}
        Path from key.properties: $keystorePath
        Project directory: ${project.projectDir.absolutePath}
        
        To generate the keystore file, run:
        keytool -genkey -v -keystore ${keystoreFile.absolutePath} -alias ${keystoreProperties["keyAlias"]} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${keystoreProperties["storePassword"]} -keypass ${keystoreProperties["keyPassword"]}
        
        Or use Android Studio: Build > Generate Signed Bundle / APK
        ═══════════════════════════════════════════════════════════
        """.trimIndent()
    )
}


android {
    namespace = "com.example.earkart_omni"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.earkart_omni"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 31
        targetSdk = 33
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        
        // Ensure native libraries are included for all ABIs
        ndk {
            abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
        }
    }

    signingConfigs {
        // Create signing config that will be used for both debug and release builds
        // This ensures consistent signing across all build types
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = keystoreFile
            storePassword = keystoreProperties["storePassword"] as String
            
            // Debug: Verify signing config is created
            println("═══════════════════════════════════════════════════════════")
            println("DEBUG: Signing Config Created")
            println("═══════════════════════════════════════════════════════════")
            println("  Config name: release")
            println("  Key alias: $keyAlias")
            println("  Store file: ${storeFile?.absolutePath}")
            println("  Store file exists: ${storeFile?.exists()}")
            println("═══════════════════════════════════════════════════════════")
        }
    }

    buildTypes {
        release {
            // Always use the release signing config
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            
            // Debug: Verify signing config is applied
            println("DEBUG: Release build type -> signing config: ${signingConfig?.name}")
        }
        debug {
            // Use the same signing config as release for consistency
            // This ensures the same keystore is used for both debug and release builds
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = false
            isShrinkResources = false
            
            // Debug: Verify signing config is applied
            println("DEBUG: Debug build type -> signing config: ${signingConfig?.name}")
        }
    }

    // Add packaging options to ensure native libraries are included
    packagingOptions {
        pickFirst("**/libc++_shared.so")
        pickFirst("**/libuvc.so")
        pickFirst("**/libausbc.so")
        pickFirst("**/libusb100.so")
        pickFirst("**/libUVCCamera.so")
        pickFirst("**/libUACAudio.so")
        exclude("META-INF/DEPENDENCIES")
        exclude("META-INF/LICENSE")
        exclude("META-INF/LICENSE.txt")
        exclude("META-INF/license.txt")
        exclude("META-INF/NOTICE")
        exclude("META-INF/NOTICE.txt")
        exclude("META-INF/notice.txt")
        exclude("META-INF/ASL2.0")
        exclude("META-INF/*.kotlin_module")
    }

    // Disable deferred components to avoid Google Play Core dependency issues
    buildFeatures {
        buildConfig = true
    }
    
    // Ensure native libraries are properly bundled
    bundle {
        language {
            enableSplit = false
        }
        density {
            enableSplit = false
        }

        abi {
            enableSplit = false
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    // Add Google Play Core for deferred components support
    implementation("com.google.android.play:core:1.10.3")
}

