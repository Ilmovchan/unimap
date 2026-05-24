#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FULL_PREBUILD=false
if [[ "${1:-}" == "--full" ]]; then
  FULL_PREBUILD=true
fi

echo "→ Закрийте Xcode (якщо відкритий)…"
killall Xcode 2>/dev/null || true

echo "→ Вирівнювання версій Expo…"
npx expo install expo-blur expo-dev-client expo-camera 2>/dev/null || true

echo "→ Видалення DerivedData UniMap (усі варіанти)…"
rm -rf ~/Library/Developer/Xcode/DerivedData/UniMap-* 2>/dev/null || true

if $FULL_PREBUILD; then
  echo "→ expo prebuild --clean…"
  rm -rf ios
  npx expo prebuild --platform ios --clean
else
  if [[ ! -d ios ]]; then
    echo "Папки ios/ немає. Запустіть: npm run ios:clean -- --full"
    exit 1
  fi
  echo "→ Очищення Pods / build…"
  rm -rf ios/Pods ios/build ios/Podfile.lock
fi

echo "→ pod install…"
(cd ios && pod install --repo-update)

echo ""
echo "Готово. Збирайте ТІЛЬКИ так (не старий Run у Xcode):"
echo "  npx expo run:ios --device"
echo ""
echo "Якщо знову modulemap: у Xcode Product → Clean Build Folder,"
echo "потім знову npx expo run:ios --device"
echo "Відкривати: ios/UniMap.xcworkspace"
