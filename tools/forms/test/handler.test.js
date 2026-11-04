// Tests for the request flow in pb_hooks/forms/handler.js, with fake
// "deps" in place of PocketBase (no database, no mail, no network).
// Run: npm test

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../pb_hooks/forms/handler.js");

const BROWSER_ACCEPT = "text/html,application/xhtml+xml,*/*;q=0.8";

const CONFIG = {
  sites: {
    brickhouse: {
      name: "Brick House",
      url: "https://brickhouse.example",
      origins: [],
      notifyEnv: "FORMS_NOTIFY_BRICKHOUSE",
      honeypot: "bot-field",
      forms: {
        contact: { fields: ["name", "email", "message"], required: ["email", "message"], thanks: "/thanks" },
        quote: {
          fields: ["email", "message"],
          required: ["email"],
          thanks: "/thanks",
          error: "/form-error",
          turnstile: true,
        },
      },
      subscribe: { maillayerForm: "newsletter", thanks: "/subscribed" },
    },
  },
};

// Fake deps. `env` sets env vars; `http` answers outgoing requests.
function fakeDeps(opts = {}) {
  const env = Object.assign({ FORMS_NOTIFY_BRICKHOUSE: "studio@brickhouse.example" }, opts.env);
  const calls = { saved: [], mail: [], http: [], logs: [] };
  const deps = {
    config: CONFIG,
    getenv: (name) => env[name] || "",
    saveSubmission: (s) => {
      if (opts.saveThrows) throw new Error("db down");
      calls.saved.push(s);
      return "rec" + calls.saved.length;
    },
    sendMail: (m) => {
      if (opts.mailThrows) throw new Error("smtp down");
      calls.mail.push(m);
    },
    httpSend: (r) => {
      calls.http.push(r);
      if (opts.httpThrows) throw new Error("network");
      return opts.http ? opts.http(r) : { statusCode: 200, json: {} };
    },
    log: {
      info: (m, d) => calls.logs.push(["info", m, d]),
      error: (m, d) => calls.logs.push(["error", m, d]),
    },
  };
  return { deps, calls };
}

function htmlPost(siteId, formId, body, extra = {}) {
  return Object.assign(
    {
      siteId,
      formId,
      rawBody: body,
      contentType: "application/x-www-form-urlencoded",
      accept: BROWSER_ACCEPT,
      origin: "https://brickhouse.example",
      ip: "203.0.113.9",
    },
    extra,
  );
}

const GOOD = { name: "Ann", email: "ann@example.com", message: "Hello", "bot-field": "" };

test("a good HTML post is saved, emailed and redirected with 303", () => {
  const { deps, calls } = fakeDeps();
  const res = handler.handleForm(htmlPost("brickhouse", "contact", GOOD), deps);
  assert.deepEqual(res, { status: 303, redirect: "https://brickhouse.example/thanks" });
  assert.deepEqual(calls.saved, [
    {
      site: "brickhouse",
      form: "contact",
      data: { name: "Ann", email: "ann@example.com", message: "Hello" },
      email: "ann@example.com",
      spam: false,
    },
  ]);
  assert.equal(calls.mail.length, 1);
  assert.deepEqual(calls.mail[0].to, ["studio@brickhouse.example"]);
  assert.equal(calls.mail[0].replyTo, "ann@example.com");
});

test("a JSON post gets JSON back", () => {
  const { deps } = fakeDeps();
  const res = handler.handleForm(htmlPost("brickhouse", "contact", GOOD, { contentType: "application/json", accept: "*/*" }), deps);
  assert.deepEqual(res, { status: 200, json: { ok: true, id: "rec1" } });
});

test("several notification addresses, separated by commas", () => {
  const { deps, calls } = fakeDeps({ env: { FORMS_NOTIFY_BRICKHOUSE: "a@x.example, b@x.example" } });
  handler.handleForm(htmlPost("brickhouse", "contact", GOOD), deps);
  assert.deepEqual(calls.mail[0].to, ["a@x.example", "b@x.example"]);
});

test("no notification address: still saved and redirected", () => {
  const { deps, calls } = fakeDeps({ env: { FORMS_NOTIFY_BRICKHOUSE: "" } });
  const res = handler.handleForm(htmlPost("brickhouse", "contact", GOOD), deps);
  assert.equal(res.status, 303);
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.mail.length, 0);
});

test("a failed email still redirects; the record is kept and the error logged", () => {
  const { deps, calls } = fakeDeps({ mailThrows: true });
  const res = handler.handleForm(htmlPost("brickhouse", "contact", GOOD), deps);
  assert.equal(res.status, 303);
  assert.equal(calls.saved.length, 1);
  assert.ok(calls.logs.some((l) => l[0] === "error" && /email failed/.test(l[1])));
});

test("a failed save is a 500 and sends no email", () => {
  const { deps, calls } = fakeDeps({ saveThrows: true });
  const res = handler.handleForm(htmlPost("brickhouse", "contact", GOOD), deps);
  assert.equal(res.status, 500);
  assert.match(res.html, /couldn/);
  assert.equal(calls.mail.length, 0);
});

test("unknown site or form: 404 and never a redirect", () => {
  const { deps, calls } = fakeDeps();
  const a = handler.handleForm(htmlPost("evil", "contact", GOOD), deps);
  const b = handler.handleForm(htmlPost("brickhouse", "nope", GOOD), deps);
  assert.equal(a.status, 404);
  assert.equal(b.status, 404);
  assert.equal(a.redirect, undefined);
  assert.equal(calls.saved.length, 0);
});

test("a post from another website's page is refused", () => {
  const { deps, calls } = fakeDeps();
  const res = handler.handleForm(htmlPost("brickhouse", "contact", GOOD, { origin: "https://evil.example" }), deps);
  assert.equal(res.status, 403);
  assert.equal(calls.saved.length, 0);
});

test("honeypot: saved as spam, no email, same redirect as success", () => {
  const { deps, calls } = fakeDeps();
  const res = handler.handleForm(htmlPost("brickhouse", "contact", { ...GOOD, "bot-field": "buy now" }), deps);
  assert.deepEqual(res, { status: 303, redirect: "https://brickhouse.example/thanks" });
  assert.equal(calls.saved[0].spam, true);
  assert.equal(calls.saved[0].data["bot-field"], undefined, "the honeypot value itself is not stored");
  assert.equal(calls.mail.length, 0);
});

test("validation errors: HTML page for forms, JSON for fetch", () => {
  const { deps, calls } = fakeDeps();
  const html = handler.handleForm(htmlPost("brickhouse", "contact", { email: "nope" }), deps);
  assert.equal(html.status, 400);
  assert.match(html.html, /Please check the form/);
  const json = handler.handleForm(
    htmlPost("brickhouse", "contact", { email: "nope" }, { contentType: "application/json" }),
    deps,
  );
  assert.equal(json.status, 400);
  assert.equal(json.json.ok, false);
  assert.ok(json.json.errors.email);
  assert.ok(json.json.errors.message);
  assert.equal(calls.saved.length, 0);
});

test("a form with its own error page redirects there on validation errors", () => {
  const { deps } = fakeDeps({ env: { TURNSTILE_SECRET_KEY: "s" }, http: () => ({ statusCode: 200, json: { success: true } }) });
  const res = handler.handleForm(htmlPost("brickhouse", "quote", { email: "nope", "cf-turnstile-response": "t" }), deps);
  assert.deepEqual(res, { status: 303, redirect: "https://brickhouse.example/form-error" });
});

test("Turnstile: passes with a good token", () => {
  const { deps, calls } = fakeDeps({
    env: { TURNSTILE_SECRET_KEY: "secret" },
    http: () => ({ statusCode: 200, json: { success: true, hostname: "brickhouse.example" } }),
  });
  const res = handler.handleForm(htmlPost("brickhouse", "quote", { email: "a@b.co", "cf-turnstile-response": "tok" }), deps);
  assert.equal(res.status, 303);
  assert.match(calls.http[0].body, /secret=secret&response=tok&remoteip=203\.0\.113\.9/);
  assert.equal(calls.saved[0].data["cf-turnstile-response"], undefined, "the token is not stored");
});

test("Turnstile: missing token, failed check, wrong host, no secret, network error", () => {
  // JSON posts, so we see the status. (An HTML post to this form would be
  // redirected to its error page, tested above.)
  const post = (body) => htmlPost("brickhouse", "quote", body, { contentType: "application/json" });
  let f = fakeDeps({ env: { TURNSTILE_SECRET_KEY: "s" } });
  assert.equal(handler.handleForm(post({ email: "a@b.co" }), f.deps).status, 400);

  f = fakeDeps({ env: { TURNSTILE_SECRET_KEY: "s" }, http: () => ({ statusCode: 200, json: { success: false } }) });
  assert.equal(handler.handleForm(post({ email: "a@b.co", "cf-turnstile-response": "t" }), f.deps).status, 400);

  f = fakeDeps({ env: { TURNSTILE_SECRET_KEY: "s" }, http: () => ({ statusCode: 200, json: { success: true, hostname: "evil.example" } }) });
  assert.equal(handler.handleForm(post({ email: "a@b.co", "cf-turnstile-response": "t" }), f.deps).status, 400);

  f = fakeDeps();
  assert.equal(handler.handleForm(post({ email: "a@b.co", "cf-turnstile-response": "t" }), f.deps).status, 500);

  f = fakeDeps({ env: { TURNSTILE_SECRET_KEY: "s" }, httpThrows: true });
  assert.equal(handler.handleForm(post({ email: "a@b.co", "cf-turnstile-response": "t" }), f.deps).status, 502);
  assert.equal(f.calls.saved.length, 0);
});

test("subscribe: sends to Maillayer, stores nothing, redirects", () => {
  const { deps, calls } = fakeDeps({ env: { MAILLAYER_URL: "https://mail.example" } });
  const res = handler.handleSubscribe(htmlPost("brickhouse", undefined, { email: "ann@example.com", name: "Ann", "bot-field": "" }), deps);
  assert.deepEqual(res, { status: 303, redirect: "https://brickhouse.example/subscribed" });
  assert.equal(calls.http[0].url, "https://mail.example/api/public/forms/newsletter/submit");
  assert.deepEqual(JSON.parse(calls.http[0].body), { email: "ann@example.com", name: "Ann" });
  assert.equal(calls.saved.length, 0);
});

test("subscribe: when Maillayer fails the address is kept in PocketBase", () => {
  const { deps, calls } = fakeDeps({ env: { MAILLAYER_URL: "https://mail.example" }, http: () => ({ statusCode: 500 }) });
  const res = handler.handleSubscribe(htmlPost("brickhouse", undefined, { email: "ann@example.com" }), deps);
  assert.equal(res.status, 303);
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].form, "subscribe");
  assert.equal(calls.saved[0].data.email, "ann@example.com");
  assert.match(calls.saved[0].data.maillayer_error, /500/);
});

test("subscribe: no MAILLAYER_URL is treated as a failure, not lost", () => {
  const { deps, calls } = fakeDeps();
  handler.handleSubscribe(htmlPost("brickhouse", undefined, { email: "ann@example.com" }), deps);
  assert.equal(calls.http.length, 0);
  assert.equal(calls.saved.length, 1);
});

test("subscribe: bad email, honeypot, unknown site", () => {
  let f = fakeDeps({ env: { MAILLAYER_URL: "https://mail.example" } });
  assert.equal(handler.handleSubscribe(htmlPost("brickhouse", undefined, { email: "nope" }), f.deps).status, 400);
  assert.equal(f.calls.http.length, 0);

  f = fakeDeps({ env: { MAILLAYER_URL: "https://mail.example" } });
  const spam = handler.handleSubscribe(htmlPost("brickhouse", undefined, { email: "a@b.co", "bot-field": "x" }), f.deps);
  assert.equal(spam.status, 303);
  assert.equal(f.calls.http.length, 0);
  assert.equal(f.calls.saved[0].spam, true);

  f = fakeDeps();
  assert.equal(handler.handleSubscribe(htmlPost("nope", undefined, { email: "a@b.co" }), f.deps).status, 404);
});
