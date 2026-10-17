# Chrome Web Store Publishing Setup

Publishing goes through **`wxt submit`** (the `publish-extension` CLI that ships with WXT).
It reads its credentials from `.env.submit`, which is gitignored and never committed.

## Chrome Web Store API v2 only

Google shut down API v1.1 (client ID + client secret + refresh token) on **2026-10-15**.
Only **v2** works now, and it authenticates with a **service account**, not an OAuth client.

`publish-browser-extension` still **defaults to v1.1** when `CHROME_API_VERSION` is unset, so
that line in `.env.submit` is not optional. If you have an old `.env.submit` with
`CHROME_CLIENT_ID` / `CHROME_CLIENT_SECRET` / `CHROME_REFRESH_TOKEN`, replace it. Those
credentials no longer work.

## Setup

### 1. Publisher ID

Open the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). If you belong to
more than one publisher (e.g. a group publisher), select the one that owns PinFlux first. The ID
is the segment after `devconsole/` in the URL:

```
https://chrome.google.com/webstore/devconsole/<publisher-id>/...
```

### 2. Service account

Follow Google's guide: [Use service accounts](https://developer.chrome.com/docs/webstore/service-accounts).
In short:

1. In [Google Cloud Console](https://console.cloud.google.com/), pick or create a project and
   enable the **Chrome Web Store API** (APIs & Services > Library).
2. IAM & Admin > Service Accounts > create a service account.
3. In the guide's *Obtain access tokens* step, follow **Use a JSON Web Token** and stop once
   you've downloaded the JSON key (the service account's Keys tab > Add key > JSON).
4. In the Developer Dashboard, add the service account's `client_email` to the publisher's
   account settings, as the guide describes. Without this the key is valid but has no access to
   the extension, and every call fails.

Google discourages long-lived service account keys for day-to-day use. They're still the
mechanism for unattended publishing, but treat the JSON file like a password: delete the
download once its values are in `.env.submit`.

### 3. Write `.env.submit`

Copy [`.env.submit.example`](.env.submit.example) to `.env.submit` and fill in:

- `CHROME_PUBLISHER_ID`, from step 1.
- `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`, the `client_email` field of the JSON key.
- `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`, the `private_key` field: everything between its
  quotes, pasted inside double quotes, with the `\n` sequences left as literal `\n`.

The extension ID is already there: `molpfdakehebpkaecfdpndakphebjjpp`.

`.env.submit` is gitignored. Never commit it.

### Or: `wxt submit init` (Node 24+ only)

`npx wxt submit init` walks through the same values and writes `.env.submit` for you. Choose
**v2** when it asks for the API version. In its first prompt, press **Space** to select Chrome
Web Store, then Enter. Enter alone submits an empty selection, and the command exits.

It needs **Node 24 or newer**. On Node 22 it asks every question and then crashes with
`TypeError: RegExp.escape is not a function` while writing the file, so nothing is saved. On
Node 22, fill in the file by hand as above. `wxt submit` itself runs fine on Node 22.

## Verifying the setup

```bash
npm run submit -- --dry-run
```

This checks authentication only. It uploads nothing. Do this before a real submit; it's the
only way to catch broken credentials without publishing.

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

- **`.env.submit`** — `CHROME_API_VERSION`, `CHROME_EXTENSION_ID`, `CHROME_PUBLISHER_ID`, the
  service account email and private key, and the publish options. Read by `wxt submit`.
  Gitignored.
- **`.env.submit.example`** — the template to copy, with each option explained.
- **`scripts/submit.mjs`** — resolves the versioned zip and invokes `wxt submit`.

## Useful flags and commands

All of these are `wxt submit` flags; pass them after `--`:

| Flag | Effect |
|---|---|
| `--dry-run` | Check auth, upload nothing |
| `--chrome-skip-submit-review` | Upload the zip but don't submit or publish it |
| `--chrome-publish-type STAGED_PUBLISH` | Hold the approved version until you publish it by hand |
| `--chrome-deploy-percentage <0-100>` | Staged rollout to a share of existing users |
| `--chrome-cancel-pending` | Cancel a review already in progress instead of failing |

Two subcommands that don't upload anything:

```bash
npx wxt submit status                                  # published / in-review status
npx wxt submit set-deploy-percentage --chrome-deploy-percentage 50
```

Run `npx wxt submit --help` for the full list.

## Troubleshooting

### "Missing .env.submit"

Follow **Setup** above.

### `TypeError: RegExp.escape is not a function`

You ran `wxt submit init` on Node older than 24. Upgrade Node, or write `.env.submit` by hand.

### Authentication fails

- Check `CHROME_API_VERSION="v2"` is set. Without it the tool silently uses the dead v1.1 API.
- Check the service account's email was added in the Developer Dashboard (Setup, step 2.4).
- Check the Chrome Web Store API is enabled on the service account's Google Cloud project.
- Check the private key is intact: the whole `private_key` value from the JSON, including its
  BEGIN and END marker lines and every `\n`, inside double quotes.

### "Extension not found" / permission errors

Check `CHROME_EXTENSION_ID` matches the dashboard, and that `CHROME_PUBLISHER_ID` is the
publisher that owns it, not your personal one if PinFlux lives under a group publisher.

### "Missing .output/pinflux-x.y.z-chrome.zip"

Run `npm run build && npm run zip` first. Note the version comes from `package.json` — if you
just bumped the version, you need a fresh zip.

### A review is already pending

Wait for it to finish, or resubmit with `--chrome-cancel-pending`.

### "Rate limit exceeded"

The Chrome Web Store caps publishes per day. Wait and retry.

## CI/CD (GitHub Actions)

Add these secrets to the repository:

- `CHROME_EXTENSION_ID`
- `CHROME_PUBLISHER_ID`
- `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`
- `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`, pasted with real line breaks, exactly as the PEM block
  looks once the JSON `\n` sequences are expanded

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
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and zip
        run: npm run build && npm run zip

      - name: Submit
        run: npx wxt submit --chrome-zip .output/pinflux-${GITHUB_REF_NAME#v}-chrome.zip
        env:
          CHROME_API_VERSION: v2
          CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
          CHROME_PUBLISHER_ID: ${{ secrets.CHROME_PUBLISHER_ID }}
          CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL: ${{ secrets.CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL }}
          CHROME_SERVICE_ACCOUNT_PRIVATE_KEY: ${{ secrets.CHROME_SERVICE_ACCOUNT_PRIVATE_KEY }}
```

Note the CI job calls `wxt submit` directly rather than `npm run submit`, because the wrapper
requires `.env.submit` to exist.
