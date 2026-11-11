/// <reference path="../pb_data/types.d.ts" />

// Applies settings from environment variables each time PocketBase starts,
// so the Coolify env vars are the one place they are set. Only settings
// whose env var is set are changed; the rest keep what is in the admin UI.
//
//   SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD   the SMTP server
//   SMTP_TLS            "true" for implicit TLS (port 465); leave unset for
//                       STARTTLS on 587 (PocketBase upgrades automatically)
//   MAIL_SENDER_ADDRESS, MAIL_SENDER_NAME   the From of notifications
//   APP_URL             PocketBase's public URL (Settings → Application)
//   TRUSTED_PROXY_HEADER   e.g. CF-Connecting-IP behind Cloudflare. Without
//                       it, every visitor seems to have the proxy's IP and
//                       the rate limit counts them all together.
//   FORMS_RATE_LIMIT_MAX (default 5), FORMS_RATE_LIMIT_SECONDS (default 60)
//                       posts per IP to /api/forms/ in that window
//   PB_BACKUPS_CRON, PB_BACKUPS_KEEP   e.g. "30 2 * * *" and 7
//   PB_LOG_IP           "true" to keep visitors' IPs in PocketBase's request
//                       logs; by default they are left out
//
// Secrets set here (the SMTP password) are saved in PocketBase's settings
// table. Start PocketBase with --encryptionEnv=PB_ENCRYPTION_KEY and set
// that variable (32 characters) so they are stored encrypted.

onBootstrap((e) => {
  e.next(); // after this the database and settings are loaded

  const env = (name) => $os.getenv(name) || "";
  const settings = $app.settings();

  if (env("SMTP_HOST")) {
    settings.smtp.enabled = true;
    settings.smtp.host = env("SMTP_HOST");
    settings.smtp.port = parseInt(env("SMTP_PORT") || "587", 10);
    settings.smtp.username = env("SMTP_USERNAME");
    settings.smtp.password = env("SMTP_PASSWORD");
    settings.smtp.tls = env("SMTP_TLS") === "true";
  }
  if (env("MAIL_SENDER_ADDRESS")) settings.meta.senderAddress = env("MAIL_SENDER_ADDRESS");
  if (env("MAIL_SENDER_NAME")) settings.meta.senderName = env("MAIL_SENDER_NAME");
  if (env("APP_URL")) settings.meta.appURL = env("APP_URL");
  if (env("TRUSTED_PROXY_HEADER")) {
    settings.trustedProxy.headers = [env("TRUSTED_PROXY_HEADER")];
  }

  // PocketBase logs every request, with the IP, for 5 days by default.
  // Leave IPs out unless PB_LOG_IP=true (e.g. while chasing abuse).
  settings.logs.logIP = env("PB_LOG_IP") === "true";

  // Scheduled backups (Settings → Backups). S3 storage for them is set in
  // the admin UI, as it needs a secret key.
  if (env("PB_BACKUPS_CRON")) {
    settings.backups.cron = env("PB_BACKUPS_CRON");
    settings.backups.cronMaxKeep = parseInt(env("PB_BACKUPS_KEEP") || "7", 10);
  }

  // PocketBase's built-in rate limiter, per IP. A rule label ending in "/"
  // matches every path under it. Keep any other rules as they are.
  const label = "POST /api/forms/";
  const rule = {
    label: label,
    maxRequests: parseInt(env("FORMS_RATE_LIMIT_MAX") || "5", 10),
    duration: parseInt(env("FORMS_RATE_LIMIT_SECONDS") || "60", 10),
    audience: "",
  };
  const others = settings.rateLimits.rules.filter((r) => r.label !== label);
  settings.rateLimits.rules = [rule].concat(others);
  settings.rateLimits.enabled = true;

  $app.save(settings);
});
