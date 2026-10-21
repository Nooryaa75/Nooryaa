<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- Welcome delivery after social authentication is mounted once at the root; its authenticated server function derives the recipient from the session and shares the existing welcome sender, sent-history check and provider idempotency key to avoid duplicate emails across web and native callbacks.

- Onboarding renders and saves required profile fields only; optional details remain editable in Mon profil and are not cleared when an existing member completes onboarding.
- Onboarding uses the themed Shadcn BirthdateCalendar, not device dialogs, for legibility; retain age limits and date-only storage.
- The member layout rechecks onboarding on every pathname change and withholds the outlet until that path is verified; onboarding hides member navigation so links cannot bypass completion.

- Store download badges are gated after hydration through the Capacitor bridge so native and admin views never mount their link query (no first-frame native flash); they are always placed directly above the language switcher — inside the auth card on /auth (where the footer hides them to avoid duplication), in the shared footer elsewhere — never below the language controls at the very bottom of a page.

- Admin discussions union message pairs with liked-profile pairs to match member inboxes; paginated reads must exhaust all database pages before grouping, and UI pagination must never truncate the available history.

- Admin language is derived centrally from the current route without overwriting the member’s saved locale; admin geographic labels use the canonical French catalog via admin-display so stored profile data remains unchanged.

- Android versionCode/versionName are set in codemagic.yaml (step "Set app version") because the Android project is regenerated each build — update both workflows together on each version bump (code must always increase).
- Both Android workflows set and verify minSdkVersion 24 and compileSdkVersion/targetSdkVersion 36 in generated Gradle variables before compilation to meet Google Play requirements.
- Both Android workflows install launcher resources through scripts/configure-android-icon.mjs after project generation; notification icons are separate and do not replace the launcher icon.
- Android builds must declare POST_NOTIFICATIONS, CAMERA, RECORD_AUDIO and location permissions in the manifest (one codemagic.yaml step, both workflows) — without them Android 13+ greys out the notification toggle and the WebView camera fails, blocking the mandatory selfie. The notification channel is created at startup by src/lib/push.ts, and src/lib/push.server.ts must keep sending to that same channel id.
- The iOS project is regenerated each build like Android: codemagic.yaml iOS workflows apply scripts/configure-ios-icon.mjs, scripts/configure-ios-push.mjs (push entitlements + background modes) and scripts/set-ios-version.mjs <version> <build>. Keep those three steps in both iOS workflows and bump the iOS version together with the Android one on each release.
- Push payloads must carry both the Android channel id and an APNs sound: src/lib/push.server.ts sends `android.channel_id` and `apns.payload.aps.sound` in the same message, and src/lib/push.ts records the real device platform (ios/android) in push_tokens so AppUpdateChecker can pick the matching app_versions row and store link.

- AppUpdateChecker is mounted once in src/routes/__root.tsx (not in a layout) so native users are prompted on every page, including admin and login screens that admin accounts land on.
- Codemagic workflows must install Capacitor plugins with `npm install --save` (never --no-save) and verify them in android/capacitor.settings.gradle — `cap sync` only bundles plugins listed in package.json, otherwise push, App and GoogleAuth silently disappear from the native app.
- Google sign-in in the Android app only works when BOTH certificate fingerprints (the build keystore SHA-1 and the Google Play app-signing SHA-1) exist as separate Android OAuth clients in Google Cloud Console — Play Store installs are signed by Google's key, so a missing Play client makes signIn() fail with code 10.
- NativeBadgeSync is mounted once at the root and clears the iOS icon through the existing PushNotifications v6 bridge only after successful owner-scoped counts confirm no unread notifications or messages; this avoids a native rebuild and preserves unread alerts.
- The runtime translation layer (src/components/TranslatedContent.tsx) tracks both the source and its last rendered value: only application-made replacements become new sources, so language switches preserve the French source while counters and toggle labels remain dynamic; subtrees that must stay untouched use data-no-translate.
- Android deep links use configure-android-deeplinks.mjs in both workflows and an intent:// link in OpenInAppButton, gated after hydration to Android browsers only (never native); verified App Links require the Play signing SHA-256.
