/* My account pages (one per item in the account menu): account details,
   consents, notification settings, your data and change password. Each page
   sets <body data-account-page="..."> and gets the shared side column from
   here. Everything is kept in this browser through PortalProfile
   (js/layout.js) until connected to the portal. Passwords are never stored. */

(function () {
  var Profile = window.PortalProfile;
  var toastEl = document.querySelector("[data-toast]");
  var toastTimer = null;

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3200);
  }

  function longDate(iso) {
    var d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    return d.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function avatarInner(p, photo) {
    return photo ? '<img src="' + esc(photo) + '" alt="">' : esc(Profile.initials(p));
  }

  // ---- Side column (summary + section links) -------------------------------------
  var PAGES = [
    { key: "details", href: "profile.html", label: "Account details" },
    { key: "consents", href: "consents.html", label: "My consents" },
    { key: "preferences", href: "notification-settings.html", label: "Notifications" },
    { key: "data", href: "your-data.html", label: "Your data" },
    { key: "password", href: "password.html", label: "Change password" },
  ];
  var current = document.body.getAttribute("data-account-page");
  var progress = (window.AppProgress && window.AppProgress.get()) || 21;

  document.querySelector("[data-account-side]").innerHTML =
    '<div class="profile-summary">' +
      '<span class="profile-summary__avatar avatar-fill" data-summary-avatar></span>' +
      '<p class="profile-summary__name" data-full-name></p>' +
      '<p class="profile-summary__email" data-email></p>' +
      '<div class="profile-summary__progress">' +
        '<div class="profile-summary__progress-row"><span>Application</span><span>' + progress + "% complete</span></div>" +
        '<span class="profile-summary__bar"><span style="width:' + progress + '%"></span></span>' +
        '<a class="profile-summary__link" href="application.html?section=application-status">View application status</a>' +
      "</div>" +
    "</div>" +
    '<nav class="profile-nav" aria-label="Account">' +
      PAGES.map(function (pg) {
        var on = pg.key === current;
        return '<a class="profile-nav__link' + (on ? " is-active" : "") + '" href="' + pg.href + '"' + (on ? ' aria-current="page"' : "") + ">" + pg.label + "</a>";
      }).join("") +
      '<span class="profile-nav__divider" aria-hidden="true"></span>' +
      '<a class="profile-nav__link profile-nav__link--logout" href="logout.html">Log out</a>' +
    "</nav>";

  function renderSummary(p) {
    document.querySelector("[data-summary-avatar]").innerHTML = avatarInner(p, p.photo);
    document.querySelector("[data-full-name]").textContent = p.firstName + " " + p.lastName;
    document.querySelector("[data-email]").textContent = p.email;
  }
  renderSummary(Profile.get());

  // ---- Account details ------------------------------------------------------------------
  function setupDetails() {
    var form = document.querySelector("[data-details-form]");
    var photoPreview = document.querySelector("[data-photo-preview]");
    var photoInput = document.querySelector("[data-photo-input]");
    var photoDrop = document.querySelector("[data-photo-drop]");
    var photoRemove = document.querySelector("[data-photo-remove]");
    var photoError = document.querySelector("[data-photo-error]");
    var pendingPhoto = null; // the photo shown in the form, saved on Save

    function renderPhoto() {
      var p = Profile.get();
      p.firstName = form.elements.firstName.value || p.firstName;
      p.lastName = form.elements.lastName.value || p.lastName;
      photoPreview.innerHTML = avatarInner(p, pendingPhoto);
      photoRemove.hidden = !pendingPhoto;
    }

    function fillForm() {
      var p = Profile.get();
      signature.resize(); // the pad can only measure itself once the form is visible
      form.elements.firstName.value = p.firstName;
      form.elements.lastName.value = p.lastName;
      form.elements.email.value = p.email;
      form.elements.country.value = p.country;
      if (form.elements.country.value !== p.country) form.elements.country.value = "Other";
      pendingPhoto = p.photo;
      photoError.hidden = true;
      Array.prototype.forEach.call(form.querySelectorAll("input"), clearError);
      renderPhoto();
      signature.load(p.signature);
    }

    function setError(el, msg) {
      var field = el.closest(".profile-field");
      field.classList.add("has-error");
      var note = field.parentElement.querySelector('[data-error-for="' + el.id + '"]');
      if (!note) {
        note = document.createElement("p");
        note.className = "profile-field__error";
        note.id = el.id + "-error";
        note.setAttribute("data-error-for", el.id);
        field.insertAdjacentElement("afterend", note);
      }
      note.textContent = msg;
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", note.id);
    }

    function clearError(el) {
      var field = el.closest && el.closest(".profile-field");
      if (!field) return;
      field.classList.remove("has-error");
      var note = field.parentElement.querySelector('[data-error-for="' + el.id + '"]');
      if (note) note.remove();
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    }

    form.addEventListener("input", function (e) {
      clearError(e.target);
      if (e.target.name === "firstName" || e.target.name === "lastName") renderPhoto();
    });

    // Photo: any of the accepted types, downscaled to a square for the avatar.
    var PHOTO_TYPES = /^image\/(svg\+xml|png|jpeg|gif)$/;

    function readPhoto(file) {
      photoError.hidden = true;
      if (!file) return;
      if (!PHOTO_TYPES.test(file.type)) {
        photoError.textContent = "Please choose an SVG, PNG, JPG or GIF image.";
        photoError.hidden = false;
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var size = 256;
          var canvas = document.createElement("canvas");
          canvas.width = canvas.height = size;
          var w = img.naturalWidth || size;
          var h = img.naturalHeight || size;
          var side = Math.min(w, h);
          canvas.getContext("2d").drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
          pendingPhoto = canvas.toDataURL("image/jpeg", 0.86);
          renderPhoto();
        };
        img.onerror = function () {
          photoError.textContent = "That image couldn't be opened. Please try another file.";
          photoError.hidden = false;
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    photoInput.addEventListener("change", function () {
      readPhoto(photoInput.files[0]);
      photoInput.value = "";
    });

    ["dragenter", "dragover"].forEach(function (type) {
      photoDrop.addEventListener(type, function (e) {
        e.preventDefault();
        photoDrop.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach(function (type) {
      photoDrop.addEventListener(type, function () { photoDrop.classList.remove("is-dragging"); });
    });
    photoDrop.addEventListener("drop", function (e) {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files.length) readPhoto(e.dataTransfer.files[0]);
    });

    photoRemove.addEventListener("click", function () {
      pendingPhoto = null;
      renderPhoto();
      photoInput.focus();
    });

    // Signature pad: strokes are kept as points so Undo can remove the last one.
    var signature = (function () {
      var canvas = document.querySelector("[data-signature]");
      var placeholder = document.querySelector("[data-signature-placeholder]");
      var ctx = canvas.getContext("2d");
      var strokes = [];
      var base = null;     // previously saved signature image
      var current = null;

      function size() {
        var ratio = window.devicePixelRatio || 1;
        var rect = canvas.getBoundingClientRect();
        canvas.width = Math.round(rect.width * ratio);
        canvas.height = Math.round(rect.height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        draw();
      }

      function draw() {
        var rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (base && base.complete) {
          var scale = Math.min(rect.width / base.naturalWidth, rect.height / base.naturalHeight, 1);
          ctx.drawImage(base, 0, 0, base.naturalWidth * scale, base.naturalHeight * scale);
        }
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--gray-900").trim() || "#1f1712";
        strokes.forEach(function (s) {
          ctx.beginPath();
          s.forEach(function (pt, i) { if (i) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]); });
          if (s.length === 1) ctx.lineTo(s[0][0] + 0.1, s[0][1] + 0.1);
          ctx.stroke();
        });
        placeholder.hidden = !isEmpty() ;
      }

      function point(e) {
        var rect = canvas.getBoundingClientRect();
        return [e.clientX - rect.left, e.clientY - rect.top];
      }

      canvas.addEventListener("pointerdown", function (e) {
        canvas.setPointerCapture(e.pointerId);
        current = [point(e)];
        strokes.push(current);
        draw();
      });
      canvas.addEventListener("pointermove", function (e) {
        if (!current) return;
        current.push(point(e));
        draw();
      });
      ["pointerup", "pointercancel"].forEach(function (type) {
        canvas.addEventListener(type, function () { current = null; });
      });

      function isEmpty() { return !strokes.length && !base; }

      function load(dataUrl) {
        strokes = [];
        base = null;
        if (dataUrl) {
          base = new Image();
          base.onload = draw;
          base.src = dataUrl;
        }
        draw();
      }

      function toDataUrl() {
        if (isEmpty()) return null;
        if (!strokes.length && base) return base.src; // unchanged since it was saved
        // Export at 1x, trimmed to the inked area (plus a little margin).
        var rect = canvas.getBoundingClientRect();
        var w = Math.round(rect.width);
        var h = Math.round(rect.height);
        var full = document.createElement("canvas");
        full.width = w;
        full.height = h;
        var fctx = full.getContext("2d");
        fctx.drawImage(canvas, 0, 0, w, h);
        var px = fctx.getImageData(0, 0, w, h).data;
        var minX = w, minY = h, maxX = -1, maxY = -1;
        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            if (px[(y * w + x) * 4 + 3] > 0) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) return null;
        var pad = 8;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(w - 1, maxX + pad);
        maxY = Math.min(h - 1, maxY + pad);
        var out = document.createElement("canvas");
        out.width = maxX - minX + 1;
        out.height = maxY - minY + 1;
        out.getContext("2d").drawImage(full, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
        return out.toDataURL("image/png");
      }

      document.querySelector("[data-signature-undo]").addEventListener("click", function () {
        if (strokes.length) strokes.pop();
        draw();
      });
      document.querySelector("[data-signature-clear]").addEventListener("click", function () {
        strokes = [];
        base = null;
        draw();
      });

      window.addEventListener("resize", size);
      size();
      return { load: load, toDataUrl: toDataUrl, resize: size };
    })();

    // ---- View mode: details shown read-only until Edit is pressed ----
    var view = document.querySelector("[data-details-view]");
    var editBtn = document.querySelector("[data-edit-details]");
    var desc = document.querySelector("[data-details-desc]");
    var VIEW_DESC = desc.textContent;
    var PLUS = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

    function emptyValue(text, focus, action) {
      return '<span class="details-view__empty">' + text + "</span>" +
        '<button class="details-view__add" type="button" data-edit-focus="' + focus + '">' + PLUS + action + "</button>";
    }

    function renderView(p) {
      var rows = [
        ["Name", esc(p.firstName + " " + p.lastName)],
        ["Email address", esc(p.email)],
        ["Country", esc(p.country)],
        ["Photo", p.photo
          ? '<span class="details-view__photo"><img src="' + esc(p.photo) + '" alt="Your profile photo"></span>'
          : emptyValue("No photo yet", "photo", "Add photo")],
        ["Signature", p.signature
          ? '<span class="details-view__signature"><img src="' + esc(p.signature) + '" alt="Your signature"></span>'
          : emptyValue("Not added yet", "signature", "Add signature")],
      ];
      view.innerHTML = rows.map(function (r) {
        return '<div class="details-view__row"><dt>' + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
      }).join("");
    }

    function openForm(focus) {
      view.hidden = true;
      editBtn.hidden = true;
      form.hidden = false;
      desc.textContent = "Update your photo and personal details here.";
      fillForm();
      if (focus === "photo") photoInput.focus();
      else if (focus === "signature") {
        var pad = document.querySelector("[data-signature]");
        pad.scrollIntoView({ block: "center" });
        document.querySelector("[data-signature-undo]").focus({ preventScroll: true });
      } else form.elements.firstName.focus();
    }

    function closeForm() {
      form.hidden = true;
      view.hidden = false;
      editBtn.hidden = false;
      desc.textContent = VIEW_DESC;
      renderView(Profile.get());
      editBtn.focus();
    }

    editBtn.addEventListener("click", function () { openForm(); });
    view.addEventListener("click", function (e) {
      var add = e.target.closest("[data-edit-focus]");
      if (add) openForm(add.getAttribute("data-edit-focus"));
    });

    form.querySelector("[data-cancel-details]").addEventListener("click", closeForm);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      ["firstName", "lastName", "email"].forEach(function (name) {
        var el = form.elements[name];
        if (!el.value.trim()) {
          setError(el, "Please input required content");
          first = first || el;
        }
      });
      var email = form.elements.email;
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        setError(email, "Enter an email address like name@example.com");
        first = first || email;
      }
      if (first) { first.focus(); return; }

      var p = Profile.get();
      p.firstName = form.elements.firstName.value.trim();
      p.lastName = form.elements.lastName.value.trim();
      p.email = email.value.trim();
      p.country = form.elements.country.value;
      p.photo = pendingPhoto;
      p.signature = signature.toDataUrl();
      if (!Profile.save(p)) {
        toast("Couldn't save in this browser – try a smaller photo.");
        return;
      }
      renderSummary(p);
      closeForm();
      toast("Your account details have been saved.");
    });

    renderView(Profile.get());
  }

  // ---- Consents ------------------------------------------------------------------------
  function setupConsents() {
    var marketingBox = document.querySelector("[data-marketing]");
    var marketingStatus = document.querySelector("[data-marketing-status]");
    var contactForm = document.querySelector("[data-contact-form]");
    var contactSave = contactForm.querySelector("[data-contact-save]");
    var contactCancel = contactForm.querySelector("[data-contact-cancel]");

    function renderMarketing() {
      var m = Profile.get().marketing;
      marketingBox.checked = m.choice === true;
      marketingStatus.classList.toggle("is-yes", m.choice === true);
      marketingStatus.classList.toggle("is-no", m.choice === false);
      document.querySelector("[data-marketing-status-text]").textContent =
        m.choice === null ? "No marketing choice has been recorded through this consent control."
        : m.choice ? "You agreed to receive marketing communications on " + longDate(m.date) + "."
        : "You chose not to receive marketing communications on " + longDate(m.date) + ".";
    }

    marketingBox.addEventListener("change", function () {
      var p = Profile.get();
      p.marketing = { choice: marketingBox.checked, date: today() };
      Profile.save(p);
      renderMarketing();
      toast(marketingBox.checked ? "Marketing consent saved." : "Marketing consent withdrawn.");
    });

    function chosenMethods() {
      return Array.prototype.filter.call(contactForm.elements.contact, function (c) { return c.checked; })
        .map(function (c) { return c.value; });
    }

    function syncContactButtons() {
      var dirty = chosenMethods().join() !== Profile.get().contactMethods.join();
      contactSave.disabled = !dirty;
      contactCancel.disabled = !dirty;
    }

    function renderContact() {
      var saved = Profile.get().contactMethods;
      Array.prototype.forEach.call(contactForm.elements.contact, function (c) {
        c.checked = saved.indexOf(c.value) !== -1;
      });
      syncContactButtons();
    }

    contactForm.addEventListener("change", syncContactButtons);
    contactCancel.addEventListener("click", renderContact);
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = Profile.get();
      p.contactMethods = chosenMethods();
      Profile.save(p);
      syncContactButtons();
      toast("Your contact preferences have been saved.");
    });

    renderMarketing();
    renderContact();
  }

  // ---- Notification settings ---------------------------------------------------------------
  function setupPreferences() {
    document.querySelector("[data-pref-email-hint]").textContent = "Sent to " + Profile.get().email;
    document.querySelectorAll("[data-pref]").forEach(function (input) {
      var key = input.getAttribute("data-pref");
      input.checked = !!Profile.get().prefs[key];
      input.addEventListener("change", function () {
        var p = Profile.get();
        p.prefs[key] = input.checked;
        Profile.save(p);
        toast("Notification settings saved.");
      });
    });
  }

  // ---- Your data ---------------------------------------------------------------------------
  function setupData() {
    function readKey(key) {
      try { return JSON.parse(window.localStorage.getItem(key)); } catch (e) { return null; }
    }

    function countOf(key, fallback) {
      var v = readKey(key);
      return Array.isArray(v) ? v.length : fallback;
    }

    function renderData() {
      var p = Profile.get();
      var docs = window.UploadsStore ? window.UploadsStore.all().length : 0;
      var rows = [
        ["Account details", "Name, email, country" + (p.photo ? ", photo" : "") + (p.signature ? ", signature" : "")],
        ["Application answers", progress + "% complete"],
        ["Documents", docs + (docs === 1 ? " file" : " files") + " uploaded"],
        ["Messages", countOf("portal.messages", 2) + " conversations with your specialist"],
        ["Appointments", countOf("portal.appointments", 2) + " booked calls"],
        ["Consents", "Marketing choice and preferred contact methods"],
      ];
      document.querySelector("[data-data-list]").innerHTML = rows.map(function (r) {
        return '<li class="data-list__row"><span class="data-list__label">' + r[0] + '</span><span class="data-list__value">' + esc(r[1]) + "</span></li>";
      }).join("");

      var requested = p.deletionRequested;
      document.querySelector("[data-deletion-desc]").textContent = requested
        ? "Request sent " + longDate(requested) + ". Your specialist will be in touch to confirm."
        : "Ask us to close your account and erase your data.";
      document.querySelector("[data-request-deletion]").hidden = !!requested;
    }

    document.querySelector("[data-download-data]").addEventListener("click", function () {
      var p = Profile.get();
      var data = {
        exported: new Date().toISOString(),
        account: { firstName: p.firstName, lastName: p.lastName, email: p.email, country: p.country, photo: p.photo, signature: p.signature },
        marketingConsent: p.marketing,
        preferredContact: p.contactMethods,
        notificationPreferences: p.prefs,
        applicationProgress: progress,
        applicationAnswers: readKey("portal.applicationProgress"),
        completedSections: readKey("portal.completedSections"),
        documents: window.UploadsStore ? window.UploadsStore.all() : [],
        messages: readKey("portal.messages"),
        appointments: readKey("portal.appointments"),
        notifications: window.PortalNotifications ? window.PortalNotifications.all() : [],
      };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = ((window.PortalBrand && window.PortalBrand.slug) || "portal") + "-my-data-" + today() + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast("Your data download has started.");
    });

    var deletionBtn = document.querySelector("[data-request-deletion]");
    var deletionConfirm = document.querySelector("[data-deletion-confirm]");

    deletionBtn.addEventListener("click", function () {
      deletionConfirm.hidden = false;
      deletionConfirm.querySelector("[data-deletion-cancel]").focus();
    });
    deletionConfirm.querySelector("[data-deletion-cancel]").addEventListener("click", function () {
      deletionConfirm.hidden = true;
      deletionBtn.focus();
    });
    deletionConfirm.querySelector("[data-deletion-send]").addEventListener("click", function () {
      var p = Profile.get();
      p.deletionRequested = today();
      Profile.save(p);
      deletionConfirm.hidden = true;
      renderData();
      toast("Deletion request sent to your specialist.");
    });

    renderData();
  }

  // ---- Change password ---------------------------------------------------------------------
  function setupPassword() {
    var pwForm = document.querySelector("[data-password-form]");
    var pwError = pwForm.querySelector("[data-password-error]");
    var pwNew = pwForm.querySelector("#pw-new");
    var pwConfirm = pwForm.querySelector("#pw-confirm");

    function renderPasswordMeta() {
      document.querySelector("[data-password-meta]").textContent = "Last changed " + longDate(Profile.get().passwordChanged);
    }

    function checkRules() {
      var v = pwNew.value;
      var rules = {
        length: v.length >= 8,
        mix: /[a-z]/i.test(v) && /\d/.test(v),
        match: !!v && v === pwConfirm.value,
      };
      Object.keys(rules).forEach(function (k) {
        pwForm.querySelector('[data-rule="' + k + '"]').classList.toggle("is-met", rules[k]);
      });
      return rules;
    }

    pwForm.addEventListener("input", function () {
      pwError.hidden = true;
      checkRules();
    });
    pwForm.addEventListener("reset", function () {
      pwError.hidden = true;
      setTimeout(checkRules, 0);
    });

    pwForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var current = pwForm.querySelector("#pw-current");
      var rules = checkRules();
      var msg = !current.value || !pwNew.value || !pwConfirm.value ? "Please fill in all three fields."
        : !rules.length ? "Your new password needs at least 8 characters."
        : !rules.mix ? "Use both letters and numbers in your new password."
        : !rules.match ? "The new passwords don't match."
        : pwNew.value === current.value ? "Choose a password different from your current one."
        : "";
      if (msg) {
        pwError.textContent = msg;
        pwError.hidden = false;
        return;
      }
      // Only the date is kept; the live portal handles the actual change.
      var p = Profile.get();
      p.passwordChanged = today();
      Profile.save(p);
      pwForm.reset();
      renderPasswordMeta();
      toast("Your password has been updated.");
    });
    renderPasswordMeta();
  }

  ({
    details: setupDetails,
    consents: setupConsents,
    preferences: setupPreferences,
    data: setupData,
    password: setupPassword,
  }[current] || function () {})();
})();
