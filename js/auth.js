/* Sign in, register and forgot password pages. Each form sets
   data-auth="signin" | "signup" | "forgot". There is no real account service
   behind this prototype: valid sign in / registration continues to the
   dashboard, and passwords are never stored. */

(function () {
  // ---- Side panel -------------------------------------------------------------
  // 1. The brand's own photo (authImage in js/brand.js), else
  // 2. a stock photo for this page (free Unsplash licence, loaded from
  //    images.unsplash.com), else, if that can't load,
  // 3. a home-and-keys illustration drawn in the brand colours.
  var visual = document.querySelector(".auth-visual");
  var authForm = document.querySelector("[data-auth]");
  var page = authForm ? authForm.getAttribute("data-auth") : "signin";

  // Sources: unsplash.com/photos/holding-house-keys-in-front-of-the-entrance-bqUZEAeWuok,
  // unsplash.com/photos/a-living-room-filled-with-furniture-and-a-large-window (photo-1583847268964),
  // unsplash.com/photos/modern-living-room-with-large-windows-overlooking-nature (photo-1758565811178).
  var UNSPLASH = "https://images.unsplash.com/";
  var PHOTOS = {
    signin: { id: "photo-1741156386380-0236c72eb6f9", position: "42% center" },
    signup: { id: "photo-1583847268964-b28dc8f51f92", position: "center 60%" },
    forgot: { id: "photo-1758565811178-6341e9999f48", position: "center" },
    reset: { id: "photo-1758565811178-6341e9999f48", position: "center" },
  };

  var CAPTION =
    '<div class="auth-visual__caption">' +
      '<p class="auth-visual__title">Your home journey, made simple.</p>' +
      "<p>Upload documents, track your application and talk to your specialist, all in one place.</p>" +
    "</div>";

  function drawIllustration() {
    visual.classList.add("auth-visual--art");
    visual.innerHTML =
      '<svg class="auth-art" viewBox="-200 0 1000 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
        "<defs>" +
          '<linearGradient id="art-sky" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" style="stop-color: var(--accent-tint)"/>' +
            '<stop offset="0.75" style="stop-color: var(--primary-wash)"/>' +
          "</linearGradient>" +
          '<linearGradient id="art-fade" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/>' +
          "</linearGradient>" +
        "</defs>" +
        '<rect x="-200" width="1000" height="800" fill="url(#art-sky)"/>' +
        // sun + clouds
        '<circle cx="130" cy="300" r="62" style="fill: var(--accent)" opacity="0.18"/>' +
        '<circle cx="130" cy="300" r="40" style="fill: var(--accent)" opacity="0.45"/>' +
        '<rect x="-60" y="236" width="120" height="30" rx="15" fill="#fff" opacity="0.75"/>' +
        '<rect x="-20" y="218" width="70" height="30" rx="15" fill="#fff" opacity="0.75"/>' +
        '<rect x="610" y="250" width="110" height="26" rx="13" fill="#fff" opacity="0.7"/>' +
        // hills
        '<path d="M-220 570 C -60 520, 120 500, 260 525 S 520 515, 640 535 S 760 520, 820 530 L 820 820 L -220 820 Z" style="fill: var(--accent-line)" opacity="0.55"/>' +
        '<path d="M-220 615 C -40 590, 140 585, 300 592 S 560 588, 820 600 L 820 820 L -220 820 Z" fill="#fff"/>' +
        // trees
        '<rect x="96" y="500" width="8" height="70" rx="4" style="fill: var(--brand-ink)" opacity="0.55"/>' +
        '<circle cx="100" cy="478" r="40" fill="#a9b89a"/><circle cx="78" cy="505" r="26" fill="#bcc9ad"/><circle cx="124" cy="502" r="28" fill="#98a988"/>' +
        '<circle cx="540" cy="575" r="26" fill="#a9b89a"/><circle cx="515" cy="585" r="18" fill="#bcc9ad"/>' +
        // house: extension
        '<rect x="420" y="468" width="92" height="132" style="fill: var(--gray-50)"/>' +
        '<rect x="412" y="456" width="108" height="16" rx="3" style="fill: var(--brand-ink)"/>' +
        '<rect x="440" y="500" width="52" height="44" rx="3" style="fill: var(--accent)" opacity="0.8"/>' +
        '<path d="M466 500v44M440 522h52" stroke="#fff" stroke-width="3"/>' +
        // house: main block, roof, chimney
        '<rect x="200" y="322" width="24" height="64" rx="2" style="fill: var(--brand-ink)"/>' +
        '<rect x="168" y="408" width="256" height="192" fill="#fff"/>' +
        '<path d="M146 420 L 296 296 L 446 420 Z" style="fill: var(--primary)"/>' +
        '<path d="M146 420 L 296 296 L 446 420 L 436 430 L 296 314 L 156 430 Z" style="fill: var(--primary-dark)"/>' +
        '<circle cx="296" cy="372" r="18" style="fill: var(--accent-tint); stroke: var(--primary-dark)" stroke-width="4"/>' +
        // windows + door
        '<rect x="194" y="460" width="64" height="58" rx="3" style="fill: var(--accent)" opacity="0.85"/>' +
        '<path d="M226 460v58M194 489h64" stroke="#fff" stroke-width="3"/>' +
        '<rect x="334" y="460" width="64" height="58" rx="3" style="fill: var(--accent)" opacity="0.85"/>' +
        '<path d="M366 460v58M334 489h64" stroke="#fff" stroke-width="3"/>' +
        '<rect x="272" y="504" width="48" height="96" rx="4" style="fill: var(--primary-dark)"/>' +
        '<circle cx="310" cy="556" r="4" style="fill: var(--accent)"/>' +
        '<path d="M262 600 L 330 600 L 360 820 L 230 820 Z" style="fill: var(--gray-100)"/>' +
        // keys
        '<g transform="translate(420 676) rotate(-28)">' +
          '<circle cx="0" cy="0" r="30" fill="none" style="stroke: var(--brand-ink)" stroke-width="11"/>' +
          '<rect x="26" y="-6" width="96" height="12" rx="6" style="fill: var(--brand-ink)"/>' +
          '<rect x="96" y="2" width="10" height="20" rx="3" style="fill: var(--brand-ink)"/>' +
          '<rect x="112" y="2" width="10" height="14" rx="3" style="fill: var(--brand-ink)"/>' +
        "</g>" +
        '<g transform="translate(396 652) rotate(18)">' +
          '<rect x="-34" y="-20" width="64" height="40" rx="10" style="fill: var(--primary)"/>' +
          '<circle cx="-22" cy="0" r="5" fill="#fff"/>' +
          '<rect x="-10" y="-5" width="30" height="10" rx="5" fill="#fff" opacity="0.7"/>' +
        "</g>" +
        '<rect x="-200" y="720" width="1000" height="80" fill="url(#art-fade)"/>' +
        // "application complete" card
        '<g transform="translate(368 280)">' +
          '<rect width="210" height="64" rx="16" fill="#fff"/>' +
          '<circle cx="32" cy="32" r="16" style="fill: var(--accent-tint)"/>' +
          '<path d="M24 32.5l5.5 5.5 10.5-11.5" fill="none" style="stroke: var(--accent-dark)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<text x="58" y="29" font-size="14" font-weight="600" style="fill: var(--gray-900); font-family: var(--font)">Application complete</text>' +
          '<rect x="58" y="39" width="104" height="7" rx="3.5" style="fill: var(--gray-100)"/>' +
        "</g>" +
      "</svg>" + CAPTION;
  }

  if (visual && !(window.PortalBrand && window.PortalBrand.authImage)) {
    var photo = PHOTOS[page] || PHOTOS.signin;
    var url = UNSPLASH + photo.id + "?auto=format&fit=crop&w=1400&q=80";
    var probe = new Image();
    probe.onload = function () {
      visual.classList.add("auth-visual--photo");
      visual.style.backgroundImage = 'url("' + url + '")';
      visual.style.backgroundPosition = photo.position;
      visual.innerHTML = CAPTION;
    };
    probe.onerror = drawIllustration;
    probe.src = url;
  }

  var form = document.querySelector("[data-auth]");
  if (!form) return;
  var mode = form.getAttribute("data-auth");
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---- Show / hide password -------------------------------------------------------
  form.querySelectorAll(".auth-reveal").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = btn.parentElement.querySelector("input");
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      input.focus();
    });
  });

  // ---- Field errors ---------------------------------------------------------------
  function setError(input, msg) {
    var field = input.closest(".auth-field");
    field.classList.add("has-error");
    var note = field.querySelector(".auth-error");
    if (!note) {
      note = document.createElement("p");
      note.className = "auth-error";
      note.id = input.id + "-error";
      field.appendChild(note);
    }
    note.textContent = msg;
    input.setAttribute("aria-invalid", "true");
    var describedBy = (input.getAttribute("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== note.id; });
    describedBy.push(note.id);
    input.setAttribute("aria-describedby", describedBy.join(" "));
  }

  function clearError(input) {
    var field = input.closest && input.closest(".auth-field");
    if (!field) return;
    field.classList.remove("has-error");
    var note = field.querySelector(".auth-error");
    if (note) {
      var rest = (input.getAttribute("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== note.id; });
      if (rest.length) input.setAttribute("aria-describedby", rest.join(" "));
      else input.removeAttribute("aria-describedby");
      note.remove();
    }
    input.removeAttribute("aria-invalid");
  }

  function checkEmail(input) {
    var v = input.value.trim();
    if (!v) { setError(input, "Please enter your email address."); return false; }
    if (!EMAIL.test(v)) { setError(input, "Enter an email address like name@example.com."); return false; }
    clearError(input);
    return true;
  }

  function required(input, msg) {
    if (!input.value.trim()) { setError(input, msg); return false; }
    clearError(input);
    return true;
  }

  form.addEventListener("input", function (e) {
    if (e.target.matches("input")) clearError(e.target);
  });

  // ---- New password rules (register and reset) -------------------------------------
  function passwordRules(v) {
    return {
      length: v.length >= 8,
      cases: /[a-z]/.test(v) && /[A-Z]/.test(v),
      number: /\d/.test(v),
      symbol: /[^A-Za-z0-9]/.test(v),
    };
  }

  // Ticks the rule list; returns true when every rule is met.
  function renderRules(v) {
    var r = passwordRules(v);
    Object.keys(r).forEach(function (k) {
      form.querySelector('[data-rule="' + k + '"]').classList.toggle("is-met", r[k]);
    });
    return r.length && r.cases && r.number && r.symbol;
  }

  // Shows field errors for a new password + confirmation; returns true if valid.
  function checkNewPassword(pw, confirm) {
    var ok = true;
    if (!renderRules(pw.value)) {
      var r = passwordRules(pw.value);
      var missing = [
        !r.length && "at least 8 characters",
        !r.cases && "upper and lowercase letters",
        !r.number && "a number",
        !r.symbol && "a symbol",
      ].filter(Boolean);
      setError(pw, "Your password still needs: " + missing.join(", ") + ".");
      ok = false;
    }
    if (confirm.value !== pw.value) { setError(confirm, "The passwords don't match."); ok = false; }
    return ok;
  }

  // ---- Sign in --------------------------------------------------------------------
  if (mode === "signin") {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.elements.email;
      var password = form.elements.password;
      var ok = checkEmail(email);
      ok = required(password, "Please enter your password.") && ok;
      if (!ok) { form.querySelector("[aria-invalid]").focus(); return; }
      window.location.href = "index.html";
    });
  }

  // ---- Register -------------------------------------------------------------------
  if (mode === "signup") {
    var pw = form.elements.password;
    var confirm = form.elements.confirm;
    var submit = form.querySelector(".auth-submit");

    // Register unlocks once everything is filled in and both boxes are ticked;
    // detailed problems are explained when it's pressed.
    function sync() {
      var filled = ["firstName", "lastName", "email", "phone", "password", "confirm"].every(function (n) {
        return form.elements[n].value.trim();
      });
      submit.disabled = !(filled && form.elements.terms.checked && form.elements.privacy.checked);
    }

    form.addEventListener("input", function () { renderRules(pw.value); sync(); });
    form.addEventListener("change", sync);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ok = required(form.elements.firstName, "Please enter your first name.") && ok;
      ok = required(form.elements.lastName, "Please enter your last name.") && ok;
      ok = checkEmail(form.elements.email) && ok;
      var phone = form.elements.phone;
      if (!/^\+?[\d\s()-]{7,}$/.test(phone.value.trim())) { setError(phone, "Enter a phone number, e.g. +353 87 123 4567."); ok = false; }
      ok = checkNewPassword(pw, confirm) && ok;
      if (!ok) { form.querySelector("[aria-invalid]").focus(); return; }

      // Keep the name and email for the portal (same store as PortalProfile in
      // js/layout.js, which isn't loaded on signed-out pages). The password is
      // not stored.
      try {
        var saved = JSON.parse(window.localStorage.getItem("portal.profile")) || {};
        saved.firstName = form.elements.firstName.value.trim();
        saved.lastName = form.elements.lastName.value.trim();
        saved.email = form.elements.email.value.trim();
        window.localStorage.setItem("portal.profile", JSON.stringify(saved));
      } catch (err) { /* storage blocked: continue without saving */ }
      window.location.href = "welcome.html";
    });

    renderRules(pw.value);
    sync();
  }

  // ---- Reset password (from the emailed link) ----------------------------------------
  if (mode === "reset") {
    var newPw = form.elements.password;
    var newConfirm = form.elements.confirm;
    var resetBtn = form.querySelector(".auth-submit");
    var choose = document.querySelector("[data-step='choose']");
    var done = document.querySelector("[data-step='done']");

    function syncReset() {
      resetBtn.disabled = !(newPw.value && newConfirm.value);
    }

    form.addEventListener("input", function () { renderRules(newPw.value); syncReset(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!checkNewPassword(newPw, newConfirm)) { form.querySelector("[aria-invalid]").focus(); return; }
      // The live portal checks the link's token and saves the password; nothing is stored here.
      form.reset();
      choose.hidden = true;
      done.hidden = false;
      done.querySelector("h1").focus();
    });

    renderRules("");
    syncReset();
  }

  // ---- Forgot password ------------------------------------------------------------------
  if (mode === "forgot") {
    var request = document.querySelector("[data-step='request']");
    var sent = document.querySelector("[data-step='sent']");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.elements.email;
      if (!checkEmail(email)) { email.focus(); return; }
      document.querySelector("[data-sent-email]").textContent = email.value.trim();
      request.hidden = true;
      sent.hidden = false;
      sent.querySelector("h1").focus();
    });

    document.querySelector("[data-resend]").addEventListener("click", function (e) {
      e.target.textContent = "Sent again";
      e.target.disabled = true;
    });

    document.querySelector("[data-change-email]").addEventListener("click", function () {
      sent.hidden = true;
      request.hidden = false;
      form.elements.email.focus();
    });
  }
})();
