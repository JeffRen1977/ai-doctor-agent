# Google Play (Capacitor Android)

Same workflow as **ai-college-advisor**: the app is a WebView shell that loads production:

**https://ai-doctor-agent-production.up.railway.app**

Web updates on Railway usually do **not** require a new Play release.

## Build release AAB

```bash
# From repo root
npm run android:icons      # optional: refresh launcher icons from icon-512.png
npm run android:sync       # build web + cap sync

# One-time signing setup
cd android
keytool -genkey -v -keystore release-upload.keystore -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
cp keystore.properties.example keystore.properties
# Edit keystore.properties with your passwords

# Release bundle (same as college advisor)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew bundleRelease
# Or from repo root: npm run android:bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Local dev against your machine

```bash
CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:3000 npm run android:sync
npm run android:open
```

## Play Console

- **Package:** `com.aidoctor.agent`
- **Store icon:** `resources/play-store-icon-512.png` (after `npm run android:icons`)
- **Privacy policy URL** required (health app)
- Declare that the app is **not** a medical device / not for diagnosis

## Internal testing (first Play upload)

Use **Internal testing** in [Play Console](https://play.google.com/console) — up to 100 testers, no public listing.

1. Fix signing: edit `android/keystore.properties` so `storePassword` and `keyPassword` match the passwords you used when creating `release-upload.keystore`.
2. Build: `npm run android:bundle` → upload `android/app/build/outputs/bundle/release/app-release.aab`.
3. Console → **Create app** → name **AI Doctor**, default language, **App** (not game).
4. **Release** → **Testing** → **Internal testing** → **Create release** → upload AAB.
5. Add testers: **Testers** tab → create email list → share the opt-in link.
6. Complete blocking items under **Policy and programs** (privacy policy URL, Data safety, content rating, health declaration).

Testers install via the opt-in link from Play Store (not the public store page).
