// Pure helpers for the forms back end.
//
// Nothing in this file touches PocketBase: no $app, no $http, no $os.
// That keeps it testable with plain Node (`npm test`) and lets the
// PocketBase hooks `require()` it as well. PocketBase runs hooks in goja,
// an ES2020-ish engine with CommonJS `require`, so keep to plain
// JavaScript here: no `import`, no Node built-ins, no `URL` class.

"use strict";

// Upper limits. They stop a single post from filling the database.
var LIMITS = {
  fieldChars: 5000, // longest value kept for one field
  nameChars: 200, // longest value for short fields like name
  emailChars: 254, // the practical maximum length of an email address
  arrayItems: 20, // most values kept for a repeated field (checkboxes)
};

// The field Cloudflare's Turnstile widget adds to a form.
var TURNSTILE_FIELD = "cf-turnstile-response";

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------

// PocketBase parses urlencoded, multipart and JSON bodies into one object
// (`e.requestInfo().body`). For form posts it turns "true" into a boolean
// and "3" into a number. Turn every value back into a string, so what we
// store is exactly what the visitor typed. Repeated fields (checkboxes)
// stay as arrays of strings. Nested objects (JSON posts only) are dropped:
// a site form never sends them.
function normaliseBody(raw) {
  var out = {};
  if (!raw || typeof raw !== "object") return out;
  Object.keys(raw).forEach(function (key) {
    var value = raw[key];
    if (Array.isArray(value)) {
      out[key] = value
        .filter(isScalar)
        .slice(0, LIMITS.arrayItems)
        .map(function (v) {
          return String(v);
        });
    } else if (isScalar(value)) {
      out[key] = String(value);
    }
  });
  return out;
}

function isScalar(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

// Should we answer with JSON (a fetch() call) or with a redirect (a plain
// HTML form)? A browser form post sends an Accept header that starts with
// text/html. fetch() sends "*/*" unless told otherwise, so a JSON body or
// an explicit "Accept: application/json" means JSON.
function wantsJson(contentType, accept) {
  var ct = String(contentType || "").toLowerCase();
  var ac = String(accept || "").toLowerCase();
  if (ct.indexOf("application/json") === 0) return true;
  if (ac.indexOf("application/json") !== -1 && ac.indexOf("text/html") === -1) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Config lookups (the allowlist)
// ---------------------------------------------------------------------------

// "https://example.com/some/path" -> "https://example.com"
function originOf(url) {
  var m = /^(https?:\/\/[^/?#]+)/i.exec(String(url || ""));
  return m ? m[1].toLowerCase() : "";
}

// Turn a thank-you path from the config into a full URL on that site.
// Only paths that start with "/" and full http(s) URLs are accepted, and
// both come from the config file, never from the request. That is what
// stops this being an open redirect.
function resolveSiteUrl(site, pathOrUrl) {
  var value = String(pathOrUrl || "");
  if (/^https?:\/\//i.test(value)) return value;
  if (value.charAt(0) === "/" && value.charAt(1) !== "/") {
    return String(site.url).replace(/\/+$/, "") + value;
  }
  throw new Error("Config error: '" + value + "' must be a full URL or start with '/'");
}

// Origins a browser may post from: the site's own URL plus any extras
// (a www. variant, a staging host).
function allowedOrigins(site) {
  var list = [originOf(site.url)];
  (site.origins || []).forEach(function (o) {
    list.push(originOf(o));
  });
  return list.filter(Boolean);
}

// Browsers send an Origin header with every cross-site POST. If it is
// there, it must be one of the site's origins. If it is missing (curl, a
// server, some privacy add-ons), we let it through: the honeypot, the rate
// limit and Turnstile still apply.
function originAllowed(site, origin) {
  if (!origin) return true;
  return allowedOrigins(site).indexOf(String(origin).toLowerCase()) !== -1;
}

// Find the site and the form. `formId` "subscribe" is the newsletter
// route, so a site can't have an ordinary form with that name.
function lookup(config, siteId, formId) {
  var sites = (config && config.sites) || {};
  if (!Object.prototype.hasOwnProperty.call(sites, siteId)) {
    return { error: "unknown_site" };
  }
  var site = sites[siteId];
  if (formId === "subscribe") {
    if (!site.subscribe) return { error: "unknown_form" };
    return { site: site, form: site.subscribe };
  }
  var forms = site.forms || {};
  if (!Object.prototype.hasOwnProperty.call(forms, formId)) {
    return { error: "unknown_form" };
  }
  return { site: site, form: forms[formId] };
}

// The honeypot is a field people can't see. Bots fill in every field.
function honeypotFilled(body, fieldName) {
  if (!fieldName) return false;
  var v = body[fieldName];
  if (Array.isArray(v)) return v.join("").trim() !== "";
  return typeof v === "string" && v.trim() !== "";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// Deliberately simple: one "@", something either side, a dot in the
// domain, no spaces. Real checking happens when someone replies.
function isValidEmail(value) {
  var v = String(value || "");
  if (v.length > LIMITS.emailChars) return false;
  return /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/.test(v);
}

// Keep only the fields the config names, trimmed and cut to length. Every
// other field in the post (the honeypot, the Turnstile token, anything a
// bot adds) is dropped, so we store only what the form is meant to send.
//
// Returns { data, errors, email }. `errors` maps field name -> message.
function pickFields(body, form) {
  var fields = form.fields || [];
  var required = form.required || [];
  var emailField = form.emailField || "email";
  var data = {};
  var errors = {};

  fields.forEach(function (name) {
    var value = body[name];
    if (value === undefined) return;
    var max = name === emailField ? LIMITS.emailChars : name === "name" ? LIMITS.nameChars : LIMITS.fieldChars;
    if (Array.isArray(value)) {
      data[name] = value.map(function (v) {
        return v.trim().slice(0, max);
      });
    } else {
      var trimmed = value.trim();
      if (trimmed.length > max) {
        errors[name] = "Too long (the limit is " + max + " characters).";
      }
      data[name] = trimmed.slice(0, max);
    }
  });

  required.forEach(function (name) {
    var v = data[name];
    var empty = v === undefined || (Array.isArray(v) ? v.length === 0 : v === "");
    if (empty) errors[name] = "This field is required.";
  });

  var email = "";
  if (data[emailField] !== undefined && data[emailField] !== "") {
    if (isValidEmail(data[emailField])) {
      email = data[emailField];
    } else {
      errors[emailField] = "This doesn't look like an email address.";
    }
  }

  return { data: data, errors: errors, email: email };
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// One line only, for headers such as the subject. Removes line breaks so
// nobody can add headers of their own.
function oneLine(s, max) {
  return String(s || "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, max || 120);
}

// The notification sent to the site's inbox. Plain text first, with a
// simple HTML copy. Reply-To is the sender, so "Reply" answers them.
function buildNotification(opts) {
  var site = opts.site;
  var formId = opts.formId;
  var data = opts.data;
  var who = oneLine(data.name || opts.email || "someone", 80);
  var subject = oneLine("[" + site.name + "] " + formId + " form: " + who, 150);

  var lines = ["New " + formId + " form message from " + site.name + ".", ""];
  Object.keys(data).forEach(function (key) {
    var value = Array.isArray(data[key]) ? data[key].join(", ") : data[key];
    if (value.indexOf("\n") !== -1) {
      lines.push(key + ":", value, "");
    } else {
      lines.push(key + ": " + value);
    }
  });
  lines.push("");
  if (opts.email) lines.push("Reply to this email to answer " + who + ".");
  if (opts.recordId) lines.push("Saved in PocketBase (form_submissions) as " + opts.recordId + ".");
  var text = lines.join("\n");

  var html =
    '<pre style="font-family: system-ui, sans-serif; white-space: pre-wrap; font-size: 15px;">' +
    escapeHtml(text) +
    "</pre>";

  return { subject: subject, text: text, html: html, replyTo: opts.email || "" };
}

// ---------------------------------------------------------------------------
// Outside services
// ---------------------------------------------------------------------------

// Cloudflare Turnstile server-side check.
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
// `verifyUrl` is for tests only (TURNSTILE_VERIFY_URL); leave it unset.
function turnstileRequest(secret, token, ip, verifyUrl) {
  var body = "secret=" + encodeURIComponent(secret) + "&response=" + encodeURIComponent(token);
  if (ip) body += "&remoteip=" + encodeURIComponent(ip);
  return {
    url: verifyUrl || "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body,
    timeout: 10,
  };
}

// Read the siteverify answer. When Cloudflare names the hostname the
// widget ran on, it must be one of the site's own hosts.
function turnstilePassed(site, result) {
  if (!result || result.success !== true) return false;
  if (result.hostname) {
    var hosts = allowedOrigins(site).map(function (o) {
      return o.replace(/^https?:\/\//, "");
    });
    // Cloudflare's test keys answer with "example.com"; allow it only
    // when the config says this site is a test site.
    if (hosts.indexOf(String(result.hostname).toLowerCase()) === -1 && !site.allowTestTurnstile) {
      return false;
    }
  }
  return true;
}

// Maillayer: add a subscriber through one of its Forms.
//
// UNCONFIRMED: Maillayer documents `POST /api/public/forms/:slug/submit`
// for "custom UIs or backend submission" (https://maillayer.com/docs/forms),
// and says a lead-capture form upserts the contact by email and applies the
// form's tags. Its docs don't show the request body in anything we could
// read, so the JSON below ({ email, name }) is a best guess. Check it
// against Settings → API / the Forms page in your own Maillayer before
// relying on it, and change only this function if it differs.
function maillayerRequest(baseUrl, formSlug, fields) {
  var payload = { email: fields.email };
  if (fields.name) payload.name = fields.name;
  return {
    url: String(baseUrl).replace(/\/+$/, "") + "/api/public/forms/" + encodeURIComponent(formSlug) + "/submit",
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
    timeout: 10,
  };
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

// A small page for HTML posts that fail validation, used when the site has
// no error page of its own. It works without JavaScript.
function errorPage(site, errors) {
  var items = Object.keys(errors)
    .map(function (k) {
      return "<li><strong>" + escapeHtml(k) + "</strong>: " + escapeHtml(errors[k]) + "</li>";
    })
    .join("");
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Please check the form</title>" +
    "<style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5}</style>" +
    "</head><body><h1>Please check the form</h1>" +
    (items ? "<ul>" + items + "</ul>" : "<p>Something went wrong. Please try again.</p>") +
    '<p><a href="javascript:history.back()">Go back</a> or return to <a href="' +
    escapeHtml(site ? site.url : "/") +
    '">' +
    escapeHtml(site ? site.name : "the site") +
    "</a>.</p></body></html>"
  );
}

module.exports = {
  LIMITS: LIMITS,
  TURNSTILE_FIELD: TURNSTILE_FIELD,
  normaliseBody: normaliseBody,
  wantsJson: wantsJson,
  originOf: originOf,
  resolveSiteUrl: resolveSiteUrl,
  allowedOrigins: allowedOrigins,
  originAllowed: originAllowed,
  lookup: lookup,
  honeypotFilled: honeypotFilled,
  isValidEmail: isValidEmail,
  pickFields: pickFields,
  escapeHtml: escapeHtml,
  oneLine: oneLine,
  buildNotification: buildNotification,
  turnstileRequest: turnstileRequest,
  turnstilePassed: turnstilePassed,
  maillayerRequest: maillayerRequest,
  errorPage: errorPage,
};
