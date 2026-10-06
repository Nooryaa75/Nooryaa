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

- Android versionCode/versionName are set in codemagic.yaml (step "Set app version") because the Android project is regenerated each build — update both workflows together on each version bump (code must always increase).
- Both Android workflows install launcher resources through scripts/configure-android-icon.mjs after project generation; notification icons are separate and do not replace the launcher icon.
