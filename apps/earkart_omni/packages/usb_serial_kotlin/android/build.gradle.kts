plugins {
    id("com.android.library")
    kotlin("android") version "2.1.0"
}

android {
    compileSdkVersion(34)
    namespace = "com.example.usb_serial_kotlin"
    defaultConfig {
        minSdkVersion(31)
        targetSdkVersion(33)
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") } // Use uri() for the URL
    }
}

val newBuildDir: Directory = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
dependencies {
//   the appropriate version
    // Add other dependencies as needed
    // implementation("com.github.felHR85:UsbSerial:6.0.6") // USB Serial dependency
    // Other dependencies...
}