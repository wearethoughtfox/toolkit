/// <reference path="../pb_data/types.d.ts" />

// Public form routes for Thought Fox's static sites.
//
//   POST /api/forms/{site}/subscribe   newsletter signup → Maillayer
//   POST /api/forms/{site}/{form}      any other form → saved + emailed
//
// Both accept an ordinary HTML form post (urlencoded or multipart) and
// answer with a 303 redirect to the site's thank-you page, so a static
// site's <form method="POST" action="…"> works with no JavaScript. A
// fetch() with a JSON body, or with "Accept: application/json", gets JSON
// back instead.
//
// Sites, forms and thank-you pages are in forms/config.js. The flow is in
// forms/handler.js. The per-IP rate limit is PocketBase's own, set up in
// settings.pb.js.
//
// Note: handlers run in isolated contexts, so everything they need is
// loaded with require() inside the handler.

// At most 64 KB per post. A contact form needs a few KB; this stops
// anyone pushing large bodies at the database. (Top-level values like
// this one can be used while routes are registered, not inside handlers.)
const FORMS_BODY_LIMIT = 64 * 1024;

// The literal "subscribe" route is more specific than "{form}", so the
// router picks it first for /api/forms/{site}/subscribe.
routerAdd(
  "POST",
  "/api/forms/{site}/subscribe",
  (e) => require(`${__hooks}/forms/pocketbase.js`).run(e, "subscribe"),
  $apis.bodyLimit(FORMS_BODY_LIMIT),
);

routerAdd(
  "POST",
  "/api/forms/{site}/{form}",
  (e) => require(`${__hooks}/forms/pocketbase.js`).run(e, "form"),
  $apis.bodyLimit(FORMS_BODY_LIMIT),
);

// Every day at 03:17 (server time), delete spam and old messages.
// See retention() in forms/pocketbase.js for the env vars.
cronAdd("forms_retention", "17 3 * * *", () => {
  require(`${__hooks}/forms/pocketbase.js`).retention();
});
