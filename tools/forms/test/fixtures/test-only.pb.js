/// <reference path="../pb_data/types.d.ts" />

// TEST ONLY. The integration test copies this into a temporary pb_hooks
// folder. It must never be deployed: it exposes records without auth.
//
// - Catches outgoing mail (nothing is really sent) so tests can read it.
// - Lists form_submissions, ages a record and runs the retention job.

onMailerSend((e) => {
  const list = JSON.parse($app.store().get("test_mail") || "[]");
  list.push({
    from: e.message.from.address,
    to: e.message.to.map((a) => a.address),
    subject: e.message.subject,
    text: e.message.text,
    headers: e.message.headers,
  });
  $app.store().set("test_mail", JSON.stringify(list));
  // e.next() is not called, so the message is not sent.
});

routerAdd("GET", "/api/test/mail", (e) => e.json(200, JSON.parse($app.store().get("test_mail") || "[]")));

routerAdd("GET", "/api/test/records", (e) => e.json(200, $app.findAllRecords("form_submissions")));

routerAdd("POST", "/api/test/age/{id}/{days}", (e) => {
  $app
    .db()
    .newQuery("UPDATE form_submissions SET created = strftime('%Y-%m-%d %H:%M:%fZ', 'now', {:offset}) WHERE id = {:id}")
    .bind({ id: e.request.pathValue("id"), offset: "-" + e.request.pathValue("days") + " days" })
    .execute();
  return e.json(200, { ok: true });
});

routerAdd("POST", "/api/test/retention", (e) => {
  require(`${__hooks}/forms/pocketbase.js`).retention();
  return e.json(200, { ok: true });
});

routerAdd("GET", "/api/test/settings", (e) => {
  const s = $app.settings();
  return e.json(200, {
    smtp: { enabled: s.smtp.enabled, host: s.smtp.host, port: s.smtp.port, tls: s.smtp.tls },
    senderAddress: s.meta.senderAddress,
    trustedProxy: s.trustedProxy.headers,
    logIP: s.logs.logIP,
    backups: { cron: s.backups.cron, keep: s.backups.cronMaxKeep },
    rateLimits: { enabled: s.rateLimits.enabled, first: s.rateLimits.rules[0] },
  });
});
