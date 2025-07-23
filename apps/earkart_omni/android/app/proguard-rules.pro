# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep UVC camera native methods and classes
-keep class com.jiangdg.uvc.** {
    *;
}

-keep class com.jiangdg.ausbc.** {
    *;
}

-keep class com.jiangdg.usb.** {
    *;
}

# Keep native methods specifically
-keepclassmembers class com.jiangdg.uvc.UVCCamera {
    native <methods>;
}

-keepclassmembers class com.jiangdg.ausbc.** {
    native <methods>;
}

# Keep interfaces
-keep interface com.jiangdg.uvc.** {
    *;
}

-keep interface com.jiangdg.ausbc.** {
    *;
}

-keep interface com.jiangdg.usb.** {
    *;
}

# Keep callback interfaces
-keep interface com.jiangdg.uvc.IStatusCallback {
    *;
}

-keep interface com.jiangdg.uvc.IButtonCallback {
    *;
}

-keep interface com.jiangdg.ausbc.callback.** {
    *;
}

# Keep our plugin classes
-keep class com.chenyeju.** {
    *;
}

# Keep Flutter plugin classes
-keep class io.flutter.plugin.** {
    *;
}

# Keep native library references
-keep class com.jiangdg.uvc.UVCCamera {
    long mNativePtr;
    native <methods>;
}

# Keep all classes in the UVC camera package
-keep class com.jiangdg.** {
    *;
}

# Keep native method signatures
-keepclassmembers class * {
    native <methods>;
}

# Keep enum values
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep R classes
-keep class **.R$* {
    public static <fields>;
}

# Keep native library loading
-keep class java.lang.System {
    public static void loadLibrary(java.lang.String);
    public static void load(java.lang.String);
}

# Keep Flutter specific classes
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Keep Agora classes
-keep class io.agora.** { *; }

# Keep Socket.IO classes
-keep class io.socket.** { *; }

# Keep permission handler classes
-keep class com.baseflow.permissionhandler.** { *; }

# Keep Google Play Core classes
-keep class com.google.android.play.core.** { *; }
-keep interface com.google.android.play.core.** { *; } 