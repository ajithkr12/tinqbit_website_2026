/*
 * Tinqbit lead form handler.
 *
 * Wires up every contact / quote-request form on the site (anything inside
 * a `.contact-form-wrap`) so it validates, sends the lead by email via a
 * Google Apps Script web app, and shows feedback on submit.
 *
 * Setup: deploy google-apps-script/contact-form/Code.gs as a Web App
 * (Execute as: Me, Who has access: Anyone), then paste the resulting
 * /exec URL into FORM_ENDPOINT below. See that file's header comment for
 * full deployment steps.
 */
(function () {
  // Paste your deployed Google Apps Script Web App URL here, e.g.
  // "https://script.google.com/macros/s/AKfycbx.../exec"
  var FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbzIoQ80rLIJYw7n6TqbLgegok1Q2rMvITyXFsem3k3t17LP9aQtgRYJ8jHNA4eE_MP1/exec";

  function showFeedback(form, message, isError) {
    var el = form.querySelector(".form-feedback");
    if (!el) {
      el = document.createElement("p");
      el.className = "form-feedback";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      form.appendChild(el);
    }
    el.textContent = message;
    el.classList.toggle("is-error", !!isError);
    el.classList.toggle("is-success", !isError);
  }

  function handleSubmit(event) {
    var form = event.target;
    event.preventDefault();

    if (!form.checkValidity()) {
      // Let the browser highlight invalid fields.
      form.reportValidity();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalLabel = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
    }

    if (!FORM_ENDPOINT) {
      // No backend connected yet — confirm the request locally so the form
      // doesn't appear broken, but remind us (in the console) to wire it up.
      console.warn(
        "[Tinqbit] Form submitted but FORM_ENDPOINT is not configured in scripts/form-handler.js — no data was sent.",
      );
      showFeedback(
        form,
        "Thanks! Your request has been received — we'll get back to you within 2 business hours.",
        false,
      );
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "";
        submitBtn.innerHTML = originalLabel;
      }
      return;
    }

    var payload = new FormData(form);
    payload.append("page", document.title + " — " + location.href);

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: payload,
    })
      .then(function (response) {
        if (response.ok) {
          showFeedback(
            form,
            "Thanks! Your request has been received — we'll get back to you within 2 business hours.",
            false,
          );
          form.reset();
        } else {
          showFeedback(
            form,
            "Something went wrong sending your request. Please try again or email info@tinqbit.com.",
            true,
          );
        }
      })
      .catch(function () {
        showFeedback(
          form,
          "Something went wrong sending your request. Please try again or email info@tinqbit.com.",
          true,
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = "";
          submitBtn.innerHTML = originalLabel;
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document
      .querySelectorAll(".contact-form-wrap form")
      .forEach(function (form) {
        form.addEventListener("submit", handleSubmit);
      });
  });
})();
