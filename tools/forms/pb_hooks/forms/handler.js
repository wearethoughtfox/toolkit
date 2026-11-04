// The request flow for both routes, written against a small set of
// "deps" (save a record, send an email, make an HTTP call) instead of
// PocketBase's globals. `forms.pb.js` passes in the real PocketBase
// versions; the tests pass in fakes. This file has no PocketBase calls.
//
// Each handler takes a plain request object:
//   { siteId, formId, body, contentType, accept, origin, ip }
// and returns what to send back, one of:
//   { status: 303, redirect: "https://…" }
//   { status: 200|4xx|5xx, json: { … } }
//   { status: 4xx|5xx, html: "<!doctype html>…" }

"use strict";

var lib = require("./lib.js");

// Answer with JSON or with HTML, depending on who asked.
function fail(req, site, status, code, message, errors) {
  if (req.json) {
    return { status: status, json: { ok: false, error: code, message: message, errors: errors || {} } };
  }
  // A site can name its own error page. Validation details are not passed
  // in the URL (they could carry what the visitor typed).
  if (site && req.form && req.form.error && status === 400) {
    return { status: 303, redirect: lib.resolveSiteUrl(site, req.form.error) };
  }
  var shown = errors && Object.keys(errors).length ? errors : { form: message };
  return { status: status, html: lib.errorPage(site, shown) };
}

function succeed(req, site, extra) {
  if (req.json) {
    var body = { ok: true };
    Object.keys(extra || {}).forEach(function (k) {
      body[k] = extra[k];
    });
    return { status: 200, json: body };
  }
  return { status: 303, redirect: lib.resolveSiteUrl(site, req.form.thanks) };
}

// Shared first steps: known site and form, allowed origin, parsed body.
// Returns { done } with a response to send now, or { site, form }.
function prepare(req, deps) {
  req.json = lib.wantsJson(req.contentType, req.accept);
  var found = lib.lookup(deps.config, req.siteId, req.formId);
  if (found.error) {
    // No redirect here: an unknown site has no thank-you page we trust.
    return { done: fail(req, null, 404, found.error, "Unknown site or form.") };
  }
  req.form = found.form;
  var site = found.site;
  if (!lib.originAllowed(site, req.origin)) {
    deps.log.info("forms: origin not allowed", { site: req.siteId, origin: req.origin });
    return { done: fail(req, site, 403, "origin_not_allowed", "This form can't be sent from that website.") };
  }
  req.body = lib.normaliseBody(req.rawBody);
  return { site: site, form: found.form };
}

// Cloudflare Turnstile, when the form config turns it on.
// Returns null when it passes, or a response to send.
function checkTurnstile(req, site, form, deps) {
  if (!form.turnstile) return null;
  var secretEnv = site.turnstileSecretEnv || "TURNSTILE_SECRET_KEY";
  var secret = deps.getenv(secretEnv);
  if (!secret) {
    deps.log.error("forms: Turnstile is on but " + secretEnv + " is not set", { site: req.siteId });
    return fail(req, site, 500, "not_configured", "This form isn't set up yet. Please try again later.");
  }
  var token = req.body[lib.TURNSTILE_FIELD];
  if (!token || Array.isArray(token)) {
    return fail(req, site, 400, "turnstile_missing", "Please complete the check before sending.");
  }
  var result;
  try {
    result = deps.httpSend(lib.turnstileRequest(secret, token, req.ip, deps.getenv("TURNSTILE_VERIFY_URL")));
  } catch (err) {
    deps.log.error("forms: Turnstile request failed", { site: req.siteId, error: String(err) });
    return fail(req, site, 502, "turnstile_unavailable", "We couldn't check the form. Please try again.");
  }
  if (!lib.turnstilePassed(site, result && result.json)) {
    deps.log.info("forms: Turnstile failed", { site: req.siteId, codes: result && result.json && result.json["error-codes"] });
    return fail(req, site, 400, "turnstile_failed", "The check didn't pass. Please try again.");
  }
  return null;
}

// POST /api/forms/{site}/{form}
function handleForm(req, deps) {
  var p = prepare(req, deps);
  if (p.done) return p.done;
  var site = p.site;
  var form = p.form;
  var honeypot = form.honeypot || site.honeypot;

  // A filled honeypot means a bot. Save it flagged as spam (so a false
  // positive can be found), send no email, and answer as if it worked so
  // the bot learns nothing.
  if (lib.honeypotFilled(req.body, honeypot)) {
    var spam = lib.pickFields(req.body, form);
    try {
      deps.saveSubmission({ site: req.siteId, form: req.formId, data: spam.data, email: spam.email, spam: true });
    } catch (err) {
      deps.log.error("forms: could not save spam record", { site: req.siteId, error: String(err) });
    }
    return succeed(req, site);
  }

  var blocked = checkTurnstile(req, site, form, deps);
  if (blocked) return blocked;

  var picked = lib.pickFields(req.body, form);
  if (Object.keys(picked.errors).length) {
    return fail(req, site, 400, "invalid", "Please check the form.", picked.errors);
  }

  var recordId;
  try {
    recordId = deps.saveSubmission({
      site: req.siteId,
      form: req.formId,
      data: picked.data,
      email: picked.email,
      spam: false,
    });
  } catch (err) {
    deps.log.error("forms: could not save submission", { site: req.siteId, form: req.formId, error: String(err) });
    return fail(req, site, 500, "save_failed", "Sorry, we couldn't save your message. Please try again or email us.");
  }

  // The record is saved, so a failed email doesn't fail the request.
  // It is logged, and the message is still in PocketBase.
  var to = site.notifyEnv ? deps.getenv(site.notifyEnv) : "";
  if (to) {
    var mail = lib.buildNotification({ site: site, formId: req.formId, data: picked.data, email: picked.email, recordId: recordId });
    try {
      deps.sendMail({
        to: to.split(",").map(function (s) {
          return s.trim();
        }).filter(Boolean),
        replyTo: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    } catch (err) {
      deps.log.error("forms: notification email failed", { site: req.siteId, record: recordId, error: String(err) });
    }
  } else {
    deps.log.info("forms: no notification address set", { site: req.siteId, env: site.notifyEnv || "(none in config)" });
  }

  return succeed(req, site, { id: recordId });
}

// POST /api/forms/{site}/subscribe
function handleSubscribe(req, deps) {
  req.formId = "subscribe";
  var p = prepare(req, deps);
  if (p.done) return p.done;
  var site = p.site;
  var form = p.form;
  var honeypot = form.honeypot || site.honeypot;
  var shape = { fields: ["email", "name"], required: ["email"] };

  if (lib.honeypotFilled(req.body, honeypot)) {
    var spam = lib.pickFields(req.body, shape);
    try {
      deps.saveSubmission({ site: req.siteId, form: "subscribe", data: spam.data, email: spam.email, spam: true });
    } catch (err) {
      deps.log.error("forms: could not save spam record", { site: req.siteId, error: String(err) });
    }
    return succeed(req, site);
  }

  var blocked = checkTurnstile(req, site, form, deps);
  if (blocked) return blocked;

  var picked = lib.pickFields(req.body, shape);
  if (Object.keys(picked.errors).length) {
    return fail(req, site, 400, "invalid", "Please check your email address.", picked.errors);
  }

  // On success Maillayer holds the subscriber and PocketBase stores
  // nothing. If Maillayer can't be reached, keep the address in
  // form_submissions (with the reason) so it can be added by hand, and
  // still thank the visitor.
  var baseUrl = deps.getenv("MAILLAYER_URL");
  var problem = "";
  if (!baseUrl || !form.maillayerForm) {
    problem = "MAILLAYER_URL or the site's maillayerForm is not set";
  } else {
    try {
      var res = deps.httpSend(lib.maillayerRequest(baseUrl, form.maillayerForm, picked.data));
      if (!res || res.statusCode < 200 || res.statusCode >= 300) {
        problem = "Maillayer answered " + (res ? res.statusCode : "nothing");
      }
    } catch (err) {
      problem = "Maillayer request failed: " + String(err);
    }
  }

  if (problem) {
    deps.log.error("forms: subscribe not sent to Maillayer", { site: req.siteId, problem: problem });
    var data = { email: picked.data.email, maillayer_error: problem.slice(0, 300) };
    if (picked.data.name) data.name = picked.data.name;
    try {
      deps.saveSubmission({ site: req.siteId, form: "subscribe", data: data, email: picked.email, spam: false });
    } catch (err) {
      deps.log.error("forms: could not save failed subscribe", { site: req.siteId, error: String(err) });
      return fail(req, site, 500, "save_failed", "Sorry, we couldn't sign you up. Please try again later.");
    }
  }

  return succeed(req, site);
}

module.exports = { handleForm: handleForm, handleSubscribe: handleSubscribe };
