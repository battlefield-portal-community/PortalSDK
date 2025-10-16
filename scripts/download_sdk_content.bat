@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0.."

set "CACHE_DIR=.cache"
set "CACHE_ZIP=%CACHE_DIR%\PortalSDK.zip"

echo Checking cache directory...
if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"

if exist "%CACHE_ZIP%" (
    echo Using cached PortalSDK.zip from %CACHE_DIR%
) else (
    echo Downloading PortalSDK.zip to cache...
    curl -L -o "%CACHE_ZIP%" https://download.portal.battlefield.com/PortalSDK.zip
    if errorlevel 1 (
        echo Error: Failed to download PortalSDK.zip
        exit /b 1
    )
    echo Download complete!
)

echo Creating temporary directory...
set "TMP_DIR=%TEMP%\PortalSDK_tmp_%RANDOM%"
mkdir "%TMP_DIR%"

echo Extracting PortalSDK.zip to temporary directory...
tar -xf "%CACHE_ZIP%" -C "%TMP_DIR%"
if errorlevel 1 (
    echo Error: Failed to extract PortalSDK.zip
    rmdir /s /q "%TMP_DIR%"
    exit /b 1
)

echo Removing old directories if they exist...
if exist "GodotProject\raw" rmdir /s /q "GodotProject\raw"
if exist "GodotProject\.godot" rmdir /s /q "GodotProject\.godot"
if exist "GodotProject\levels" rmdir /s /q "GodotProject\levels"
if exist "SDK\deps\FbExportData\thumbnails" rmdir /s /q "SDK\deps\FbExportData\thumbnails"
if exist "python" rmdir /s /q "python"

echo Moving GodotProject/raw...
if exist "%TMP_DIR%\GodotProject\raw" (
    move "%TMP_DIR%\GodotProject\raw" "GodotProject\raw"
) else (
    echo Warning: GodotProject/raw not found in downloaded SDK
)

echo Moving GodotProject/.godot...
if exist "%TMP_DIR%\GodotProject\.godot" (
    move "%TMP_DIR%\GodotProject\.godot" "GodotProject\.godot"
    if errorlevel 1 (
        xcopy "%TMP_DIR%\GodotProject\.godot" "GodotProject\.godot" /E /I /H /Y
        if not errorlevel 1 (
            rmdir /s /q "%TMP_DIR%\GodotProject\.godot"
        )
    )
) else (
    echo Warning: GodotProject/.godot not found in downloaded SDK
)

echo Moving GodotProject/levels...
if exist "%TMP_DIR%\GodotProject\levels" (
    move "%TMP_DIR%\GodotProject\levels" "GodotProject\levels"
) else (
    echo Warning: GodotProject/levels not found in downloaded SDK
)

echo Moving FbExportData/thumbnails to SDK/deps/FbExportData/thumbnails...
if exist "%TMP_DIR%\FbExportData\thumbnails" (
    if not exist "SDK\deps\FbExportData" mkdir "SDK\deps\FbExportData"
    move "%TMP_DIR%\FbExportData\thumbnails" "SDK\deps\FbExportData\thumbnails"
) else (
    echo Warning: FbExportData/thumbnails not found in downloaded SDK
)

echo Moving python...
if exist "%TMP_DIR%\python" (
    move "%TMP_DIR%\python" "python"
) else (
    echo Warning: python directory not found in downloaded SDK
)

echo Cleaning up temporary directory...
rmdir /s /q "%TMP_DIR%"

echo Update complete! (Cached zip kept in %CACHE_DIR%)
endlocal
