## Native build rules (codemagic.yaml and scripts/)

- Android versions live in codemagic.yaml because projects regenerate; update both workflows together and always increase versionCode.
- Both Android workflows set and verify minSdkVersion 24 and compileSdkVersion/targetSdkVersion 36 before compilation to meet Google Play requirements.
- Both Android workflows configure launcher icons separately from notification icons and run configure-android-screen-security.mjs to set FLAG_SECURE before activity creation, preventing ordinary screen capture.
- The iOS project is regenerated each build like Android: codemagic.yaml iOS workflows apply scripts/configure-ios-icon.mjs, configure-ios-push.mjs (push entitlements + background modes), configure-ios-deeplinks.mjs, configure-ios-screen-security.mjs (UIScreen.capturedDidChange → WebView) and set-ios-version.mjs <version> <build>. Keep those steps in both iOS workflows and bump the iOS version with the Android one on each release.
- iOS screen security must support the generated Capacitor template without MainViewController.swift: embed the subclass in compiled AppDelegate.swift and bind Main.storyboard to it, so clean builds retain capture detection.
- Codemagic workflows must install Capacitor plugins with `npm install --save` (never --no-save) and verify them in android/capacitor.settings.gradle — `cap sync` only bundles plugins listed in package.json, otherwise push, App and GoogleAuth silently disappear from the native app.
- Google sign-in on Android requires BOTH certificate fingerprints (build keystore SHA-1 and Google Play app-signing SHA-1) as separate Android OAuth clients in Google Cloud Console — Play Store installs are signed by Google's key; a missing Play client makes signIn() fail with code 10.
