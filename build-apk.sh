#!/bin/bash
# ============================================
# Radar RSS - Android APK Build Script
# Run this manually in Termux:
#   cd RadarRSS && bash build-apk.sh
# ============================================

set -e

echo "📡 Radar RSS - Android APK Build"
echo "================================="

# Check prerequisites
echo ""
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install with: pkg install nodejs"
  exit 1
fi
echo "✅ Node.js $(node --version)"

if ! command -v java &> /dev/null; then
  echo "❌ Java not found. Install with: pkg install openjdk-17"
  exit 1
fi
echo "✅ Java $(java -version 2>&1 | head -1)"

if [ ! -f "package.json" ]; then
  echo "❌ Run this script from the RadarRSS project root directory"
  exit 1
fi
echo "✅ In RadarRSS project directory"

# Step 1: Install dependencies
echo ""
echo "📦 Step 1/5: Installing npm dependencies..."
npm ci --no-audit 2>&1 || npm install --no-audit 2>&1
termux-fix-shebang node_modules/.bin/* 2>/dev/null || true
echo "✅ Dependencies installed"

# Step 2: Build web assets
echo ""
echo "🔨 Step 2/5: Building web assets..."
npm run build
echo "✅ Web assets built"

# Step 3: Sync Capacitor
echo ""
echo "📱 Step 3/5: Syncing Capacitor..."
npx cap sync android
echo "✅ Capacitor synced"

# Step 4: Patch Java 21 -> 17 compatibility
echo ""
echo "🩹 Step 4/5: Patching Java version (21 -> 17)..."
find android node_modules/@capacitor -type f \( -name "*.gradle" \) -exec sed -i 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' {} + 2>/dev/null || true
echo "✅ Java version patched"

# Step 5: Build debug APK
echo ""
echo "🏗️  Step 5/5: Building Android debug APK..."
cd android
chmod +x gradlew
./gradlew assembleDebug
cd ..

# Find and report the APK
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
  APK_ABSPATH=$(realpath "$APK_PATH")
  echo ""
  echo "🎉 BUILD SUCCESSFUL!"
  echo "===================="
  echo "📱 APK: $APK_ABSPATH"
  echo "📏 Size: $APK_SIZE"
  echo ""
  echo "To install on device:"
  echo "  adb install $APK_PATH"
  echo ""
  echo "Or copy the APK and install manually."
else
  echo ""
  echo "❌ Build failed - APK not found at: $APK_PATH"
  exit 1
fi
