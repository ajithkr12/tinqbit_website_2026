/**
 * Tinqbit contact-form mailer.
 *
 * Receives POST submissions from every ".contact-form-wrap form" on the
 * site (wired up in /scripts/form-handler.js) and emails them to the team.
 *
 * ── Deployment ──────────────────────────────────────────────────────────
 * 1. Go to https://script.google.com/ → New project.
 * 2. Paste this file's contents in as Code.gs (replace the default code).
 * 3. Update RECIPIENT_EMAIL below if needed.
 * 4. Deploy → New deployment → type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the generated Web app URL (ends in /exec).
 * 6. Paste that URL into FORM_ENDPOINT in /scripts/form-handler.js.
 * 7. Re-deploy (new version) any time you edit this file — editing the
 *    script alone does not update a live "Anyone" deployment.
 */

var RECIPIENT_EMAIL = "info@tinqbit.com"; // where leads land
var SENDER_NAME = "Tinqbit Website";

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    var name = p.name || "(not provided)";
    var email = p.email || "(not provided)";
    var phone = p.phone || "(not provided)";
    var company = p.company || "(not provided)";
    var service = p.service || "(not provided)";
    var message = p.message || "(not provided)";
    var page = p.page || "(unknown page)";

    var subject =
      "New website lead: " +
      name +
      (service !== "(not provided)" ? " — " + service : "");

    var body =
      "New contact form submission from the Tinqbit website\n\n" +
      "Name: " + name + "\n" +
      "Email: " + email + "\n" +
      "Phone: " + phone + "\n" +
      "Company: " + company + "\n" +
      "Service interested in: " + service + "\n" +
      "Submitted from: " + page + "\n\n" +
      "Message:\n" +
      message;

    var options = { name: SENDER_NAME };
    if (isValidEmail(email)) {
      options.replyTo = email;
    }

    MailApp.sendEmail(RECIPIENT_EMAIL, subject, body, options);

    return jsonOutput({ result: "success" });
  } catch (err) {
    return jsonOutput({ result: "error", message: String(err) });
  }
}

// Lets you sanity-check the deployment by opening the /exec URL in a browser.
function doGet() {
  return jsonOutput({
    status: "ok",
    message: "Tinqbit contact form endpoint is live.",
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
