# Chrome Web Store Publishing Setup

Publishing goes through **`wxt submit`** (the `publish-extension` CLI that ships with WXT).
It reads its credentials from `.env.submit`, which is gitignored and never committed.

## ⚠️ Do not use `wxt submit init`

The obvious command, `npx wxt@latest submit init`, **cannot work.** Its refresh-token step
sends you to Google with `redirect_uri=urn:ietf:wg:oauth:2.0:oob` — the out-of-band flow that
displays a code for you to paste. Google shut that flow off in October 2022, so the URL returns
`Error 400: invalid_request` every time. It's a dead code path in the upstream tool, not
something you can configure around.

Set the credentials up by hand instead. It takes about five minutes.

## Setup

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Chrome Web Store API** (APIs & Services > Library > search for it > Enable).
3. Configure the **OAuth consent screen**: user type External, and add your own Google account
   under **Test users**.
4. Set the publishing status to **In production**. This matters: while the app sits in
   *Testing*, Google expires its refresh tokens after **7 days**, and your next release fails
   with `invalid_grant` for no apparent reason.

### 2. Create OAuth credentials

1. APIs & Services > Credentials > Create Credentials > OAuth client ID.
2. Application type: **Desktop app** — not "Web application". Desktop clients are allowed to
   use a `http://localhost` redirect, which is what the next step needs.
3. Keep the Client ID and Client Secret.

### 3. Get a refresh token

Use the loopback flow, which Google still supports:

```bash
npx chrome-webstore-upload-keys
```

It starts a local server, opens your browser, and prints a refresh token when you approve.
Paste in the Client ID and Client Secret from the previous step when prompted.

### 4. Write `.env.submit`

Copy [`.env.submit.example`](.env.submit.example) to `.env.submit` and fill in the three values.
The extension ID is already there: `molpfdakehebpkaecfdpndakphebjjpp`.

`.env.submit` is gitignored. Never commit it.

## Verifying the setup

```bash
npm run submit -- --dry-run
```

This checks authentication only — it uploads nothing. Do this before a real submit;
it's the only way to catch a stale refresh token without publishing.

## Publishing

### Full build and publish

```bash
npm run publish
```

Runs `npm run build`, `npm run zip`, then `npm run submit`.

### Just submit (if already built and zipped)

```bash
npm run submit
```

⚠️ **This publishes to the public store.** There is no confirmation prompt.
Only run it when you mean it.

`npm run submit` is a thin wrapper ([`scripts/submit.mjs`](scripts/submit.mjs)) that resolves
`.output/pinflux-<version>-chrome.zip` from the version in `package.json` and passes it to
`wxt submit`. It refuses to run if that zip or `.env.submit` is missing, and forwards any extra
flags — hence the `--` in the dry-run command above.

The wrapper exists because `.output/` is never cleaned between builds and accumulates zips from
every past version, so a glob like `.output/*-chrome.zip` can silently upload an old release.

## Files

- **`.env.submit`** — holds `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`
  and `CHROME_REFRESH_TOKEN`, read by `wxt submit` via dotenv. Gitignored.
- **`.env.submit.example`** — the template to copy, with the format and the gotchas.
- **`scripts/submit.mjs`** — resolves the versioned zip and invokes `wxt submit`.

## Useful flags

All of these are `wxt submit` flags; pass them after `--`:

| Flag | Effect |
|---|---|
| `--dry-run` | Check auth, upload nothing |
| `--chrome-skip-submit-review` | Upload the zip but don't submit or publish it |
| `--chrome-publish-target trustedTesters` | Publish to trusted testers instead of everyone |
| `--chrome-deploy-percentage <1-100>` | Staged rollout |

Run `npx wxt submit --help` for the full list.

## Troubleshooting

### "Missing .env.submit"

Follow **Setup** above. Do not reach for `wxt submit init` — see the warning at the top.

### "Missing .output/pinflux-x.y.z-chrome.zip"

Run `npm run build && npm run zip` first. Note the version comes from `package.json` — if you
just bumped the version, you need a fresh zip.

### "Authentication failed"

- Make sure the OAuth app type is **Desktop app**, not Web application
- Confirm the Chrome Web Store API is enabled on the Google Cloud project
- Regenerate the refresh token with `npx chrome-webstore-upload-keys`

### "invalid_grant"

The refresh token was revoked or expired. The usual cause is an OAuth consent screen still in
*Testing* status, which caps refresh tokens at 7 days. Set it to **In production**, then
regenerate the token with `npx chrome-webstore-upload-keys`.

### "Extension not found"

Check `CHROME_EXTENSION_ID` in `.env.submit` matches the ID in the Web Store dashboard.

### "Rate limit exceeded"

The Chrome Web Store caps publishes per day. Wait and retry.

## CI/CD (GitHub Actions)

Add these secrets to the repository:

- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

`wxt submit` picks them up from the environment, so no `.env.submit` is needed in CI.

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to Chrome Web Store

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and zip
        run: npm run build && npm run zip

      - name: Submit
        run: npx wxt submit --chrome-zip .output/pinflux-${GITHUB_REF_NAME#v}-chrome.zip
        env:
          CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

Note the CI job calls `wxt submit` directly rather than `npm run submit`, because the wrapper
requires `.env.submit` to exist.
