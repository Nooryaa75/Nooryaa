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

- Resolve browser/device language and explicit language choices through src/lib/locale.ts so UI initialization and signup metadata use the same fallback.

- Welcome email after social authentication is mounted once at the root; the authenticated server function derives the recipient from the session and reuses the welcome sender, sent-history check and idempotency key (no duplicates web/native).

- Onboarding renders and saves required profile fields only; optional details stay editable in Mon profil and are not cleared for existing members.
- Onboarding uses the themed Shadcn BirthdateCalendar, not device dialogs; retain age limits and date-only storage.
- The member layout rechecks onboarding on every pathname change and withholds the outlet until verified; onboarding hides member navigation so links cannot bypass completion.

- Store download badges are gated after hydration through the Capacitor bridge (native and admin never mount their link query); they sit directly above the language switcher — auth card on /auth (footer hides them there), shared footer elsewhere — never below the language controls.

- Admin discussions union message and liked-profile pairs to match member inboxes; paginated reads must exhaust all database pages before grouping, and UI pagination must never truncate history.
- Admin language is derived centrally from the current route without overwriting the member's saved locale; admin geographic labels use the canonical French catalog via admin-display so stored profile data stays unchanged.

- Android versions live in codemagic.yaml because projects regenerate; update both workflows together and always increase versionCode.
- Both Android workflows set and verify minSdkVersion 24 and compileSdkVersion/targetSdkVersion 36 before compilation to meet Google Play requirements.
- Both Android workflows configure launcher icons separately from notification icons and run configure-android-screen-security.mjs to set FLAG_SECURE before activity creation, preventing ordinary screen capture.
- Android builds must declare POST_NOTIFICATIONS, CAMERA, RECORD_AUDIO and location permissions in the manifest (one codemagic.yaml step, both workflows) — otherwise Android 13+ greys out the notification toggle and the WebView camera fails, blocking the mandatory selfie. The notification channel is created at startup by src/lib/push.ts; push.server.ts must keep sending to that same channel id.
- The iOS project is regenerated each build like Android: codemagic.yaml iOS workflows apply scripts/configure-ios-icon.mjs, configure-ios-push.mjs (push entitlements + background modes), configure-ios-deeplinks.mjs, configure-ios-screen-security.mjs (UIScreen.capturedDidChange → WebView) and set-ios-version.mjs <version> <build>. Keep those steps in both iOS workflows and bump the iOS version with the Android one on each release.
- Member photos carry the PhotoWatermark overlay and data-photo-guard wrappers on member surfaces only (deck, vignettes, profile gallery, chat photos, member lightbox) — never in admin (admin lightbox passes watermarked={false}). ScreenCaptureGuard at the root toggles html.nooryaa-recording from the native iOS captured event so guarded photos hide while the screen is recorded or shared.
- iOS screen security must support the generated Capacitor template without MainViewController.swift: embed the subclass in compiled AppDelegate.swift and bind Main.storyboard to it, so clean builds retain capture detection.
- Push payloads must carry the Android channel id and an APNs sound together (push.server.ts sends `android.channel_id` and `apns.payload.aps.sound`); push.ts records the real device platform (ios/android) in push_tokens so AppUpdateChecker picks the matching app_versions row and store link.

- AppUpdateChecker is mounted once in src/routes/__root.tsx (not in a layout) so native users are prompted on every page, including admin and login screens that admin accounts land on.
- Codemagic workflows must install Capacitor plugins with `npm install --save` (never --no-save) and verify them in android/capacitor.settings.gradle — `cap sync` only bundles plugins listed in package.json, otherwise push, App and GoogleAuth silently disappear from the native app.
- Google sign-in on Android requires BOTH certificate fingerprints (build keystore SHA-1 and Google Play app-signing SHA-1) as separate Android OAuth clients in Google Cloud Console — Play Store installs are signed by Google's key; a missing Play client makes signIn() fail with code 10.
- NativeBadgeSync at the root clears the iOS icon through the PushNotifications v6 bridge only after owner-scoped counts confirm no unread notifications or messages, avoiding a native rebuild.
- The runtime translation layer (TranslatedContent.tsx) tracks source and last rendered value: only application-made replacements become new sources, so language switches preserve the French source while dynamic labels stay dynamic; subtrees opt out with data-no-translate.
- Email confirmation uses app.nooryaa.com/verification-email with token_hash in the fragment; native cold/warm links are allowlisted and verified through Auth before onboarding. Android HTTPS App Links use Play SHA-256 association; custom open links never transfer sessions.
- Apparent-age thresholds for photo control live only in src/lib/photo-age.ts; member messages and admin flags follow the verdict, never the raw estimate.
- "Wants children" is stored as text in profiles.wants_children_answer (oui / non / je_ne_sais_pas) because the boolean column cannot hold a third answer; read and write only that column, keep the deprecated boolean as a read fallback for old rows, and funnel every label, filter and compatibility check through src/lib/wants-children.ts so "je_ne_sais_pas" stays answered but never becomes a search or match criterion.
