// The allowlist: every site and form this back end accepts.
//
// A post to /api/forms/{site}/{form} is refused unless both names are
// here. Thank-you and error pages are always taken from this file, never
// from the request, so the route can't be used as an open redirect.
//
// Addresses that receive notifications are NOT in this file. Each site
// names an environment variable (`notifyEnv`) that holds them, set in
// Coolify. Several addresses can be given, separated by commas.
//
// Per site:
//   name        shown in email subjects
//   url         the site's public address; relative thank-you paths use it,
//               and it is the origin a browser may post from
//   origins     extra origins allowed to post (www., staging)
//   notifyEnv   env var with the notification address(es)
//   honeypot    the hidden field that must stay empty
//   forms       { formName: { fields, required, thanks, error?, turnstile? } }
//   subscribe   { maillayerForm, thanks, error?, turnstile? } for the newsletter
//
// After a change, redeploy PocketBase (or restart it locally).

"use strict";

module.exports = function config(getenv) {
  var sites = {
    // Brick House: replaces the Netlify form named "contact".
    brickhouse: {
      name: "Brick House",
      // TODO(Rob): the real domain. It must match the site exactly
      // (https, with or without www) or browsers' posts are refused.
      url: "https://brickhouse.example",
      origins: [],
      notifyEnv: "FORMS_NOTIFY_BRICKHOUSE",
      honeypot: "bot-field", // the same name Netlify used, so the markup barely changes
      forms: {
        contact: {
          fields: ["name", "email", "message"],
          required: ["email", "message"],
          thanks: "/thanks",
          turnstile: false,
        },
      },
    },

    // robertocarroll.com: the newsletter signup (Buttondown today).
    robertocarroll: {
      name: "robertocarroll.com",
      url: "https://robertocarroll.com",
      origins: ["https://www.robertocarroll.com"],
      notifyEnv: "FORMS_NOTIFY_ROBERTOCARROLL",
      honeypot: "bot-field",
      subscribe: {
        // The slug of a lead-capture form in Maillayer (Contacts → Forms).
        maillayerForm: "newsletter",
        // TODO(Rob): the page to show after signing up.
        thanks: "/newsletter/thanks",
        turnstile: false,
      },
    },
  };

  // A demo site for trying this locally with `docker compose up`.
  // It exists only when FORMS_DEMO=1, so it is never live in production.
  if (getenv("FORMS_DEMO") === "1") {
    sites.demo = {
      name: "Demo",
      url: "http://localhost:8090",
      origins: ["http://127.0.0.1:8090"],
      notifyEnv: "FORMS_NOTIFY_DEMO",
      honeypot: "bot-field",
      allowTestTurnstile: true,
      forms: {
        contact: {
          fields: ["name", "email", "message"],
          required: ["email", "message"],
          thanks: "/thanks.html",
          turnstile: getenv("FORMS_DEMO_TURNSTILE") === "1",
        },
      },
      subscribe: {
        maillayerForm: "newsletter",
        thanks: "/thanks.html",
      },
    };
  }

  return { sites: sites };
};
