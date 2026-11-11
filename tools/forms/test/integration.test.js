// End-to-end test: the real hooks and migration inside a real PocketBase.
//
// Needs a PocketBase binary. It is skipped unless POCKETBASE_BIN is set:
//
//   POCKETBASE_BIN=/path/to/pocketbase npm run test:pocketbase
//
// It copies pb_hooks and pb_migrations into a temporary folder, swaps the
// site config for a test one, adds test/fixtures/test-only.pb.js (which
// catches mail instead of sending it), and starts fake Turnstile and
// Maillayer servers. Nothing leaves this machine.

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");

const BIN = process.env.POCKETBASE_BIN;
const ROOT = path.join(__dirname, "..");
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
const RATE_LIMIT = 4;

const TEST_CONFIG = `
module.exports = function () {
  return { sites: { test: {
    name: "Test site",
    url: "https://test.example",
    notifyEnv: "FORMS_NOTIFY_TEST",
    honeypot: "bot-field",
    allowTestTurnstile: true,
    forms: {
      contact: { fields: ["name", "email", "message"], required: ["email", "message"], thanks: "/thanks" },
      guarded: { fields: ["email"], required: ["email"], thanks: "/thanks", turnstile: true },
    },
    subscribe: { maillayerForm: "news", thanks: "/subscribed" },
  } } };
};
`;

let pb;
let fake;
let fakeUrl;
const fakeCalls = [];
let ipCounter = 1;

// Each test posts from its own IP (via CF-Connecting-IP, which the
// TRUSTED_PROXY_HEADER setting makes PocketBase trust), so the rate limit
// of one test doesn't affect another.
function nextIp() {
  ipCounter += 1;
  return `198.51.100.${ipCounter}`;
}

function post(urlPath, body, opts = {}) {
  const json = opts.json;
  return fetch(BASE + urlPath, {
    method: "POST",
    redirect: "manual",
    headers: Object.assign(
      {
        "content-type": json ? "application/json" : "application/x-www-form-urlencoded",
        accept: json ? "application/json" : "text/html,*/*;q=0.8",
        origin: "https://test.example",
        "cf-connecting-ip": opts.ip || nextIp(),
      },
      opts.headers,
    ),
    body: json ? JSON.stringify(body) : new URLSearchParams(body).toString(),
  });
}

const getJson = async (p) => (await fetch(BASE + p)).json();

async function waitForHealth() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(BASE + "/api/health");
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("PocketBase didn't start");
}

test.describe("PocketBase integration", { skip: !BIN && "set POCKETBASE_BIN to run" }, () => {
  test.before(async () => {
    // Fake Turnstile (/siteverify) and Maillayer (/api/public/forms/…).
    fake = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        fakeCalls.push({ url: req.url, body });
        res.setHeader("content-type", "application/json");
        if (req.url === "/siteverify") {
          const ok = new URLSearchParams(body).get("response") === "good-token";
          res.end(JSON.stringify({ success: ok, hostname: "test.example" }));
        } else if (req.url === "/api/public/forms/news/submit") {
          const email = JSON.parse(body).email;
          res.statusCode = email === "broken@test.example" ? 500 : 200;
          res.end("{}");
        } else {
          res.statusCode = 404;
          res.end("{}");
        }
      });
    });
    await new Promise((r) => fake.listen(0, "127.0.0.1", r));
    fakeUrl = `http://127.0.0.1:${fake.address().port}`;

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "forms-pb-"));
    fs.cpSync(path.join(ROOT, "pb_hooks"), path.join(dir, "pb_hooks"), { recursive: true });
    fs.cpSync(path.join(ROOT, "pb_migrations"), path.join(dir, "pb_migrations"), { recursive: true });
    fs.writeFileSync(path.join(dir, "pb_hooks/forms/config.js"), TEST_CONFIG);
    fs.copyFileSync(path.join(__dirname, "fixtures/test-only.pb.js"), path.join(dir, "pb_hooks/test-only.pb.js"));

    pb = spawn(
      BIN,
      [
        "serve",
        `--http=127.0.0.1:${PORT}`,
        `--dir=${dir}/pb_data`,
        `--hooksDir=${dir}/pb_hooks`,
        `--migrationsDir=${dir}/pb_migrations`,
        "--hooksWatch=false",
        "--automigrate=false",
      ],
      {
        env: Object.assign({}, process.env, {
          FORMS_NOTIFY_TEST: "inbox@test.example",
          MAIL_SENDER_ADDRESS: "forms@test.example",
          MAIL_SENDER_NAME: "Forms",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          TURNSTILE_VERIFY_URL: fakeUrl + "/siteverify",
          MAILLAYER_URL: fakeUrl,
          TRUSTED_PROXY_HEADER: "CF-Connecting-IP",
          FORMS_RATE_LIMIT_MAX: String(RATE_LIMIT),
          // Mail is caught by the test hook, so this server is never used.
          SMTP_HOST: "smtp.test.example",
          SMTP_PORT: "2525",
          PB_BACKUPS_CRON: "30 2 * * *",
          PB_BACKUPS_KEEP: "5",
        }),
        stdio: ["ignore", "ignore", "inherit"],
      },
    );
    await waitForHealth();
  });

  test.after(() => {
    if (pb) pb.kill();
    if (fake) fake.close();
  });

  test("settings.pb.js applied the env vars", async () => {
    const s = await getJson("/api/test/settings");
    assert.deepEqual(s.smtp, { enabled: true, host: "smtp.test.example", port: 2525, tls: false });
    assert.equal(s.senderAddress, "forms@test.example");
    assert.deepEqual(s.trustedProxy, ["CF-Connecting-IP"]);
    assert.equal(s.logIP, false, "IPs are left out of request logs by default");
    assert.deepEqual(s.backups, { cron: "30 2 * * *", keep: 5 });
    assert.equal(s.rateLimits.enabled, true);
    assert.equal(s.rateLimits.first.label, "POST /api/forms/");
    assert.equal(s.rateLimits.first.maxRequests, RATE_LIMIT);
  });

  test("the migration made a collection the public API can't read", async () => {
    const r = await fetch(BASE + "/api/collections/form_submissions/records");
    assert.equal(r.status, 403);
    const c = await fetch(BASE + "/api/collections/form_submissions/records", { method: "POST", body: "{}" });
    assert.ok(c.status === 403 || c.status === 400, `create should be refused, got ${c.status}`);
  });

  test("a plain HTML form post: 303 to the thank-you page, saved, emailed", async () => {
    const r = await post("/api/forms/test/contact", {
      name: "Ann",
      email: "ann@test.example",
      message: "Line one\nLine two",
      "bot-field": "",
      sneaky: "not stored",
    });
    assert.equal(r.status, 303);
    assert.equal(r.headers.get("location"), "https://test.example/thanks");

    const recs = await getJson("/api/test/records");
    const rec = recs.find((x) => x.email === "ann@test.example");
    assert.ok(rec, "record saved");
    assert.deepEqual(rec.data, { name: "Ann", email: "ann@test.example", message: "Line one\nLine two" });
    assert.equal(rec.spam, false);

    const mail = await getJson("/api/test/mail");
    const m = mail.find((x) => x.subject.includes("Ann"));
    assert.ok(m, "notification sent");
    assert.deepEqual(m.to, ["inbox@test.example"]);
    assert.equal(m.from, "forms@test.example");
    assert.equal(m.headers["Reply-To"], "ann@test.example");
    assert.match(m.text, /Line one\nLine two/);
  });

  test("multipart posts work too and keep leading zeros", async () => {
    const fd = new FormData();
    fd.set("email", "multi@test.example");
    fd.set("message", "007");
    const r = await fetch(BASE + "/api/forms/test/contact", {
      method: "POST",
      redirect: "manual",
      body: fd,
      headers: { "cf-connecting-ip": nextIp() },
    });
    assert.equal(r.status, 303);
    const rec = (await getJson("/api/test/records")).find((x) => x.email === "multi@test.example");
    assert.equal(rec.data.message, "007");
  });

  test("a JSON post gets JSON", async () => {
    const r = await post("/api/forms/test/contact", { email: "json@test.example", message: "hi" }, { json: true });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.ok, true);
    assert.ok(body.id);
  });

  test("errors: unknown site 404, other origin 403, bad fields 400", async () => {
    assert.equal((await post("/api/forms/nope/contact", { email: "a@b.co", message: "x" })).status, 404);
    assert.equal((await post("/api/forms/test/nope", { email: "a@b.co", message: "x" })).status, 404);
    const foreign = await post("/api/forms/test/contact", { email: "a@b.co", message: "x" }, { headers: { origin: "https://evil.example" } });
    assert.equal(foreign.status, 403);
    const bad = await post("/api/forms/test/contact", { email: "nope" });
    assert.equal(bad.status, 400);
    assert.match(await bad.text(), /Please check the form/);
  });

  test("honeypot: same redirect, flagged as spam, no email", async () => {
    const r = await post("/api/forms/test/contact", { email: "bot@test.example", message: "x", "bot-field": "gotcha" });
    assert.equal(r.status, 303);
    const rec = (await getJson("/api/test/records")).find((x) => x.email === "bot@test.example");
    assert.equal(rec.spam, true);
    const mail = await getJson("/api/test/mail");
    assert.ok(!mail.some((m) => m.text.includes("bot@test.example")));
  });

  test("Turnstile: a good token passes, a bad one doesn't", async () => {
    const good = await post("/api/forms/test/guarded", { email: "t1@test.example", "cf-turnstile-response": "good-token" });
    assert.equal(good.status, 303);
    const bad = await post("/api/forms/test/guarded", { email: "t2@test.example", "cf-turnstile-response": "bad" });
    assert.equal(bad.status, 400);
    const call = fakeCalls.find((c) => c.url === "/siteverify");
    assert.match(call.body, /secret=1x0000000000000000000000000000000AA/);
    assert.match(call.body, /remoteip=198\.51\.100\.\d+/, "the visitor's IP comes from CF-Connecting-IP");
  });

  test("subscribe: goes to Maillayer and redirects", async () => {
    const r = await post("/api/forms/test/subscribe", { email: "sub@test.example", name: "Sub", "bot-field": "" });
    assert.equal(r.status, 303);
    assert.equal(r.headers.get("location"), "https://test.example/subscribed");
    const call = fakeCalls.find((c) => c.url === "/api/public/forms/news/submit" && c.body.includes("sub@test.example"));
    assert.deepEqual(JSON.parse(call.body), { email: "sub@test.example", name: "Sub" });
    assert.ok(!(await getJson("/api/test/records")).some((x) => x.email === "sub@test.example"), "not stored on success");
  });

  test("subscribe: a Maillayer failure keeps the address in PocketBase", async () => {
    const r = await post("/api/forms/test/subscribe", { email: "broken@test.example" });
    assert.equal(r.status, 303);
    const rec = (await getJson("/api/test/records")).find((x) => x.email === "broken@test.example");
    assert.equal(rec.form, "subscribe");
    assert.match(rec.data.maillayer_error, /500/);
  });

  test("rate limit: the same IP is stopped after the limit", async () => {
    const ip = nextIp();
    const statuses = [];
    for (let i = 0; i < RATE_LIMIT + 1; i++) {
      const r = await post("/api/forms/test/contact", { email: "rl@test.example", message: "x" }, { ip });
      statuses.push(r.status);
    }
    assert.deepEqual(statuses.slice(0, RATE_LIMIT), Array(RATE_LIMIT).fill(303));
    assert.equal(statuses[RATE_LIMIT], 429);
    // Another visitor is not affected.
    assert.equal((await post("/api/forms/test/contact", { email: "other@test.example", message: "x" })).status, 303);
  });

  test("retention: old spam and old messages are deleted, new ones kept", async () => {
    await post("/api/forms/test/contact", { email: "oldspam@test.example", message: "x", "bot-field": "y" });
    await post("/api/forms/test/contact", { email: "old@test.example", message: "x" });
    await post("/api/forms/test/contact", { email: "new@test.example", message: "x" });
    const recs = await getJson("/api/test/records");
    const id = (email) => recs.find((x) => x.email === email).id;
    await fetch(`${BASE}/api/test/age/${id("oldspam@test.example")}/31`, { method: "POST" });
    await fetch(`${BASE}/api/test/age/${id("old@test.example")}/366`, { method: "POST" });
    await fetch(`${BASE}/api/test/retention`, { method: "POST" });
    const left = (await getJson("/api/test/records")).map((x) => x.email);
    assert.ok(!left.includes("oldspam@test.example"));
    assert.ok(!left.includes("old@test.example"));
    assert.ok(left.includes("new@test.example"));
  });
});
