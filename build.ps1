# ============================================
# COMPLETE CLEAN BUILD SCRIPT FOR EXPO ANDROID
# ============================================
# RUN THIS FROM: C:\projects\DSC_FULL_TECH_STACK\mobile
# ============================================

Write-Host "📂 Current directory should be: C:\projects\DSC_FULL_TECH_STACK\mobile" -ForegroundColor Yellow
Write-Host "🛑 Killing Java and Node processes..." -ForegroundColor Cyan
taskkill /F /IM java.exe 2>$null
taskkill /F /IM node.exe 2>$null

Write-Host "🧹 Cleaning project directories..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Clear npm cache safely
Write-Host "🗑️ Clearing npm cache..." -ForegroundColor Cyan
$npmCache = npm config get cache
if (Test-Path $npmCache) {
    Remove-Item -Recurse -Force $npmCache -ErrorAction SilentlyContinue
}
npm cache verify --silent

# Install dependencies with legacy-peer-deps
Write-Host "📦 Installing dependencies from package.json..." -ForegroundColor Cyan
npm install --legacy-peer-deps

# Automatically fix Expo-specific version mismatches
Write-Host "🛠 Checking and fixing Expo compatibility..." -ForegroundColor Yellow
npx expo install --fix

Write-Host "✅ Installation and sync complete!" -ForegroundColor Green

# ✅ Force non‑interactive mode for all Expo commands
$env:CI = "true"

# Run Expo Doctor (ignore errors, continue)
Write-Host "🔍 Running Expo Doctor to check environment..." -ForegroundColor Magenta
npx expo-doctor --fix 2>$null

# Verify dotenv works
Write-Host "🔍 Checking environment variables..." -ForegroundColor Magenta
node -e "require('dotenv/config'); console.log('✅ dotenv loaded')"

# Prebuild (clean, non‑interactive)
Write-Host "🏗️ Running Expo prebuild with clean flag..." -ForegroundColor Cyan
npx expo prebuild --clean --no-install

# ============================================
# 🔍 VERIFY AND PATCH ANDROID MANIFEST
# ============================================
Write-Host "🔍 Checking generated AndroidManifest.xml for cleartext traffic..." -ForegroundColor Cyan
$manifestPath = "android/app/src/main/AndroidManifest.xml"
if (Test-Path $manifestPath) {
    $content = Get-Content $manifestPath -Raw
    if ($content -notmatch 'android:usesCleartextTraffic="true"') {
        Write-Host "⚠️  usesCleartextTraffic not found! Patching manifest..." -ForegroundColor Yellow
        # Add the attribute to the <application> tag
        $pattern = '<application\s+'
        $replacement = '<application android:usesCleartextTraffic="true" '
        $content = $content -replace $pattern, $replacement
        $content | Set-Content $manifestPath
        Write-Host "✅ Patched AndroidManifest.xml" -ForegroundColor Green
    } else {
        Write-Host "✅ usesCleartextTraffic already present." -ForegroundColor Green
    }
} else {
    Write-Host "❌ Manifest not found at $manifestPath" -ForegroundColor Red
}

# Build APK
Write-Host "🤖 Building Android APK..." -ForegroundColor Cyan
Set-Location android
.\gradlew clean
.\gradlew assembleRelease
Set-Location ..

# Open output folder
Write-Host "📂 Opening APK folder..." -ForegroundColor Green
explorer android\app\build\outputs\apk\release\

Write-Host "✅ Build complete! APK location:" -ForegroundColor Green
Write-Host "C:\projects\DSC_FULL_TECH_STACK\mobile\android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Yellow