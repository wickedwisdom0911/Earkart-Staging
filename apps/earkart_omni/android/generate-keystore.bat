@echo off
REM Script to generate Android keystore for signing
REM This script generates the keystore file required for app signing

set KEYSTORE_FILE=app\earkart-release-key.jks
set KEY_ALIAS=earkart-key
set STORE_PASSWORD=earkart123
set KEY_PASSWORD=earkart123

echo Generating Android keystore...
echo.

REM Check if keystore already exists
if exist "%KEYSTORE_FILE%" (
    echo WARNING: Keystore file already exists at %KEYSTORE_FILE%
    echo.
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Keystore generation cancelled.
        exit /b 0
    )
    echo.
)

REM Generate the keystore
keytool -genkey -v -keystore %KEYSTORE_FILE% -alias %KEY_ALIAS% -keyalg RSA -keysize 2048 -validity 10000 -storepass %STORE_PASSWORD% -keypass %KEY_PASSWORD% -dname "CN=Earkart Omni, OU=Development, O=Earkart, L=City, ST=State, C=IN"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Keystore generated successfully at %KEYSTORE_FILE%
    echo.
    echo Keystore details:
    echo   File: %KEYSTORE_FILE%
    echo   Alias: %KEY_ALIAS%
    echo   Validity: 10000 days
    echo.
    echo The keystore is configured in android\key.properties
    echo You can now build your app in both debug and release modes.
) else (
    echo.
    echo ERROR: Failed to generate keystore. Make sure Java keytool is available in your PATH.
    echo.
    echo You can also generate it manually using:
    echo   keytool -genkey -v -keystore %KEYSTORE_FILE% -alias %KEY_ALIAS% -keyalg RSA -keysize 2048 -validity 10000
    exit /b 1
)

