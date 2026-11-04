// Unit tests for the pure helpers in pb_hooks/forms/lib.js.
// Run: npm test

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const lib = require("../pb_hooks/forms/lib.js");

const site = {
  name: "Brick House",
  url: "https://brickhouse.example",
  origins: ["https://www.brickhouse.example"],
};

test("normaliseBody turns PocketBase's typed values back into strings", () => {
  const out = lib.normaliseBody({ flag: true, n: 3, s: "07700", list: ["a", 2], nested: { x: 1 }, nil: null });
  assert.deepEqual(out, { flag: "true", n: "3", s: "07700", list: ["a", "2"] });
});

test("normaliseBody copes with no body", () => {
  assert.deepEqual(lib.normaliseBody(undefined), {});
  assert.deepEqual(lib.normaliseBody("text"), {});
});

test("wantsJson: HTML form posts get a redirect, fetch with JSON gets JSON", () => {
  const browserAccept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
  assert.equal(lib.wantsJson("application/x-www-form-urlencoded", browserAccept), false);
  assert.equal(lib.wantsJson("multipart/form-data; boundary=x", "*/*"), false);
  assert.equal(lib.wantsJson("application/json", "*/*"), true);
  assert.equal(lib.wantsJson("multipart/form-data; boundary=x", "application/json"), true);
  assert.equal(lib.wantsJson("", ""), false);
});

test("originOf keeps scheme and host only", () => {
  assert.equal(lib.originOf("https://Example.com/thanks?x=1"), "https://example.com");
  assert.equal(lib.originOf("http://localhost:8090"), "http://localhost:8090");
  assert.equal(lib.originOf("javascript:alert(1)"), "");
});

test("resolveSiteUrl: relative paths go on the site's own URL", () => {
  assert.equal(lib.resolveSiteUrl(site, "/thanks"), "https://brickhouse.example/thanks");
  assert.equal(lib.resolveSiteUrl({ url: "https://a.example/" }, "/t"), "https://a.example/t");
  assert.equal(lib.resolveSiteUrl(site, "https://other.example/x"), "https://other.example/x");
});

test("resolveSiteUrl refuses anything that isn't a path or an http(s) URL", () => {
  assert.throws(() => lib.resolveSiteUrl(site, "//evil.example"));
  assert.throws(() => lib.resolveSiteUrl(site, "javascript:alert(1)"));
  assert.throws(() => lib.resolveSiteUrl(site, "thanks"));
});

test("originAllowed: own origins pass, others fail, missing Origin passes", () => {
  assert.equal(lib.originAllowed(site, "https://brickhouse.example"), true);
  assert.equal(lib.originAllowed(site, "https://WWW.brickhouse.example"), true);
  assert.equal(lib.originAllowed(site, "https://evil.example"), false);
  assert.equal(lib.originAllowed(site, "null"), false);
  assert.equal(lib.originAllowed(site, ""), true);
  assert.equal(lib.originAllowed(site, undefined), true);
});

test("lookup finds known sites and forms only", () => {
  const config = {
    sites: {
      a: { forms: { contact: { thanks: "/t" } }, subscribe: { thanks: "/s" } },
      b: { forms: {} },
    },
  };
  assert.equal(lib.lookup(config, "a", "contact").form.thanks, "/t");
  assert.equal(lib.lookup(config, "a", "subscribe").form.thanks, "/s");
  assert.equal(lib.lookup(config, "b", "subscribe").error, "unknown_form");
  assert.equal(lib.lookup(config, "nope", "contact").error, "unknown_site");
  assert.equal(lib.lookup(config, "a", "nope").error, "unknown_form");
  // Names that exist on every object must not count as sites or forms.
  assert.equal(lib.lookup(config, "toString", "contact").error, "unknown_site");
  assert.equal(lib.lookup(config, "a", "constructor").error, "unknown_form");
});

test("honeypotFilled", () => {
  assert.equal(lib.honeypotFilled({ "bot-field": "" }, "bot-field"), false);
  assert.equal(lib.honeypotFilled({ "bot-field": "   " }, "bot-field"), false);
  assert.equal(lib.honeypotFilled({}, "bot-field"), false);
  assert.equal(lib.honeypotFilled({ "bot-field": "x" }, "bot-field"), true);
  assert.equal(lib.honeypotFilled({ "bot-field": ["", "x"] }, "bot-field"), true);
  assert.equal(lib.honeypotFilled({ "bot-field": "x" }, ""), false);
});

test("isValidEmail", () => {
  assert.equal(lib.isValidEmail("ann@example.com"), true);
  assert.equal(lib.isValidEmail("ann.o+tag@sub.example.co.uk"), true);
  assert.equal(lib.isValidEmail("ann@example"), false);
  assert.equal(lib.isValidEmail("ann example@x.com"), false);
  assert.equal(lib.isValidEmail("ann@example.com\r\nBcc: x@y.z"), false);
  assert.equal(lib.isValidEmail("a".repeat(250) + "@x.com"), false);
});

test("pickFields keeps only configured fields, trimmed", () => {
  const form = { fields: ["name", "email", "message"], required: ["email", "message"] };
  const r = lib.pickFields(
    { name: "  Ann ", email: "ann@example.com", message: "Hi\n", "bot-field": "", "cf-turnstile-response": "tok", extra: "x" },
    form,
  );
  assert.deepEqual(r.data, { name: "Ann", email: "ann@example.com", message: "Hi" });
  assert.deepEqual(r.errors, {});
  assert.equal(r.email, "ann@example.com");
});

test("pickFields reports missing, bad and too-long fields", () => {
  const form = { fields: ["name", "email", "message"], required: ["email", "message"] };
  const r = lib.pickFields({ email: "nope", message: "x".repeat(lib.LIMITS.fieldChars + 1) }, form);
  assert.match(r.errors.email, /email/);
  assert.match(r.errors.message, /Too long/);
  assert.equal(r.email, "");
  assert.equal(r.data.message.length, lib.LIMITS.fieldChars);

  const empty = lib.pickFields({ email: " ", message: "" }, form);
  assert.equal(empty.errors.email, "This field is required.");
  assert.equal(empty.errors.message, "This field is required.");
});

test("pickFields keeps repeated fields as arrays", () => {
  const r = lib.pickFields({ topics: [" a", "b "] }, { fields: ["topics"] });
  assert.deepEqual(r.data.topics, ["a", "b"]);
});

test("buildNotification: one-line subject, escaped HTML, reply-to", () => {
  const n = lib.buildNotification({
    site,
    formId: "contact",
    data: { name: "Ann\r\nBcc: x@y.z", email: "ann@example.com", message: "<b>Hi</b>\nthere" },
    email: "ann@example.com",
    recordId: "abc123",
  });
  assert.equal(n.subject.indexOf("\n"), -1);
  assert.equal(n.subject.indexOf("\r"), -1);
  assert.match(n.subject, /^\[Brick House\] contact form: Ann Bcc/);
  assert.match(n.text, /message:\n<b>Hi<\/b>\nthere/);
  assert.match(n.text, /abc123/);
  assert.ok(n.html.indexOf("<b>Hi</b>") === -1, "HTML must be escaped");
  assert.ok(n.html.indexOf("&lt;b&gt;Hi&lt;/b&gt;") !== -1);
  assert.equal(n.replyTo, "ann@example.com");
});

test("turnstileRequest encodes the secret, token and IP", () => {
  const r = lib.turnstileRequest("s&1", "t=2", "203.0.113.9");
  assert.equal(r.url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.equal(r.body, "secret=s%261&response=t%3D2&remoteip=203.0.113.9");
  assert.equal(lib.turnstileRequest("s", "t", "", "http://localhost:1/v").url, "http://localhost:1/v");
});

test("turnstilePassed checks success and hostname", () => {
  assert.equal(lib.turnstilePassed(site, { success: true, hostname: "brickhouse.example" }), true);
  assert.equal(lib.turnstilePassed(site, { success: true, hostname: "www.brickhouse.example" }), true);
  assert.equal(lib.turnstilePassed(site, { success: true }), true);
  assert.equal(lib.turnstilePassed(site, { success: true, hostname: "evil.example" }), false);
  assert.equal(lib.turnstilePassed(site, { success: false }), false);
  assert.equal(lib.turnstilePassed(site, null), false);
  assert.equal(lib.turnstilePassed({ ...site, allowTestTurnstile: true }, { success: true, hostname: "example.com" }), true);
});

test("maillayerRequest builds the documented form-submit URL", () => {
  const r = lib.maillayerRequest("https://mail.example/", "news letter", { email: "a@b.co", name: "Ann" });
  assert.equal(r.url, "https://mail.example/api/public/forms/news%20letter/submit");
  assert.equal(r.method, "POST");
  assert.deepEqual(JSON.parse(r.body), { email: "a@b.co", name: "Ann" });
  assert.deepEqual(JSON.parse(lib.maillayerRequest("https://m", "s", { email: "a@b.co" }).body), { email: "a@b.co" });
});

test("errorPage escapes what it shows", () => {
  const html = lib.errorPage(site, { "<x>": "<script>" });
  assert.ok(html.indexOf("<script>") === -1);
  assert.match(html, /&lt;script&gt;/);
});
