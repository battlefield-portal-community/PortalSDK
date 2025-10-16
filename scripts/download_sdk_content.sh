#!/bin/bash

# Get the directory where the script is located and move to parent directory
cd "$(dirname "$0")/.."

CACHE_DIR=".cache"
CACHE_ZIP="$CACHE_DIR/PortalSDK.zip"

echo "Checking cache directory..."
if [ ! -d "$CACHE_DIR" ]; then
    mkdir "$CACHE_DIR"
fi

if [ -f "$CACHE_ZIP" ]; then
    echo "Using cached PortalSDK.zip from $CACHE_DIR"
else
    echo "Downloading PortalSDK.zip to cache..."
    curl -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0' -L -o "$CACHE_ZIP" https://download.portal.battlefield.com/PortalSDK.zip
    if [ $? -ne 0 ]; then
        echo "Error: Failed to download PortalSDK.zip"
        exit 1
    fi
    echo "Download complete!"
fi

echo "Creating temporary directory..."
TMP_DIR=$(mktemp -d -t PortalSDK_tmp_XXXXXX)

echo "Extracting PortalSDK.zip to temporary directory..."
unzip -q "$CACHE_ZIP" -d "$TMP_DIR"
if [ $? -ne 0 ]; then
    echo "Error: Failed to extract PortalSDK.zip"
    rm -rf "$TMP_DIR"
    exit 1
fi

echo "Removing old directories if they exist..."
[ -d "GodotProject/raw" ] && rm -rf "GodotProject/raw"
[ -d "GodotProject/.godot" ] && rm -rf "GodotProject/.godot"
[ -d "GodotProject/levels" ] && rm -rf "GodotProject/levels"
[ -d "SDK/deps/FbExportData/thumbnails" ] && rm -rf "SDK/deps/FbExportData/thumbnails"
[ -d "python" ] && rm -rf "python"

echo "Moving GodotProject/raw..."
if [ -d "$TMP_DIR/GodotProject/raw" ]; then
    mv "$TMP_DIR/GodotProject/raw" "GodotProject/raw"
else
    echo "Warning: GodotProject/raw not found in downloaded SDK"
fi

echo "Moving GodotProject/.godot..."
if [ -d "$TMP_DIR/GodotProject/.godot" ]; then
    mv "$TMP_DIR/GodotProject/.godot" "GodotProject/.godot"
else
    echo "Warning: GodotProject/.godot not found in downloaded SDK"
fi

echo "Moving GodotProject/levels..."
if [ -d "$TMP_DIR/GodotProject/levels" ]; then
    mv "$TMP_DIR/GodotProject/levels" "GodotProject/levels"
else
    echo "Warning: GodotProject/levels not found in downloaded SDK"
fi

echo "Moving FbExportData/thumbnails to SDK/deps/FbExportData/thumbnails..."
if [ -d "$TMP_DIR/FbExportData/thumbnails" ]; then
    mkdir -p "SDK/deps/FbExportData"
    mv "$TMP_DIR/FbExportData/thumbnails" "SDK/deps/FbExportData/thumbnails"
else
    echo "Warning: FbExportData/thumbnails not found in downloaded SDK"
fi

echo "Moving python..."
if [ -d "$TMP_DIR/python" ]; then
    mv "$TMP_DIR/python" "python"
else
    echo "Warning: python directory not found in downloaded SDK"
fi

echo "Cleaning up temporary directory..."
rm -rf "$TMP_DIR"

echo "Update complete! (Cached zip kept in $CACHE_DIR)"
