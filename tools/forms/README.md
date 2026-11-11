# Forms

A shared forms back end for the static sites, to replace Netlify Forms when the sites move to Coolify. It's [PocketBase](https://pocketbase.io) with a few hooks:

- `POST /api/forms/{site}/{form}` takes an ordinary HTML form post. It checks it, saves it in a `form_submissions` collection, emails the site's inbox and redirects (303) to the site's thank-you page. It works with JavaScript turned off.
- `POST /api/forms/{site}/subscribe` adds an email address to a Maillayer list, for newsletter signups.
- A `fetch()` with a JSON body (or `Accept: application/json`) gets JSON back instead of a redirect.

Brick House's contact form is the first user. robertocarroll.com's newsletter signup is the likely second.

Nothing here ships to sites: `tools/` isn't in the package's `files`.

## Contents

- [What's in this folder](#whats-in-this-folder)
- [How a post is handled](#how-a-post-is-handled)
- [Brick House: the form before and after](#brick-house-the-form-before-and-after)
- [Newsletter signup (robertocarroll.com)](#newsletter-signup-robertocarrollcom)
- [Install on Hetzner + Coolify + Cloudflare Tunnel](#install-on-hetzner--coolify--cloudflare-tunnel)
- [Environment variables](#environment-variables)
- [Privacy and retention](#privacy-and-retention)
- [Try it locally](#try-it-locally)
- [Tests](#tests)
- [Adding a site or a form](#adding-a-site-or-a-form)
- [Upgrading PocketBase](#upgrading-pocketbase)
- [Research notes](#research-notes)
- [Open decisions](#open-decisions)

## What's in this folder

| Path | What it is |
|---|---|
| `pb_hooks/forms/config.js` | **The allowlist.** Every site, its forms, fields and thank-you pages |
| `pb_hooks/forms.pb.js` | Registers the two routes and the daily retention job |
| `pb_hooks/settings.pb.js` | Applies SMTP, sender, proxy, rate limit and backup settings from env vars at each start |
| `pb_hooks/forms/handler.js` | The request flow (honeypot, Turnstile, validation, save, email, redirect) |
| `pb_hooks/forms/lib.js` | Pure helpers, tested with plain Node |
| `pb_hooks/forms/pocketbase.js` | The glue between PocketBase and `handler.js` |
| `pb_migrations/1762214400_created_form_submissions.js` | Creates the `form_submissions` collection |
| `Dockerfile` | PocketBase v0.40.6 with the hooks and migration built in. Coolify builds this |
| `docker-compose.yml`, `example/` | Run it locally with a demo form and Mailpit |
| `test/` | Unit tests, flow tests with fakes, and an end-to-end test against a real PocketBase |
| `.env.example` | Every env var, with notes |

## How a post is handled

1. **Rate limit.** PocketBase's own per-IP limiter: 5 posts a minute to `/api/forms/` by default. Over that, PocketBase answers 429.
2. **Known site and form.** Both names must be in `config.js`, or the answer is 404. There's never a redirect for an unknown site.
3. **Origin.** If the browser sends an `Origin` header, it must be the site's own (or one listed in `origins`), or the answer is 403. Posts without `Origin` (curl, servers) are allowed through to the other checks.
4. **Honeypot.** If the hidden field (`bot-field`) has anything in it, the post is saved with `spam = true`, no email is sent, and the visitor is redirected as if it worked.
5. **Turnstile**, only for forms with `turnstile: true`. The token is checked with Cloudflare.
6. **Fields.** Only the fields named in the config are kept. Each is trimmed and has a length limit. Required fields and the email address are checked.
7. **Save** to `form_submissions`.
8. **Email** the site's notification address, with `Reply-To` set to the sender. If the email fails, the record is still saved and the error is logged.
9. **Redirect** with 303 to the thank-you page. For JSON: `{ "ok": true, "id": "…" }`.

When a check fails, an HTML post gets a small "Please check the form" page with a link back (or a redirect to the form's own `error` page, if it has one). A JSON post gets `{ "ok": false, "error": "…", "errors": { "field": "message" } }` with a 4xx status.

Thank-you and error URLs come only from `config.js`, never from the request, so the route can't be used as an open redirect.

## Brick House: the form before and after

Today (Netlify), in outline. It's a Netlify form named `contact` with a `bot-field` honeypot, posting to `/thanks`:

```html
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks">
  <input type="hidden" name="form-name" value="contact" />
  <p class="visually-hidden"><label>Don't fill this out: <input name="bot-field" /></label></p>
  <label>Name <input name="name" /></label>
  <label>Email <input name="email" type="email" required /></label>
  <label>Message <textarea name="message" required></textarea></label>
  <button type="submit">Send</button>
</form>
```

After the move:

```html
<form method="POST" action="https://forms.wearethoughtfox.com/api/forms/brickhouse/contact">
  <p class="visually-hidden" aria-hidden="true">
    <label>Don't fill this out: <input name="bot-field" tabindex="-1" autocomplete="off" /></label>
  </p>
  <label>Name <input name="name" autocomplete="name" /></label>
  <label>Email <input name="email" type="email" autocomplete="email" required /></label>
  <label>Message <textarea name="message" rows="6" required></textarea></label>
  <button type="submit">Send</button>
</form>
```

What changed:

- `action` is the forms URL. The thank-you page (`/thanks` on the Brick House site) is set in `config.js`, so it's no longer in the markup.
- `name="contact"`, `data-netlify`, `netlify-honeypot` and the hidden `form-name` input are gone. The form's name is in the URL.
- `bot-field` stays: it's the honeypot name in the config. `tabindex="-1"` and `aria-hidden` keep keyboard and screen reader users out of it.

The `/thanks` page itself doesn't change. The site's `/thanks` route already exists (it's in the snapshot paths).

Brick House's live site stays on Netlify until DNS moves. Don't change its form until then, or do it on the same deploy that moves it.

### With Turnstile (only if spam gets through)

Turnstile needs JavaScript, so a visitor with JavaScript off can't pass it. Leave it off unless the honeypot and rate limit aren't enough. To turn it on, set `turnstile: true` for the form in `config.js`, set `TURNSTILE_SECRET_KEY`, and add the widget to the form:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<!-- inside the <form>, before the button: -->
<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
```

The widget adds a `cf-turnstile-response` field, which the hook checks with Cloudflare and then drops.

### With fetch (optional)

The form works as it is. To stay on the page instead of loading `/thanks`, a site can add:

```js
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const res = await fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    headers: { Accept: "application/json" },
  });
  const result = await res.json(); // { ok: true } or { ok: false, errors: {…} }
});
```

## Newsletter signup (robertocarroll.com)

```html
<form method="POST" action="https://forms.wearethoughtfox.com/api/forms/robertocarroll/subscribe">
  <p class="visually-hidden" aria-hidden="true">
    <label>Don't fill this out: <input name="bot-field" tabindex="-1" autocomplete="off" /></label>
  </p>
  <label>Email <input name="email" type="email" autocomplete="email" required /></label>
  <button type="submit">Subscribe</button>
</form>
```

The route takes `email` and an optional `name`, and sends them to Maillayer's form endpoint for the form named in `config.js` (`maillayerForm`). On success PocketBase stores nothing; Maillayer has the subscriber. If Maillayer can't be reached, the address is saved in `form_submissions` (form `subscribe`, with `data.maillayer_error`) so it can be added by hand, and the visitor still sees the thank-you page.

**Before relying on it, check the request body.** Maillayer documents the endpoint, but not (in anything I could read) the body it expects. See [research notes](#maillayer). If it differs, change only `maillayerRequest()` in `pb_hooks/forms/lib.js` and its test.

## Install on Hetzner + Coolify + Cloudflare Tunnel

The plan: PocketBase and Maillayer run as Coolify apps on the VPS. Coolify itself stays on Tailscale. Cloudflare Tunnel brings public traffic in. Cloudflare Access puts a login in front of everything on the forms hostname **except** `/api/forms/`.

```
visitor ──https──▶ Cloudflare (Access, Tunnel) ──▶ cloudflared on the VPS ──▶ Coolify proxy (Traefik :80) ──▶ PocketBase :8080
Rob (admin) ─────▶ Cloudflare Access login ─────▶ same path, to /_/
```

### 1. Sending provider (Amazon SES)

The same SES account can serve PocketBase's notifications (over SMTP) and Maillayer's campaigns.

1. In SES, verify the domain you'll send from (for example `wearethoughtfox.com`). Add the DKIM CNAME records it gives you in Cloudflare DNS (DNS only, not proxied). Add or update SPF and DMARC as SES suggests.
2. Ask AWS to move the account out of the SES sandbox. In the sandbox it can only send to verified addresses.
3. For PocketBase: SES → SMTP settings → create SMTP credentials. Note the SMTP endpoint for your region (`email-smtp.<region>.amazonaws.com`), port 587. These go in `SMTP_HOST`, `SMTP_USERNAME` and `SMTP_PASSWORD`.
4. For Maillayer: add SES as a provider in its dashboard (it asks for the AWS keys or SMTP details).

Notifications are sent **from** `MAIL_SENDER_ADDRESS` (for example `forms@wearethoughtfox.com`) with **Reply-To** set to the visitor, so replying in the inbox answers them. They are not sent "from" the visitor's address, which would fail SPF/DMARC.

Any SMTP provider works the same way (Postmark, Mailgun, Brevo): only the four `SMTP_*` values change.

### 2. Maillayer as a Coolify app

From Maillayer's [Install on Coolify](https://maillayer.com/docs/install-coolify) and [Docker Compose](https://maillayer.com/docs/install-docker-compose) docs and its [installer](https://github.com/mddanishyusuf/maillayer-installer):

1. Buy a licence (one-time payment). Coolify → New resource → **Docker Compose Empty**, and paste:

   ```yaml
   services:
     maillayer:
       image: ghcr.io/mddanishyusuf/maillayer-pro:v1.7.0   # or :1 to follow 1.x
       restart: unless-stopped
       volumes:
         - maillayer-data:/app/data
       environment:
         - AUTH_SECRET=${AUTH_SECRET}
         - APP_URL=${APP_URL}
         - MAILLAYER_NO_CADDY=1
   volumes:
     maillayer-data:
   ```

2. Env vars: `AUTH_SECRET` (make one with `openssl rand -base64 48`) and `APP_URL` (its public URL, e.g. `https://mail.wearethoughtfox.com`). Without `APP_URL`, licence activation fails with `invalid_domain`. **Back up `AUTH_SECRET`**: it decrypts the stored provider credentials.
3. Domain in Coolify: `http://mail.wearethoughtfox.com` on port 3000 (http, because Cloudflare does TLS; see step 4).
4. Keep replicas at 1 (SQLite).
5. Sign in, create the owner account, activate the licence, add SES.
6. Create a **lead capture** form (Contacts → Forms) with "create contact" on and the tags or list you want, for example slug `newsletter`. That slug goes in `config.js` (`maillayerForm`).

Maillayer needs to be partly public too: unsubscribe links, open and click tracking, and its hosted pages are opened by readers. Put Cloudflare Access in front of its dashboard but not those paths. I couldn't read which paths those are; check before locking it down. See [open decisions](#open-decisions).

For `MAILLAYER_URL`, PocketBase can use the public URL, or an internal one if both apps share a Docker network in Coolify.

### 3. PocketBase as a Coolify app

1. Coolify → New resource → **Application** → from GitHub (`wearethoughtfox/toolkit`, branch `main`).
2. Build pack: **Dockerfile**. Base directory: `/tools/forms`. Port: `8080`.
3. Watch paths: `tools/forms/**`, so pushes to other parts of the repo don't redeploy it.
4. Persistent storage: a volume mounted at `/pb/pb_data`. This is the database, logs and local backups. Without it, every deploy starts empty.
5. Domain: `http://forms.wearethoughtfox.com` (http, not https: Cloudflare does TLS. HTTPS here causes redirect loops behind the tunnel, per [Coolify's tunnel docs](https://coolify.io/docs/knowledge-base/cloudflare/tunnels/all-resource)).
6. Environment variables: see [below](#environment-variables). At least `PB_ENCRYPTION_KEY`, `TRUSTED_PROXY_HEADER`, the `SMTP_*` and `MAIL_*` values, and `FORMS_NOTIFY_BRICKHOUSE`.
7. Deploy. Then make the superuser from the app's Terminal in Coolify:

   ```bash
   /pb/pocketbase superuser upsert rob@wearethoughtfox.com 'a-long-password' --dir=/pb/pb_data
   ```

**Why the hooks are built in, not mounted.** The `Dockerfile` copies `pb_hooks` and `pb_migrations` into the image. A change is a commit and a push, Coolify rebuilds, and what runs is always what's in the repo. Mounting them (Coolify → Persistent storage → directory mount to `/pb/pb_hooks` and `/pb/pb_migrations`) also works, if you'd rather edit on the server; then add `--hooksWatch=true` to the start command. Locally, `docker-compose.yml` mounts them.

Migrations run on each start. `--automigrate=false` stops the admin UI from writing new migration files into the container; change the schema with a new file in `pb_migrations/` instead.

### 4. The public hostname

The forms must be reachable from the public internet. Coolify must not be.

- If the tunnel already sends all hostnames to the Coolify proxy (`http://localhost:80`, as in [Coolify's "all resources" setup](https://coolify.io/docs/knowledge-base/cloudflare/tunnels/all-resource)), add a CNAME for `forms` in Cloudflare DNS to the tunnel (or add a public hostname `forms.wearethoughtfox.com` → `http://localhost:80` in the tunnel's settings). Do the same for `mail` (Maillayer).
- Coolify's own dashboard has no public hostname. It stays on Tailscale.
- The Hetzner firewall should not allow 80/443 in from the internet if everything comes through the tunnel. Otherwise someone could reach Traefik directly, skip Cloudflare Access, and set their own `CF-Connecting-IP` header.

Check: `curl -I https://forms.wearethoughtfox.com/api/health` should reach Cloudflare Access (step 5) and, once logged in, PocketBase.

### 5. Lock everything except `/api/forms/` behind Cloudflare Access

PocketBase serves more than the admin UI (`/_/`): its REST API (`/api/collections/…`, including the superuser login), `/api/health`, file downloads and realtime. The collection rules already block the public, but there's no reason to expose any of it. So protect the **whole hostname**, and let only `/api/forms/` through.

In Cloudflare Zero Trust → Access → Applications:

1. **Add an application** → Self-hosted. Name: `Forms admin`. Domain: `forms.wearethoughtfox.com`, path empty. Policy: **Allow**, Include → Emails → your address. Session duration as you like.
2. **Add a second application** → Self-hosted. Name: `Forms public API`. Domain: `forms.wearethoughtfox.com`, path `api/forms/`. Policy: **Bypass**, Include → Everyone.

Cloudflare's [application paths](https://developers.cloudflare.com/cloudflare-one/policies/access/app-paths/) docs say the more specific path wins and doesn't inherit from the parent, so the bypass applies to `/api/forms/…` only. Forum posts report this behaving inconsistently, so **test it after setup**:

```bash
# Should be a redirect to the Cloudflare Access login (302/403), not PocketBase:
curl -sI https://forms.wearethoughtfox.com/_/
curl -sI https://forms.wearethoughtfox.com/api/health
curl -s -X POST https://forms.wearethoughtfox.com/api/collections/_superusers/auth-with-password

# Should reach PocketBase: a 303 to the Brick House thank-you page.
curl -si -X POST https://forms.wearethoughtfox.com/api/forms/brickhouse/contact \
  -d 'email=test@example.com&message=Access+test&bot-field=' | head -5
```

A stricter option is to route only `/api/forms/` through the tunnel (a path rule on the tunnel's public hostname) and reach the admin UI over Tailscale only. Then the admin is never on the public hostname at all.

PocketBase also has a superuser IP allowlist (`pocketbase superuser ips …`), but behind Cloudflare the IP it sees is the visitor's public IP, so Access is the simpler lock.

### 6. Turnstile (optional)

1. Cloudflare dashboard → Turnstile → Add widget. Hostnames: the sites that use it (the Brick House domain, `robertocarroll.com`). Mode: Managed.
2. The **site key** is public: it goes in the site's HTML (`data-sitekey`).
3. The **secret key** goes in Coolify as `TURNSTILE_SECRET_KEY`. One widget can cover several hostnames. For a separate widget per site, set `turnstileSecretEnv` on the site in `config.js` to another env var name.
4. Set `turnstile: true` on the form in `config.js`, and redeploy.

The hook also checks that the hostname Cloudflare reports is one of the site's own.

### 7. Backups

- **PocketBase:** set `PB_BACKUPS_CRON` (e.g. `30 2 * * *`) and `PB_BACKUPS_KEEP` (e.g. `7`). Backups are zips in `pb_data/backups`, on the same disk. For off-site copies, set S3 storage in the admin UI (Settings → Backups → Use S3); Hetzner Object Storage is S3-compatible. A backup is restored from the same page.
- **Keep `PB_ENCRYPTION_KEY` somewhere safe** (a password manager). A restored backup's settings can't be read without it.
- **Maillayer:** its volume holds the SQLite database and its own nightly backups. Back up `AUTH_SECRET` with it.
- Coolify can also back up volumes. Either way, test a restore once.

### 8. Go live for a site

1. Set the site's real `url` (and `origins`) in `config.js`, and its `FORMS_NOTIFY_…` env var in Coolify. Push.
2. Send a test post with curl (step 5). Check the email arrives and the record is in the admin UI.
3. Change the site's form markup, deploy the site, and send one real message from the live page.

## Environment variables

Set in Coolify for the PocketBase app. Also listed in `.env.example`.

| Variable | Needed | What it does |
|---|---|---|
| `PB_ENCRYPTION_KEY` | yes | 32 characters. Encrypts stored settings. Back it up |
| `TRUSTED_PROXY_HEADER` | yes | `CF-Connecting-IP`. Without it every visitor shares the proxy's IP, so the rate limit counts them all as one |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | yes | The SMTP server for notifications. Port 587 uses STARTTLS |
| `SMTP_TLS` | no | `true` only for implicit TLS on port 465 |
| `MAIL_SENDER_ADDRESS`, `MAIL_SENDER_NAME` | yes | The From of notifications. The domain must be verified with the provider |
| `APP_URL` | no | PocketBase's public URL |
| `FORMS_NOTIFY_BRICKHOUSE` | yes | Brick House's inbox. Comma-separated for several |
| `FORMS_NOTIFY_ROBERTOCARROLL` | no | Not used by the subscribe route; for any future robertocarroll.com form |
| `MAILLAYER_URL` | for newsletters | Maillayer's base URL |
| `TURNSTILE_SECRET_KEY` | for Turnstile | The widget's secret key |
| `FORMS_RATE_LIMIT_MAX`, `FORMS_RATE_LIMIT_SECONDS` | no | Default 5 posts per 60 seconds per IP |
| `FORMS_RETENTION_DAYS` | no | Delete messages after this many days. Default 365. `0` keeps them |
| `FORMS_SPAM_RETENTION_DAYS` | no | Delete spam after this many days. Default 30 |
| `PB_BACKUPS_CRON`, `PB_BACKUPS_KEEP` | no | PocketBase's scheduled backups |
| `PB_LOG_IP` | no | `true` keeps visitors' IPs in PocketBase's request logs. Off by default |

`settings.pb.js` applies these at every start, so the env vars win over changes made in the admin UI for the same settings. Settings without an env var (S3 for backups, for example) are left as they are.

## Privacy and retention

- **Stored:** the site, the form, the fields the config names (for Brick House: name, email, message), a copy of the sender's email, a spam flag, and the time. Nothing else from the post is kept: extra fields, the honeypot and the Turnstile token are dropped.
- **Not stored:** IP address, user agent, referrer. The IP is used for the rate limit (in memory) and sent to Cloudflare with the Turnstile check, and that's all. It's left out of PocketBase's request logs too (below).
- **Who can read it:** superusers only. The collection has no public API rules.
- **Retention:** a job runs daily at 03:17 and deletes spam after 30 days and every record after 365 days (both set by env vars). The notification email is the working copy. PocketBase's copy is the backup and the audit trail. Backups keep deleted records until the backups themselves roll over.
- **Newsletter:** a successful signup is only in Maillayer. Unsubscribes and deletion happen there.
- **Request logs:** PocketBase logs each request (method, path, status) and keeps the logs for 5 days (Settings → Logs). It would log the IP too, but `settings.pb.js` turns that off at every start. Set `PB_LOG_IP=true` to keep IPs for a while, for example while looking into abuse.

Mention the form back end in each site's privacy notice: what's collected, why, how long, and where it's hosted (your Hetzner server, and the email provider that delivers the notification).

## Try it locally

Needs Docker:

```bash
cd tools/forms
docker compose up --build
```

- <http://localhost:8090/>: a demo contact form. Send it with JavaScript off and you land on the thank-you page.
- <http://localhost:8025/>: Mailpit, where the notification email lands.
- <http://localhost:8090/_/>: the PocketBase admin. The log prints a link to create the first superuser.

The `demo` site exists only when `FORMS_DEMO=1`, which the compose file sets.

Without Docker, use a PocketBase binary from its [releases](https://github.com/pocketbase/pocketbase/releases):

```bash
FORMS_DEMO=1 FORMS_NOTIFY_DEMO=you@example.com ./pocketbase serve \
  --http=127.0.0.1:8090 --hooksDir=./pb_hooks --migrationsDir=./pb_migrations --publicDir=./example
```

(Without SMTP the email fails and is logged; the post is still saved and redirected.)

## Tests

```bash
cd tools/forms
npm test
```

- `test/lib.test.js`: the pure helpers.
- `test/handler.test.js`: the whole flow, with fakes for the database, mail and HTTP.
- `test/integration.test.js`: the real hooks and migration in a real PocketBase. It's skipped unless `POCKETBASE_BIN` points to a binary:

  ```bash
  POCKETBASE_BIN=~/bin/pocketbase npm test
  ```

  It runs PocketBase in a temporary folder with a test config, catches outgoing mail instead of sending it, and fakes Turnstile and Maillayer. It checks the 303 redirect, urlencoded, multipart and JSON posts, the honeypot, Turnstile, the subscribe route, the rate limit, the retention job, the settings from env vars, and that the public API can't read the collection.

No dependencies to install: it's Node's built-in test runner (Node 20 or later).

## Adding a site or a form

Edit `pb_hooks/forms/config.js`:

```js
ashbright: {
  name: "Ashbright",
  url: "https://ashbright.example",
  notifyEnv: "FORMS_NOTIFY_ASHBRIGHT",
  honeypot: "bot-field",
  forms: {
    enquiry: {
      fields: ["name", "email", "phone", "message"],
      required: ["email", "message"],
      thanks: "/thanks",
    },
  },
},
```

Then add `FORMS_NOTIFY_ASHBRIGHT` in Coolify and push. The form posts to `/api/forms/ashbright/enquiry`. A form can't be called `subscribe`: that name is the newsletter route.

## Upgrading PocketBase

Change `PB_VERSION` in the `Dockerfile`. Read the [changelog](https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md) first: PocketBase is pre-1.0 and its JS API has changed between minor versions (v0.23 was a big one). Run the integration test against the new binary before deploying. To pin the download, put the zip's SHA-256 (from the release's `checksums.txt`) in `PB_SHA256`.

v0.40.6's notes say it's "most likely the last release here on GitHub" and later releases will come from `https://ganigeorgiev.com`. When that happens, change the download URL in the `Dockerfile`.

## Research notes

Checked on 4 November 2026. "Confirmed" means I read it in the source, the published image, or the vendor's own docs. The rest is marked.

### PocketBase

**Version: v0.40.6** (23 October 2026), from the Go module proxy (`proxy.golang.org/github.com/pocketbase/pocketbase/@latest`). I built that version from source (`examples/base`, which the release binaries are built from) and ran every hook in this folder against it.

Confirmed from the v0.40.6 source and its JS type definitions (`plugins/jsvm/internal/types/generated/types.d.ts`), and by running it:

- **Hooks** are `pb_hooks/*.pb.js`, loaded at start. `--hooksDir` sets the folder. Other `.js` files there are loaded only with `require()`.
- **Each handler runs in its own isolated context.** A handler can't see variables declared at the top of its `.pb.js` file (tested: `ReferenceError`). Shared code must be loaded with `require()` inside the handler, which is why the logic is in `pb_hooks/forms/*.js`. Top-level values can be used while registering a route (e.g. its middleware).
- **Routes:** `routerAdd(method, path, handler, ...middlewares)`. Path parameters are `{name}`, read with `e.request.pathValue("name")`. Go's router picks the literal `/subscribe` over `/{form}`.
- **Body parsing:** `e.requestInfo().body` reads urlencoded, multipart and JSON bodies into one object. For form posts it converts `"true"` to `true` and (multipart) `"3"` to `3`, but keeps `"07700"` as a string. `lib.normaliseBody()` turns every value back into a string.
- **Responses:** `e.redirect(303, url)` (any 3xx status), `e.json()`, `e.html()`.
- **Mailer:** `$app.newMailClient().send(new MailerMessage({ from, to, subject, html, text, headers }))`. It uses SMTP from settings, or `sendmail` when SMTP is off. `onMailerSend` can intercept mail (the tests use it).
- **Outgoing HTTP:** `$http.send({ url, method, headers, body, timeout })` returns `{ statusCode, json, body }`.
- **Migrations:** `pb_migrations/*.js` with `migrate(up, down)`, run on `serve`. `--automigrate` (default true) writes migration files when the schema changes in the admin UI.
- **Collections:** `new Collection({ type, name, fields, indexes, listRule… })`. A rule of `null` means superusers only.
- **Rate limiter:** built in, per IP, off by default. Rules have a label (a path prefix ending in `/` matches everything under it), `maxRequests` and `duration` in seconds. It uses `e.realIP()`, which reads the trusted proxy headers from settings.
- **Settings in hooks:** `onBootstrap((e) => { e.next(); … $app.save($app.settings()) })` works.
- **Encryption:** with `--encryptionEnv=NAME` and that env var set, settings are stored encrypted. With the env var empty, they're stored as plain JSON.
- **CLI:** `pocketbase superuser upsert EMAIL PASS`, and `superuser ips` for an IP allowlist.
- **Docker:** there's no official image. PocketBase's "Going to production" docs give an Alpine Dockerfile that downloads the release zip; ours follows it (seen through an [archived copy](https://pocketbase.io/old/docs/going-to-production); pocketbase.io itself wasn't reachable from here).

Not confirmed: the release zip URL pattern (`…/releases/download/vX/pocketbase_X_linux_amd64.zip`) is the long-standing one, but GitHub wasn't reachable from here to check v0.40.6's assets. The first Coolify build will show it.

### Maillayer

[maillayer.com](https://maillayer.com/) itself wasn't reachable from this session, so these come from search-engine extracts of its docs, its public installer repo and its published Docker image.

Confirmed:

- **What it is:** a self-hosted email marketing app (campaigns, contacts, sequences, forms, a transactional API), sold for a one-time payment. The code is private ([installer README](https://github.com/mddanishyusuf/maillayer-installer): "Image source: … (private)").
- **Image:** `ghcr.io/mddanishyusuf/maillayer-pro`, public. Latest tag **v1.7.0** (from the registry's tag list, 4 November 2026). `:1` follows 1.x.
- **Stack:** one container, Next.js and SQLite in one Node process, no Postgres or Redis ([docs index](https://maillayer.com/docs)). Data in `/app/data` (SQLite database, nightly backups). Listens on 3000. Health check at `/api/health`. ([installer](https://github.com/mddanishyusuf/maillayer-installer/blob/main/install.sh))
- **Env vars:** `AUTH_SECRET` (encrypts stored credentials; back it up), `APP_URL` (public URL; licence activation fails with `invalid_domain` without it), `MAILLAYER_NO_CADDY=1` when you bring your own proxy. ([Docker Compose docs](https://maillayer.com/docs/install-docker-compose), installer)
- **Coolify:** an official [Install on Coolify](https://maillayer.com/docs/install-coolify) page: Docker Compose Empty resource, the image on port 3000, a named volume at `/app/data`, replicas 1. It says Maillayer detects Coolify and hides its own domain settings.
- **Sending:** SMTP, Amazon SES, SendGrid or Mailgun ([docs](https://maillayer.com/docs)).
- **Forms:** lead capture, feedback and custom forms. A hosted page at `/f/<slug>`, an iframe, a JS snippet, and an API endpoint **`POST /api/public/forms/:slug/submit`** "for custom UIs or backend submission". A lead capture form upserts the contact by email and applies the form's tags. ([Forms docs](https://maillayer.com/docs/forms))
- **Other public endpoints:** `POST /api/public/sequences/:apiKey/enroll` ([Sequences docs](https://maillayer.com/docs/sequences)). The docs have a "Public API" reference page and a "Transactional API" page.

Not confirmed (couldn't read the pages):

- **The request body for the form endpoint.** The code sends `{ "email", "name" }` as JSON. Check it in your Maillayer (Forms page, or Reference → Public API) before going live.
- **The Transactional API**: its endpoint, auth and body. The docs list it, so Maillayer probably *can* send one-off emails.
- **Lists vs tags.** The docs describe contacts with tags; Maillayer's feedback board mentions an endpoint that adds contacts to a list. Whichever it is, the lead capture form decides it.
- **Double opt-in.** Not mentioned in the Forms docs extract. If it isn't there, decide whether that's acceptable (see below).
- **Which Maillayer paths must stay public** (unsubscribe, tracking, hosted forms).
- A [Railway guide](https://maillayer.com/docs/deploy-railway) on the same site mentions MongoDB and Redis. It looks like an older version; the current docs and the installer say SQLite only.

Not to be confused with `@maillayer/*` on npm and maillayer.dev, an unrelated TypeScript email SDK.

**Decision: notifications use PocketBase's own mailer (SMTP), Maillayer is for lists only.** PocketBase's mailer is confirmed and tested here. Maillayer's transactional API probably exists, but I couldn't confirm how it works, and it would make every contact form depend on a second app being up. Both can use the same SES account.

### Cloudflare

- Turnstile [server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/): `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret`, `response` and optional `remoteip`. The answer has `success`, `hostname` and `error-codes`. [Test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/): secret `1x0000000000000000000000000000000AA` always passes, `2x…AA` always fails; site key `1x00000000000000000000AA`.
- Access [application paths](https://developers.cloudflare.com/cloudflare-one/policies/access/app-paths/): a more specific path takes precedence and doesn't inherit from the parent.
- Coolify with Cloudflare Tunnel ([all resources](https://coolify.io/docs/knowledge-base/cloudflare/tunnels/all-resource)): the tunnel points at Coolify's proxy on `localhost:80`, and each resource's domain is entered with `http://`.

From memory, not re-checked here: the SES steps (domain verification, sandbox, SMTP credentials) and the Cloudflare dashboard menu names. These change from time to time.

## Open decisions

1. **The forms hostname.** `forms.wearethoughtfox.com` is assumed everywhere. One hostname for all sites keeps it simple; a per-site one (`forms.brickhouse…`) looks tidier to clients but needs a tunnel route, Access app and config per site.
2. **Brick House's real domain** in `config.js` (now `https://brickhouse.example`), and whether `www.` is used.
3. **Required fields** for Brick House: email and message are required, name isn't. Match whatever the current form's `required` attributes are.
4. **Retention:** 365 days for messages and 30 for spam are my defaults. Shorter is better for privacy; the emails are the working copy.
5. **Keep spam records?** They help find false positives, and are deleted after 30 days. The other choice is to drop them at once.
6. **Built-in vs mounted hooks** in Coolify (see [step 3](#3-pocketbase-as-a-coolify-app)). Built-in is the default here.
7. **Turnstile** stays off for now (honeypot and rate limit only), since it needs JavaScript. Turn it on per form if spam gets through.
8. **The newsletter, if Maillayer fails:** the visitor is thanked and the address is kept for adding by hand. The other choice is to show an error and ask them to try again.
9. **Double opt-in** for newsletter signups, if Maillayer doesn't offer it. Check what the Buttondown signup does today and keep the same.
10. **How public Maillayer is:** which of its paths skip Cloudflare Access (unsubscribe and tracking links must work for every reader).
11. **Admin access:** Access on the whole hostname (as written), or the stricter tunnel path rule with the admin over Tailscale only.
