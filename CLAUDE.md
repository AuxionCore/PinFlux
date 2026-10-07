# CLAUDE.md

Working guide for PinFlux. Read this before touching anything in this repo.

## What this is

PinFlux is a **browser extension** (Chrome MV3 + Firefox MV2) that injects two features
into `chatgpt.com`:

1. **Pinned chats** — a custom container in ChatGPT's sidebar holding chats the user pinned,
   with rename, drag-and-drop reordering, and an `Alt+P` shortcut.
2. **Bookmarks** — per-section bookmarks inside a conversation, with a dropdown menu in the
   conversation header for jumping between them.

Built with [WXT](https://wxt.dev) + TypeScript. **Zero runtime dependencies** — everything is
hand-written DOM manipulation. Keep it that way unless there's a strong reason not to.

## How work happens here

**Every change starts with a GitHub issue and lands through a pull request. No direct commits to
`main`** — not for a one-line fix, not for a typo, not for a release.

```
issue  ->  branch  ->  commits  ->  PR  ->  review  ->  merge to main
```

1. **Open an issue first**, before writing code: `gh issue create`. Describe the symptom and the
   expected behavior, not just the fix. Label it `bug`, `enhancement` or `documentation` — those
   labels already exist. If the work came from someone else's report or PR, that issue or PR is the
   starting point; don't open a duplicate.
2. **Branch off `main`**, named `fix/<short-slug>` or `feat/<short-slug>`:
   `git switch -c fix/bookmark-wrapper main`.
3. **Commit to that branch.** Conventional-commit prefixes (`fix:`, `feat:`, `docs:`, `chore:`).
   Reference the issue in the body, not the subject.
4. **Open the PR**: `gh pr create --base main --fill`, and put `Closes #<n>` in the body so the
   issue closes on merge. Run the full code-change checklist below **before** opening it.
5. **Merge with `--no-ff`** once it's green and verified, then delete the branch.

`main` has no branch protection configured, so nothing mechanically stops a direct push. The
discipline is the only thing holding — follow it even when a change feels too small to deserve it,
because "too small to branch" is exactly the change that ships a broken selector.

## Commands

```bash
npm run dev              # Chrome dev build with HMR
npm run dev:firefox      # Firefox dev build
npm run compile          # tsc --noEmit — the only static check we have
npm run build            # Chrome production build -> .output/chrome-mv3/
npm run build:firefox    # Firefox production build -> .output/firefox-mv2/
npm run zip              # Chrome .zip for the store
npm run zip:firefox      # Firefox .zip + sources .zip (AMO requires the sources archive)
npm run publish          # build + zip + upload to Chrome Web Store (auto-publishes!)
```

**There is no test suite and no linter in CI.** `npm run compile` plus a manual check in a real
ChatGPT tab is the entire safety net. Budget for that: load `.output/chrome-mv3/` as an unpacked
extension and actually click through the feature you changed.

## Architecture

```
src/entrypoints/
  content.ts            # the only injected script; wires everything together
  background/index.ts   # onInstalled, Alt+P command, openTab messages
  popup/ options/ changelog/   # extension pages (plain HTML + TS + CSS)
src/components/
  pinChats/             # core/ (pin/unpin/init), helpers/ (menus, rename), dragAndDrop/, pinButton/
  chatBookmarks/        # main.ts wraps sections; bookmarksMenu.ts is the dropdown
  tutorial/             # first-run onboarding overlay
  utils/                # storage, getProfileId, notifications, styleScheme
```

`content.ts` is the hub. ChatGPT is an SPA, so it listens for `wxt:locationchange` and
**re-initializes on every navigation** — any feature you add must be idempotent and survive being
run many times on the same page.

HTML snippets live in `*.html` files imported with `?raw` and injected via `insertAdjacentHTML`.
**Always escape user-controlled text before it goes into one of these strings** — v2.3.0 shipped a
fix for exactly this bug (a bookmark named `/apps/<domain>` broke the dropdown markup). Use the
`escapeHtml()` helper in [`bookmarksMenu.ts`](src/components/chatBookmarks/bookmarksMenu.ts).

## The thing that breaks this project

Every feature is anchored to ChatGPT's private DOM, which changes without warning. Two of the last
three releases were recoveries from a ChatGPT redesign. The selectors we depend on:

| Selector | Used by |
|---|---|
| `section[data-testid^="conversation-turn-"]`, `article` | bookmark turn discovery |
| `.markdown.prose` | bookmark section splitting |
| `[data-message-author-role="assistant"]` | scoping bookmarks to replies |
| `[data-testid="conversation-header-actions"]` | bookmarks menu mount point |
| `[data-testid="composer-speech-button"]`, `stop-response-button` | "is the response finished?" |
| `nav[aria-label="Chat history"]`, `#history` | pinned-chats container mount point |
| `[data-testid="conversation-options-button"]`, `delete-chat-menu-item` | pin/unpin menu items |

Rules when you touch any of these:

- **Never make a new selector a hard requirement without a fallback.** Prefer the specific match,
  fall back to the looser one. The pattern is in
  [`chatBookmarks/main.ts`](src/components/chatBookmarks/main.ts) — `getAssistantMarkdown()`.
  If a selector goes stale and there's no fallback, the feature vanishes silently with nothing but
  a `console.warn`.
- Keep the old selector as a fallback when ChatGPT introduces a new structure, and say in a comment
  which version each branch is for.
- All our own injected markup is tagged with `data-pinflux-*` / `data-bookmark*` attributes. Use
  those to find our own elements, never ChatGPT's classes.
- `drafts/` holds captured snapshots of ChatGPT's real DOM. Useful reference, but they are old —
  verify against a live tab, don't trust them.
- We reuse ChatGPT's own Tailwind utility classes (`flex-1`, `min-w-0`, …) instead of shipping CSS
  for injected content. That works only as long as the class is present in their stylesheet — check
  it's already used elsewhere in this codebase before reaching for a new one.

## Storage

Everything is `browser.storage.sync` (syncs across the user's browsers, but has hard quotas).

| Key | Value |
|---|---|
| `{profileId}` | `[{ urlId, title }]` — pinned chats, in display order |
| `bm_{profileId}_{conversationId}_lastAccess_{YYYYMMDD}` | `[{ articleId, customName? }]` — bookmarks |

`profileId` is scraped from ChatGPT's own `localStorage` (`cache/user-…`) by
[`getProfileId.ts`](src/components/utils/getProfileId.ts) — it polls forever and never rejects.

The date is **inside the bookmark key**: `bumpBookmarkGroupTimestamp` rewrites the key (set new,
remove old) on every visit, and `ensureKeysStorageCapacity` evicts the oldest keys once there are
512 of them, skipping conversations that are still pinned. If you change the key format, you must
update all three of those files plus write a migration — existing users' bookmarks are keyed by the
old string and will be orphaned otherwise.

## Checklist for any code change

0. There is an open issue for this, and you are on a branch off `main` — not on `main` itself.
1. `npm run compile` — must be clean.
2. `npm run build`, load `.output/chrome-mv3/` unpacked, and exercise the change on a real
   conversation. Check a **long** chat (ChatGPT virtualizes turns — nodes unmount and remount on
   scroll) and a **streaming** response.
3. Navigate between chats without reloading, to confirm the `locationchange` path still works.
4. If you touched anything visual: check light **and** dark mode.
5. If the change is Firefox-relevant (manifest, APIs), also `npm run build:firefox`.
6. Match the existing style — Prettier config is in `.prettierrc`: no semicolons, single quotes,
   80 cols, `arrowParens: "avoid"`. Note the file is **gitignored**, so it won't travel to a fresh
   clone; don't be surprised if a contributor's diff is formatted differently.

### Adding or changing UI text

All user-facing strings go through `browser.i18n.getMessage()` and live in
`public/_locales/{en,ja,ko}/messages.json`. Add the key to **all three** files, not just `en`.

Current state: `en` has 91 keys, `ja` and `ko` have 86 — five tutorial keys
(`tutorialPinMethodTopMenu`, `tutorialPinTopMenuTitle`, `tutorialPinTopMenuMessage`,
`tutorialNoPinnedChatsTitle`, `tutorialNoPinnedChatsMessage`) were never translated. Don't widen
that gap.

## Release checklist

Version lives in **`package.json` only** — WXT derives the manifest version from it. There is no
version string in `wxt.config.ts`.

A release is a change like any other: it gets its own issue (`Release vX.Y.Z`, labelled
`documentation`) and its own `release/vX.Y.Z` branch, and it reaches `main` through a PR. The tag
is created **after** the merge, on the merge commit on `main` — never on the branch, or it points
at a commit that isn't in the released history.

1. `npm version <x.y.z> --no-git-tag-version` (patch for fixes, minor for features). This updates
   `package-lock.json` too — commit both.
2. **`CHANGELOG.md`** — new section at the top, Keep a Changelog format, `## [x.y.z] - YYYY-MM-DD`,
   with `### Fixed` / `### Added` / `### Enhanced` groups. Written for developers.
3. **`src/entrypoints/changelog/index.html`** — this is the "What's New" page users see inside the
   extension. Add a new `<div class="version-section current">` with the `Latest` badge, **and
   remove `current` + the `version-status` badge from the previous version** or you end up with two
   "Latest" entries. Phrase these entries for end users, not developers.
4. `npm run compile && npm run build`, and confirm `.output/chrome-mv3/manifest.json` carries the
   new version.
5. Commit as `Release vX.Y.Z: <summary>` on the release branch, open the PR, and merge it.
6. On the merged `main`: `git tag -a vX.Y.Z` and `git push origin vX.Y.Z`.
7. `npm run zip && npm run zip:firefox`, then publish a GitHub Release on the tag and attach
   `pinflux-X.Y.Z-chrome.zip`, `-firefox.zip` and `-sources.zip`.
8. `npm run submit -- --dry-run` to confirm the Web Store credentials still work, then
   `npm run submit` to push — **this auto-publishes**, so only run it when you mean it. Needs
   `.env.submit` (gitignored); see [CHROME_STORE_SETUP.md](CHROME_STORE_SETUP.md).
   Firefox is uploaded manually to AMO with the firefox + sources zips.

## Things that will bite you

- **Merging to `main` deploys the public website.** `.github/workflows/static.yml` publishes
  `website/` to GitHub Pages on every push to `main`, which a PR merge is. A code-only change is
  harmless, but know that the site redeploys.
- **`main` is the release branch.** There's also an older `dev` branch and a few stale `feature/*`
  branches; new work branches off `main`, not off those.
- `CONTRIBUTING.md` still points at the old `Yedidya10/chatgpt_pinChats` repo URLs. The repo is now
  `AuxionCore/PinFlux`.
- `.output/` is gitignored but not cleaned between builds, so it accumulates zips from old versions.
  Don't attach the wrong one to a release.
- `console.log`/`warn`/`error` are the debugging story — there's no error reporting. Leave the
  existing warnings in place; they're how DOM breakage gets noticed.

## Reviewing and merging a pull request

Applies to your own PRs and to outside contributions alike. Nobody can test against every ChatGPT
state, so review for the failure mode, not just the happy path:

1. `gh pr diff <n>` and check it against the selector rules above — a new hard-required selector is
   the single most common way an otherwise-correct PR takes the extension down.
2. `gh pr checkout <n> && npm run compile && npm run build`, then exercise it in a real tab.
3. Merge with `--no-ff` so the contributor's commit keeps its authorship, and confirm the PR body
   says `Closes #<n>` so the issue closes with it.
4. For an outside contribution, don't rewrite their commits. Land the PR as-is and push any
   follow-up fix as its **own** PR, crediting them in the changelog and the GitHub Release — that's
   how #8 and the `getAssistantMarkdown` fallback were handled in v2.3.1.
5. Delete the branch after merging.
