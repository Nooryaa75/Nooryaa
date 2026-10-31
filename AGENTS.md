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

- Subdirectories have their own AGENTS.md (scripts/AGENTS.md holds the Codemagic and native build rules); read it before changing files there or codemagic.yaml.

- Resolve browser/device language and explicit language choices through src/lib/locale.ts so UI initialization and signup metadata use the same fallback.

- Welcome email after social authentication is mounted once at the root; the authenticated server function derives the recipient from the session and reuses the welcome sender, sent-history check and idempotency key (no duplicates web/native).

- Onboarding renders and saves required profile fields only; optional details stay editable in Mon profil and are not cleared for existing members.
- Registration requirements are shared by onboarding and member access in registration-requirements.ts; save answers before advancing each themed page, and never treat selfie verification or onboarded alone as proof of a complete registration.
- Onboarding uses the themed Shadcn BirthdateCalendar, not device dialogs; retain age limits and date-only storage.
- The member layout rechecks onboarding on every pathname change, but withholds the outlet only until the member is verified once in the session (showAccessGate in src/lib/onboarding-access.ts): later route changes keep the app mounted while the recheck runs in the background, so decks, chats and scroll position survive navigation; onboarding hides member navigation so links cannot bypass completion.

- Store download badges are gated after hydration through the Capacitor bridge (native and admin never mount their link query); they sit directly above the language switcher — auth card on /auth (footer hides them there), shared footer elsewhere — never below the language controls.

- Admin discussions union message and liked-profile pairs to match member inboxes; paginated reads must exhaust all database pages before grouping, and UI pagination must never truncate history.
- Admin language is derived centrally from the current route without overwriting the member's saved locale; admin geographic labels use the canonical French catalog via admin-display so stored profile data stays unchanged.

- Android builds must declare POST_NOTIFICATIONS, CAMERA, RECORD_AUDIO and location permissions in the manifest (one codemagic.yaml step, both workflows) — otherwise Android 13+ greys out the notification toggle and the WebView camera fails, blocking the mandatory selfie. The notification channel is created at startup by src/lib/push.ts; push.server.ts must keep sending to that same channel id.
- Member photos carry the PhotoWatermark overlay and data-photo-guard wrappers on member surfaces only (deck, vignettes, profile gallery, chat photos, member lightbox) — never in admin (admin lightbox passes watermarked={false}). ScreenCaptureGuard at the root toggles html.nooryaa-recording from the native iOS captured event so guarded photos hide while the screen is recorded or shared.
- Push payloads must carry the Android channel id and an APNs sound together (push.server.ts sends `android.channel_id` and `apns.payload.aps.sound`); push.ts records the real device platform (ios/android) in push_tokens so AppUpdateChecker picks the matching app_versions row and store link.

- AppUpdateChecker is mounted once in src/routes/__root.tsx (not in a layout) so native users are prompted on every page, including admin and login screens that admin accounts land on.
- NativeBadgeSync at the root clears the iOS icon through the PushNotifications v6 bridge only after owner-scoped counts confirm no unread notifications or messages, avoiding a native rebuild.
- The runtime translation layer (TranslatedContent.tsx) tracks source and last rendered value: only application-made replacements become new sources, so language switches preserve the French source while dynamic labels stay dynamic; subtrees opt out with data-no-translate.
- Email confirmation uses app.nooryaa.com/verification-email with token_hash in the fragment; native cold/warm links are allowlisted and verified through Auth before onboarding. Android HTTPS App Links use Play SHA-256 association; custom open links never transfer sessions.
- Apparent-age thresholds for photo control live only in src/lib/photo-age.ts; member messages and admin flags follow the verdict, never the raw estimate.
- "Wants children" is stored as text in profiles.wants_children_answer (oui / non / je_ne_sais_pas) because the boolean column cannot hold a third answer; read and write only that column, keep the deprecated boolean as a read fallback for old rows, and funnel every label, filter and compatibility check through src/lib/wants-children.ts so "je_ne_sais_pas" stays answered but never becomes a search or match criterion.
- Verification selfies are stored in the private verification-selfies bucket before any AI analysis (latest as `<userId>`, every attempt as `<userId>-<timestamp>`), so admins can always view them even when verification fails; admin profile deletion removes all of them.
- Admin profile details fetch only displayed records and exact moderation counts; private selfie URLs load through a separate admin-authorized query so storage latency cannot delay the profile.
- Admin profile details use three unframed registration-stage sections, with photos and independently loaded selfies in the post-authentication section; this keeps the display aligned with signup without changing saved data or verification logic.
- Admin profile status shown as Actif/Non actif is derived from photo_verified via adminProfileStatus (src/lib/admin-display.ts) and never written to profiles.status, so unverified members are not locked out; admin route guards cache a confirmed admin check briefly in the browser while every server function still enforces requireAdminOrThrow.
- Selfie verification technical failures (unloadable photos, AI unavailable) never block signup: the server sets photo_verification_status="pending" and logs a moderation event so admins review the stored selfie; photo_verified stays false until verified.
