#!/usr/bin/env bash
# Uses Android Studio's bundled JDK on macOS when JAVA_HOME is not set.
set -euo pipefail
cd "$(dirname "$0")"

if [ -z "${JAVA_HOME:-}" ]; then
  for candidate in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "/Applications/Android Studio.app/Contents/jre/Contents/Home"; do
    if [ -d "$candidate" ] && [ -x "$candidate/bin/java" ]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [ -z "${JAVA_HOME:-}" ]; then
  echo "JAVA_HOME is not set and Android Studio JDK was not found."
  echo "Install Android Studio, or: brew install openjdk@17"
  echo "Then: export JAVA_HOME=\$(/usr/libexec/java_home -v 17)"
  exit 1
fi

export PATH="$JAVA_HOME/bin:$PATH"
echo "Using JAVA_HOME=$JAVA_HOME"
java -version

./gradlew bundleRelease "$@"
