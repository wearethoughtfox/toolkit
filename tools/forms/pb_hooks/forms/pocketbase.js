// The PocketBase side: turns a PocketBase request event into the plain
// request that handler.js expects, gives it the real "deps" (save, mail,
// HTTP), and writes its answer back to the response.
//
// This module uses PocketBase's globals ($app, $http, $os, Record,
// MailerMessage), so it runs only inside PocketBase. Everything that can
// be tested without PocketBase lives in lib.js and handler.js.
//
// Why a module and not code in forms.pb.js: PocketBase runs each route
// handler in its own isolated JS context, so a handler can't see
// variables declared at the top of a .pb.js file. Shared code has to be
// loaded with require() inside the handler.

"use strict";

var handler = require(__hooks + "/forms/handler.js");
var configFn = require(__hooks + "/forms/config.js");

var COLLECTION = "form_submissions";

function getenv(name) {
  return $os.getenv(name) || "";
}

function makeDeps() {
  return {
    config: configFn(getenv),
    getenv: getenv,

    // Returns { statusCode, json }. Throws on network errors.
    httpSend: function (req) {
      var res = $http.send({
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        timeout: req.timeout || 10,
      });
      return { statusCode: res.statusCode, json: res.json };
    },

    // Saves one record and returns its id. Throws if it can't.
    saveSubmission: function (s) {
      var collection = $app.findCollectionByNameOrId(COLLECTION);
      var record = new Record(collection);
      record.set("site", s.site);
      record.set("form", s.form);
      record.set("data", s.data);
      record.set("email", s.email || "");
      record.set("spam", !!s.spam);
      $app.save(record);
      return record.id;
    },

    // Sends through PocketBase's mailer: the SMTP server set in
    // Settings → Mail (settings.pb.js fills it from env vars).
    sendMail: function (m) {
      var meta = $app.settings().meta;
      var headers = {};
      if (m.replyTo) headers["Reply-To"] = m.replyTo;
      var message = new MailerMessage({
        from: { address: meta.senderAddress, name: meta.senderName },
        to: m.to.map(function (address) {
          return { address: address };
        }),
        subject: m.subject,
        text: m.text,
        html: m.html,
        headers: headers,
      });
      $app.newMailClient().send(message);
    },

    log: {
      info: function (msg, data) {
        $app.logger().info(msg, "data", data || {});
      },
      error: function (msg, data) {
        $app.logger().error(msg, "data", data || {});
      },
    },
  };
}

function toRequest(e) {
  var info = e.requestInfo();
  return {
    siteId: e.request.pathValue("site"),
    formId: e.request.pathValue("form"),
    rawBody: info.body,
    contentType: e.request.header.get("Content-Type"),
    accept: e.request.header.get("Accept"),
    origin: e.request.header.get("Origin"),
    // The visitor's IP from the trusted proxy header (CF-Connecting-IP
    // behind Cloudflare). Used only for the Turnstile check; never stored.
    ip: e.realIP(),
  };
}

function send(e, res) {
  // Answers depend on the request, never cache them.
  e.response.header().set("Cache-Control", "no-store");
  if (res.redirect) return e.redirect(303, res.redirect);
  if (res.json) return e.json(res.status, res.json);
  return e.html(res.status, res.html);
}

// kind: "form" or "subscribe"
function run(e, kind) {
  var deps = makeDeps();
  var req = toRequest(e);
  var res = kind === "subscribe" ? handler.handleSubscribe(req, deps) : handler.handleForm(req, deps);
  return send(e, res);
}

// Delete old records. Spam goes after FORMS_SPAM_RETENTION_DAYS (default
// 30). Real messages go after FORMS_RETENTION_DAYS (default 365); set it
// to 0 to keep them until deleted by hand.
function retention() {
  var spamDays = parseInt(getenv("FORMS_SPAM_RETENTION_DAYS") || "30", 10);
  var keepDays = parseInt(getenv("FORMS_RETENTION_DAYS") || "365", 10);
  var removed = 0;

  // PocketBase stores dates as "2006-01-02 15:04:05.000Z", which sorts
  // as text, so a string compare with SQLite's strftime works.
  function purge(where, days) {
    if (!(days > 0)) return;
    var result = $app
      .db()
      .newQuery(
        "DELETE FROM " + COLLECTION + " WHERE " + where +
          " AND created < strftime('%Y-%m-%d %H:%M:%fZ', 'now', {:offset})"
      )
      .bind({ offset: "-" + days + " days" })
      .execute();
    removed += result.rowsAffected();
  }

  purge("spam = TRUE", spamDays);
  purge("1 = 1", keepDays);
  if (removed) $app.logger().info("forms: retention removed old records", "count", removed);
}

module.exports = { run: run, retention: retention };
