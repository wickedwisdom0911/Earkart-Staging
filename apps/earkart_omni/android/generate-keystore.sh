#!/bin/bash
# Script to generate Android keystore for signing
# This script generates the keystore file required for app signing

KEYSTORE_FILE="app/earkart-release-key.jks"
KEY_ALIAS="earkart-key"
STORE_PASSWORD="earkart123"
KEY_PASSWORD="earkart123"

echo "Generating Android keystore..."
echo ""

# Check if keystore already exists
if [ -f "$KEYSTORE_FILE" ]; then
    echo "WARNING: Keystore file already exists at $KEYSTORE_FILE"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "Keystore generation cancelled."
        exit 0
    fi
    echo ""
fi

# Generate the keystore
keytool -genkey -v -keystore "$KEYSTORE_FILE" -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$STORE_PASSWORD" -keypass "$KEY_PASSWORD" -dname "CN=Earkart Omni, OU=Development, O=Earkart, L=City, ST=State, C=IN"

if [ $? -eq 0 ]; then
    echo ""
    echo "SUCCESS: Keystore generated successfully at $KEYSTORE_FILE"
    echo ""
    echo "Keystore details:"
    echo "  File: $KEYSTORE_FILE"
    echo "  Alias: $KEY_ALIAS"
    echo "  Validity: 10000 days"
    echo ""
    echo "The keystore is configured in android/key.properties"
    echo "You can now build your app in both debug and release modes."
else
    echo ""
    echo "ERROR: Failed to generate keystore. Make sure Java keytool is available in your PATH."
    echo ""
    echo "You can also generate it manually using:"
    echo "  keytool -genkey -v -keystore $KEYSTORE_FILE -alias $KEY_ALIAS -keyalg RSA -keysize 2048 -validity 10000"
    exit 1
fi

