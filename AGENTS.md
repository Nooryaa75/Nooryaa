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

- Store download badges are gated after hydration through the Capacitor bridge so native and admin views never mount their link query (no first-frame native flash); they are always placed directly above the language switcher — inside the auth card on /auth (where the footer hides them to avoid duplication), in the shared footer elsewhere — never below the language controls at the very bottom of a page.

- Admin discussions union message pairs with liked-profile pairs to match member inboxes; paginated reads must exhaust all database pages before grouping, and UI pagination must never truncate the available history.

- Admin language is derived centrally from the current route without overwriting the member’s saved locale; admin geographic labels use the canonical French catalog via admin-display so stored profile data remains unchanged.

- Android versionCode/versionName are set in codemagic.yaml (step "Set app version") because the Android project is regenerated each build — update both workflows together on each version bump (code must always increase).
- Both Android workflows set and verify minSdkVersion 24 AND compileSdkVersion/targetSdkVersion 36 in the generated Gradle variables before compilation because Google Play requires Android API 24+ (automatic protection) and target API 36 (published apps must target it; warning today, mandatory next year).
- Both Android workflows install launcher resources through scripts/configure-android-icon.mjs after project generation; notification icons are separate and do not replace the launcher icon.
- Android builds must declare android.permission.POST_NOTIFICATIONS in the app manifest (codemagic.yaml step "Configure notification permission", kept in both workflows) — Android 13+ never shows the permission prompt and leaves the Settings toggle greyed out without it. The notification channel is created at startup by src/lib/push.ts, and src/lib/push.server.ts must keep sending to that same channel id.
- The iOS project is regenerated each build like Android: codemagic.yaml iOS workflows apply scripts/configure-ios-icon.mjs, scripts/configure-ios-push.mjs (push entitlements + background modes) and scripts/set-ios-version.mjs <version> <build>. Keep those three steps in both iOS workflows and bump the iOS version together with the Android one on each release.
- Push payloads must carry both the Android channel id and an APNs sound: src/lib/push.server.ts sends `android.channel_id` and `apns.payload.aps.sound` in the same message, and src/lib/push.ts records the real device platform (ios/android) in push_tokens so AppUpdateChecker can pick the matching app_versions row and store link.

- AppUpdateChecker is mounted once in src/routes/__root.tsx (not in a layout) so native users are prompted on every page, including admin and login screens that admin accounts land on.
