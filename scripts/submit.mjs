// Hands the zip for the *current* package.json version to `wxt submit`.
//
// `wxt zip` names its artifact pinflux-<version>-chrome.zip, and .output/ is
// never cleaned between builds, so a glob like .output/*-chrome.zip would
// happily upload a two-year-old release. Resolving the name from the version
// keeps that from happening.
//
// Credentials come from .env.submit — this script passes no secrets of its
// own. Note that `wxt submit init` cannot generate that file: its refresh
// token step uses Google's out-of-band OAuth flow, removed in 2022. See
// CHROME_STORE_SETUP.md. Extra flags are forwarded, so
// `npm run submit -- --dry-run` checks auth without uploading.

import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8')
)

const zip = join(root, '.output', `pinflux-${version}-chrome.zip`)

if (!existsSync(zip)) {
  console.error(
    `Missing ${zip}\nRun \`npm run build && npm run zip\` first (or just \`npm run publish\`).`
  )
  process.exit(1)
}

if (!existsSync(join(root, '.env.submit'))) {
  console.error(
    `Missing .env.submit — copy .env.submit.example and fill it in.
See CHROME_STORE_SETUP.md (do not use \`wxt submit init\`, it is broken upstream).`
  )
  process.exit(1)
}

const wxt = process.platform === 'win32' ? 'wxt.cmd' : 'wxt'

spawn(
  join(root, 'node_modules', '.bin', wxt),
  ['submit', '--chrome-zip', zip, ...process.argv.slice(2)],
  { stdio: 'inherit' }
).on('exit', code => process.exit(code ?? 1))
