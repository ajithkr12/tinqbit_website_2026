/*
 * Tinqbit lead form handler.
 *
 * Wires up every contact / quote-request form on the site (anything inside
 * a `.contact-form-wrap`) so it validates and shows feedback on submit.
 *
 * TODO before launch: this does not send data anywhere yet. Connect a real
 * backend by either:
 *   1. Form service (recommended): sign up for Formspree (formspree.io) or
 *      Web3Forms (web3forms.com), then set FORM_ENDPOINT below to the
 *      endpoint/access-key URL they give you. The fetch() call below will
 *      start working immediately once FORM_ENDPOINT is set.
 *   2. Custom backend: point FORM_ENDPOINT at your own API route that
 *      accepts a POST with FormData/JSON and sends an email/CRM lead.
 */
(function () {
  // Set this to your form-service endpoint, e.g.
  // "https://formspree.io/f/xxxxxxxx" or "https://api.web3forms.com/submit"
  var FORM_ENDPOINT = "";

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

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
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
