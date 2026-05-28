#!/usr/bin/env bash
# Перезбірка Android dev client після додавання нативних модулів (expo-camera тощо).
set -euo pipefail
cd "$(dirname "$0")/.."

resolve_android_sdk() {
  if [[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]]; then
    echo "$ANDROID_HOME"
    return 0
  fi
  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "$ANDROID_SDK_ROOT" ]]; then
    echo "$ANDROID_SDK_ROOT"
    return 0
  fi
  local mac_default="$HOME/Library/Android/sdk"
  if [[ -d "$mac_default" ]]; then
    echo "$mac_default"
    return 0
  fi
  return 1
}

ensure_android_sdk() {
  local sdk
  if ! sdk="$(resolve_android_sdk)"; then
    echo "Android SDK not found."
    echo "Install Android Studio → SDK Manager, then set in ~/.zshrc:"
    echo '  export ANDROID_HOME="$HOME/Library/Android/sdk"'
    echo '  export PATH="$ANDROID_HOME/platform-tools:$PATH"'
    exit 1
  fi

  export ANDROID_HOME="$sdk"
  export ANDROID_SDK_ROOT="$sdk"
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

  if [[ -d android ]]; then
    # Gradle reads sdk.dir from local.properties (not from env in all setups).
    printf 'sdk.dir=%s\n' "$sdk" > android/local.properties
    echo "Wrote android/local.properties → $sdk"
  fi
}

echo "Installing native deps..."
npx expo install expo-dev-client expo-camera 2>/dev/null || true

ensure_android_sdk

echo "Running Android prebuild + run..."
npx expo run:android

echo "Done. Open the new app binary — do not use an old APK."
