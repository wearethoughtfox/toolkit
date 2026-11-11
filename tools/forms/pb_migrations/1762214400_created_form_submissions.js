/// <reference path="../pb_data/types.d.ts" />

// Creates the form_submissions collection: one record per form post.
//
// All API rules are null, which in PocketBase means "superusers only".
// Nobody can list, view, create, change or delete records through the
// public REST API. Records arrive only through the custom route in
// pb_hooks/forms.pb.js, which saves them as the app itself.
//
// What is stored: the site and form names, the fields the form config
// allows (in `data`), the sender's email, and a spam flag. No IP address,
// no user agent. Old records are deleted by the retention job in
// pb_hooks/forms.pb.js.

migrate(
  (app) => {
    const collection = new Collection({
      type: "base",
      name: "form_submissions",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        // Which site and form, as named in pb_hooks/forms/config.js.
        { name: "site", type: "text", required: true, max: 64 },
        { name: "form", type: "text", required: true, max: 64 },
        // The allowed fields of the post, e.g. { name, email, message }.
        { name: "data", type: "json", maxSize: 65536 },
        // A copy of the sender's address, so records can be found by it.
        // Empty when the form has no email field.
        { name: "email", type: "email" },
        // True when the honeypot was filled. No email is sent for these.
        { name: "spam", type: "bool" },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE INDEX idx_form_submissions_site ON form_submissions (site, form, created)",
        "CREATE INDEX idx_form_submissions_created ON form_submissions (created)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("form_submissions");
    app.delete(collection);
  },
);
