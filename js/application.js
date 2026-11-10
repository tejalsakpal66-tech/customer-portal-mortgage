/* Application page – step 1 "Application details" (two parts):
   progress rings, select options, floating labels, residency switch,
   validation and switching between part 1 and part 2. */

(function () {
  var REQUIRED_MSG = "Field is required";

  // ---- Option lists -------------------------------------------------------
  var OPTIONS = {
    countries: [
      "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
      "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
      "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
      "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad",
      "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
      "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
      "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
      "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
      "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
      "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo",
      "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
      "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
      "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
      "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
      "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
      "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
      "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
      "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
      "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
      "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
      "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
      "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
      "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ],
    nationalities: [
      "Afghan", "Albanian", "Algerian", "American", "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
      "Bangladeshi", "Belarusian", "Belgian", "Bolivian", "Bosnian", "Brazilian", "British", "Bulgarian", "Cameroonian",
      "Canadian", "Chilean", "Chinese", "Colombian", "Congolese", "Croatian", "Cuban", "Cypriot", "Czech", "Danish",
      "Dutch", "Ecuadorian", "Egyptian", "Emirati", "Estonian", "Ethiopian", "Filipino", "Finnish", "French",
      "Georgian", "German", "Ghanaian", "Greek", "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi",
      "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan", "Kosovan",
      "Kuwaiti", "Latvian", "Lebanese", "Libyan", "Lithuanian", "Luxembourgish", "Malaysian", "Maltese", "Mauritian",
      "Mexican", "Moldovan", "Mongolian", "Montenegrin", "Moroccan", "Nepalese", "New Zealander", "Nigerian",
      "North Macedonian", "Norwegian", "Pakistani", "Palestinian", "Peruvian", "Polish", "Portuguese", "Qatari",
      "Romanian", "Russian", "Rwandan", "Saudi", "Serbian", "Singaporean", "Slovak", "Slovenian", "Somali",
      "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss", "Syrian", "Taiwanese",
      "Tanzanian", "Thai", "Tunisian", "Turkish", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan",
      "Vietnamese", "Yemeni", "Zambian", "Zimbabwean", "Other"
    ],
    counties: [
      "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois",
      "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo",
      "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"
    ],
    // Lists below match the live portal.
    maritalStatuses: ["Married", "Single", "Cohabiting", "Divorced", "Separated", "Widowed", "Civil Partnership"],
    genders: ["Male", "Female", "Non-Binary", "Other"],
    employmentTypes: [
      "PAYE", "Self Employed", "Public Servant", "Not currently employed/working at home",
      "Unpaid employment e.g. unpaid maternity"
    ],
    citizenTypes: ["UK", "EU", "Non EU"],
    workVisas: ["I don't have a work VISA", "Stamp1", "Stamp2", "Stamp3", "Stamp4"],
    residenceSituations: [
      "Own property with a mortgage", "Own property outright (without a mortgage)", "Renting", "Living with relatives"
    ],
    months: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
  };

  window.PortalOptions = OPTIONS;

  document.querySelectorAll("select[data-options]").forEach(function (select) {
    var list = OPTIONS[select.getAttribute("data-options")] || [];
    var selected = select.getAttribute("data-default") || "";
    var html = '<option value=""' + (selected ? "" : " selected") + "></option>";
    list.forEach(function (item) {
      html += "<option" + (item === selected ? " selected" : "") + ">" + item + "</option>";
    });
    select.innerHTML = html;
  });

  // ---- Progress rings -----------------------------------------------------
  var SIZE = 44;
  var STROKE = 3.6;
  var R = (SIZE - STROKE) / 2;
  var C = 2 * Math.PI * R;
  var rings = document.querySelectorAll(".ring");

  function renderRing(ring, value) {
    value = Math.max(0, Math.min(100, parseFloat(value) || 0));
    ring.setAttribute("role", "img");
    ring.setAttribute("aria-label", value + "% complete");
    ring.innerHTML =
      '<svg viewBox="0 0 ' + SIZE + " " + SIZE + '" aria-hidden="true">' +
      '<circle class="ring__track" cx="22" cy="22" r="' + R + '"/>' +
      (value > 0
        ? '<circle class="ring__bar" cx="22" cy="22" r="' + R + '" stroke-dasharray="' +
          (C * value) / 100 + " " + C + '"/>'
        : "") +
      "</svg>" +
      '<span class="ring__value" aria-hidden="true">' + value + "%</span>";
  }

  // Status line under each step in the compact (stepper) layout.
  function renderStepState(step, value) {
    var key = step.getAttribute("data-section");
    var pct = Math.max(0, Math.min(100, parseFloat(value) || 0));
    var done = key !== "application-status" &&
      (pct >= 100 || window.AppProgress.completed().indexOf(key) !== -1);
    step.classList.toggle("is-done", done);

    var status = step.querySelector(".step__status");
    if (!status) {
      status = document.createElement("span");
      status.className = "step__status";
      step.querySelector(".step__label").insertAdjacentElement("afterend", status);
    }
    // The mobile stepper shows the percentage on the ring, so the " · 46%"
    // part is only displayed in the desktop sidebar.
    status.textContent = done ? "Completed"
      : pct > 0 || step.classList.contains("is-active") ? "In progress"
      : "Not started";
    if (!done && pct > 0) {
      var pctEl = document.createElement("span");
      pctEl.className = "step__status-pct";
      pctEl.textContent = " · " + pct + "%";
      status.appendChild(pctEl);
    }
  }

  function renderRings(part) {
    rings.forEach(function (ring) {
      var value = ring.getAttribute("data-value-" + part) || ring.getAttribute("data-value");
      renderRing(ring, value);
      renderStepState(ring.closest(".step"), value);
      // The "Your application status" ring is the overall progress shown on the dashboard.
      if (ring.closest(".step").getAttribute("data-section") === "application-status") {
        window.AppProgress.set(parseInt(value, 10) || 0);
      }
    });
  }

  // ---- Floating labels ----------------------------------------------------
  var allControls = document.querySelectorAll(".form-card input:not([type=checkbox]):not([type=radio]), .form-card select");

  function syncFilled(el) {
    var tf = el.closest(".tf");
    if (tf) tf.classList.toggle("is-filled", el.value !== "");
  }

  allControls.forEach(function (el) {
    syncFilled(el);
    ["input", "change"].forEach(function (type) {
      el.addEventListener(type, function () {
        syncFilled(el);
        clearError(el);
      });
    });
  });

  // ---- Errors -------------------------------------------------------------
  function wrapperOf(el) {
    return el.closest(".tf, .lf, .yes-no");
  }

  function showError(el, message) {
    var wrap = wrapperOf(el);
    var msg = wrap.querySelector(".field-error");
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "field-error";
      msg.id = (el.id || el.name) + "-error";
      wrap.appendChild(msg);
    }
    msg.textContent = message;
    wrap.classList.add("has-error");
    el.setAttribute("aria-invalid", "true");
    el.setAttribute("aria-describedby", msg.id);
  }

  function clearError(el) {
    var wrap = wrapperOf(el);
    if (!wrap) return;
    var msg = wrap.querySelector(".field-error");
    if (msg) msg.remove();
    wrap.classList.remove("has-error");
    el.removeAttribute("aria-invalid");
    el.removeAttribute("aria-describedby");
  }

  // ---- Validation ---------------------------------------------------------
  function ageOn(dobValue, date) {
    var dob = new Date(dobValue);
    if (isNaN(dob)) return null;
    var months = (date.getFullYear() - dob.getFullYear()) * 12 + (date.getMonth() - dob.getMonth());
    if (date.getDate() < dob.getDate()) months--;
    return { years: Math.floor(months / 12), months: months % 12 };
  }

  function errorFor(el) {
    if (el.closest("[hidden]")) return "";
    if (el.required && !el.value.trim()) return REQUIRED_MSG;
    if (el.type === "email" && el.value && !el.checkValidity()) return "Please enter a valid email address";
    if (el.type === "date" && el.value) {
      var age = ageOn(el.value, new Date());
      if (!age || age.years < 18) return "You must be over 18 years old";
    }
    return "";
  }

  function validate(form) {
    var firstInvalid = null;
    form.querySelectorAll("input:not([type=checkbox]):not([type=radio]), select").forEach(function (el) {
      var message = errorFor(el);
      if (message) {
        showError(el, message);
        if (!firstInvalid) firstInvalid = el;
      } else {
        clearError(el);
      }
    });

    form.querySelectorAll(".yes-no[data-required]").forEach(function (group) {
      var first = group.querySelector("input[type=radio]");
      if (!group.querySelector("input:checked")) {
        showError(first, REQUIRED_MSG);
        if (!firstInvalid) firstInvalid = first;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  // ---- Part 1 extras: previous last name ----------------------------------
  var prevToggle = document.getElementById("has-previous-name");
  var prevField = document.getElementById("previous-name-field");
  var prevInput = document.getElementById("previous-name");

  prevToggle.addEventListener("change", function () {
    prevField.hidden = !prevToggle.checked;
    prevInput.required = prevToggle.checked;
    if (prevToggle.checked) prevInput.focus();
    else clearError(prevInput);
  });

  // ---- "All my life" switches fill Years/Months from the date of birth ------
  // Used for residency (part 2) and time at current address (part 3).
  var dob = document.getElementById("dob");
  var durations = Array.prototype.map.call(document.querySelectorAll(".residency"), function (group) {
    return {
      toggle: group.querySelector(".switch input"),
      years: group.querySelector(".tf:not(.tf--select) input"),
      months: group.querySelector(".tf--select select"),
    };
  });

  function syncDurations() {
    var age = dob.value ? ageOn(dob.value, new Date()) : null;
    durations.forEach(function (d) {
      if (d.toggle.checked && age) {
        d.years.value = age.years;
        d.months.value = String(age.months);
        clearError(d.years);
      }
      syncFilled(d.years);
      syncFilled(d.months);
    });
  }

  durations.forEach(function (d) {
    d.toggle.addEventListener("change", syncDurations);
    d.years.addEventListener("input", function () {
      d.years.value = d.years.value.replace(/\D/g, "");
    });
  });
  // ---- Part 2 extras: citizenship follow-up questions ---------------------
  var citizenshipExtra = document.getElementById("citizenship-extra");
  var citizenType = document.getElementById("citizen-type");
  var visa = document.getElementById("work-visa");

  // Both follow-up questions appear when the applicant has no Irish citizenship.
  function syncCitizenship() {
    var checked = document.querySelector("input[name=irishCitizen]:checked");
    citizenshipExtra.hidden = !checked || checked.value !== "no";
    if (citizenshipExtra.hidden) {
      clearError(citizenType);
      clearError(visa);
    }
  }

  document.querySelectorAll(".yes-no input").forEach(function (radio) {
    radio.addEventListener("change", function () {
      clearError(radio.closest(".yes-no").querySelector("input"));
      syncCitizenship();
    });
  });
  syncCitizenship();

  // ---- Switching parts ----------------------------------------------------
  var parts = [
    document.getElementById("details-form"),
    document.getElementById("details-form-2"),
    document.getElementById("details-form-3"),
    document.getElementById("details-form-4"),
  ];
  var card = document.querySelector('[data-section="applicant-detail"].form-card');

  function showPart(n) {
    parts.forEach(function (form, i) {
      form.hidden = i + 1 !== n;
    });
    document.querySelectorAll("[data-substep]").forEach(function (el) {
      el.hidden = el.getAttribute("data-substep") !== String(n);
    });
    renderRings(n);
    if (n > 1) syncDurations();

    var top = card.getBoundingClientRect().top + window.scrollY - 140;
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  parts.forEach(function (form, i) {
    var n = i + 1;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      if (n < parts.length) showPart(n + 1);
      else showDetailsSummary();
    });
    var back = form.querySelector("[data-action=back]");
    if (back) {
      back.addEventListener("click", function () {
        showPart(n - 1);
      });
    }
  });

  // ---- Applicant Details Summary ------------------------------------------
  var detailsDone = false;
  var NAME_LABELS = ["What is your first name?", "What is your middle name?", "What is your last name?"];
  var ADDRESS_LABELS = ["Eircode", "Address line 1", "Address line 2", "Address line 3", "Country", "County"];
  var SUMMARY_LABELS = {
    "What was your previous last name?": "What was your most recent previous last name?",
    "What is your email?": "Email",
    "What is your contact number?": "Contact number",
    "What is your marital status?": "Marital status",
    "What is your date of birth (over 18 years only)?": "Date of birth",
    "What is your gender?": "Gender",
    "What is your primary employment type?": "Employment type",
    "What is your country of birth?": "Country of birth",
    "What is your country of residence?": "Country of residence",
    "What is your nationality?": "Nationality",
  };

  var PART_TITLES = ["Personal details", "Residency, citizenship and address", "Time at current address", "Tax and living situation"];

  // Rows for one part of step 1, using the portal's summary labels.
  function detailsRowsFor(form, partIndex) {
    var raw = window.PortalSections.collectRows([form]);
    var get = function (label) {
      var row = raw.filter(function (r) { return r.label === label; })[0];
      return row ? row.value : "";
    };
    var rows = [];
    if (partIndex === 0) {
      rows.push({ label: "Name", value: NAME_LABELS.map(get).filter(Boolean).join(" ") });
      rows.push({ label: "Mortgage Type", value: "First time buyer" });
    }
    var durationLabel = partIndex === 1 ? "How long have you been a resident?" : "How long have you lived there?";
    var years = null;
    var addressDone = false;
    raw.forEach(function (r) {
      if (NAME_LABELS.indexOf(r.label) !== -1) return;
      if (r.label === "Years") { years = r.value; return; }
      if (r.label === "Months") {
        rows.push({ label: durationLabel, value: (years || 0) + " years " + r.value + " months" });
        years = null;
        return;
      }
      if (ADDRESS_LABELS.indexOf(r.label) !== -1) {
        if (!addressDone) {
          addressDone = true;
          rows.push({
            label: "Current address",
            value: ["Address line 1", "Address line 2", "Address line 3", "County", "Eircode", "Country"].map(get).filter(Boolean).join(", "),
          });
        }
        return;
      }
      rows.push({ label: SUMMARY_LABELS[r.label] || r.label, value: r.value });
    });
    return rows;
  }

  function detailsBlocks() {
    return parts.map(function (form, i) {
      return { title: PART_TITLES[i], part: i + 1, rows: detailsRowsFor(form, i) };
    });
  }

  function showDetailsSummary() {
    detailsDone = true;
    window.AppProgress.complete("applicant-detail");
    parts.forEach(function (form) { form.hidden = true; });
    renderRings(parts.length + 1);
    window.PortalSections.mountSummary(card, "Applicant Details Summary", detailsBlocks(),
      function (n) { showPart(n); },
      function () { goToSection("documents"); });
  }

  // ---- "Your income" only applies to applicants who are working ---------
  var employment = document.getElementById("employment-type");
  var NOT_WORKING = ["Not currently employed/working at home", "Unpaid employment e.g. unpaid maternity"];
  var incomeStep = document.querySelector('[data-step="income"]');

  function syncIncomeStep() {
    incomeStep.hidden = NOT_WORKING.indexOf(employment.value) !== -1;
  }
  employment.addEventListener("change", syncIncomeStep);
  syncIncomeStep();

  // ---- Sections (?section=… like the live portal) -------------------------
  var SUBTITLES = {
    "applicant-detail": "Your application details",
    documents: "Your documents",
  };
  Object.keys(window.PortalSections.titles).forEach(function (k) {
    SUBTITLES[k] = window.PortalSections.titles[k];
  });
  var ORDER = [
    "applicant-detail", "documents", "income", "assets-and-savings", "financial-commitments",
    "mortgage-needs", "mortgage-declarations", "application-status",
  ];

  window.PortalSections.mount(document.querySelector(".application-grid"));
  var sectionEls = document.querySelectorAll(".application-grid > [data-section]");
  var subtitle = document.getElementById("section-subtitle");

  function showSection(name) {
    if (!SUBTITLES[name]) name = "applicant-detail";
    sectionEls.forEach(function (el) {
      el.hidden = el.getAttribute("data-section") !== name;
    });
    document.querySelectorAll(".step").forEach(function (step) {
      var active = step.getAttribute("data-section") === name;
      step.classList.toggle("is-active", active);
      if (active) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
    subtitle.textContent = SUBTITLES[name];
    centerActiveStep();
    // Outside step 1 the sidebar shows step 1 as completed up to its last part.
    renderRings(name === "applicant-detail" ? currentPart() : detailsDone ? parts.length + 1 : parts.length);
    if (name === "applicant-detail" && detailsDone && !card.classList.contains("is-summary")) showDetailsSummary();
    if (name === "documents") window.PortalDocs.show(1);
    window.PortalSections.onShow(name);
  }

  // In the horizontal stepper, keep the current step in view.
  var stepsStrip = document.querySelector(".steps");
  var stepperReady = false;
  function centerActiveStep() {
    var active = stepsStrip.querySelector(".step.is-active");
    if (!active || stepsStrip.scrollWidth <= stepsStrip.clientWidth) return;
    var item = active.parentElement;
    stepsStrip.scrollTo({
      left: item.offsetLeft - (stepsStrip.clientWidth - item.offsetWidth) / 2,
      behavior: stepperReady ? "smooth" : "auto",
    });
    stepperReady = true;
  }

  function currentPart() {
    if (card.classList.contains("is-summary")) return parts.length + 1;
    for (var i = 0; i < parts.length; i++) if (!parts[i].hidden) return i + 1;
    return 1;
  }

  function goToSection(name) {
    history.pushState({ section: name }, "", "?section=" + name);
    showSection(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.goToSection = goToSection;

  window.goToNextSection = function (current) {
    var i = ORDER.indexOf(current);
    for (var j = i + 1; j < ORDER.length; j++) {
      var step = document.querySelector('.step[data-section="' + ORDER[j] + '"]');
      if (step && !step.closest("[hidden]")) return goToSection(ORDER[j]);
    }
  };

  window.refreshRings = function () {
    var active = document.querySelector(".step.is-active");
    var name = active ? active.getAttribute("data-section") : "applicant-detail";
    renderRings(name === "applicant-detail" ? currentPart() : detailsDone ? parts.length + 1 : parts.length);
  };

  document.querySelectorAll(".step[data-section]").forEach(function (step) {
    step.addEventListener("click", function (e) {
      var name = step.getAttribute("data-section");
      if (!SUBTITLES[name]) {
        e.preventDefault(); // section not built yet
        return;
      }
      e.preventDefault();
      goToSection(name);
    });
  });

  window.addEventListener("popstate", function () {
    showSection(new URLSearchParams(location.search).get("section"));
  });

  showSection(new URLSearchParams(location.search).get("section"));
})();
