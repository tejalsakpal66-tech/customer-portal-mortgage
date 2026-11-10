/* Dashboard: greeting, application status, applicants and the
   upcoming appointment. Progress comes from what the applicant did on the
   Application page (remembered in this browser). */

(function () {
  // ---- Greeting ---------------------------------------------------------------
  var hour = new Date().getHours();
  document.querySelector("[data-greeting]").textContent =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // ---- Applicants -------------------------------------------------------------
  var whoBuying = document.getElementById("who-buying");
  var list = document.getElementById("applicants-list");
  var template = document.getElementById("applicant-avatar");

  function renderApplicants() {
    var count = parseInt(whoBuying.value, 10) || 1;
    list.innerHTML = "";
    for (var i = 0; i < count; i++) {
      list.appendChild(template.content.cloneNode(true));
    }
    list.setAttribute("aria-label", count + (count === 1 ? " applicant" : " applicants"));
  }

  whoBuying.addEventListener("change", renderApplicants);
  renderApplicants();

  // ---- Progress -----------------------------------------------------------------
  // ?state=new / ?state=in-progress force a state for previewing the design.
  var state = new URLSearchParams(window.location.search).get("state");
  var progress = window.AppProgress.get();
  var completed = window.AppProgress.completed();
  if (state === "new") { progress = 0; completed = []; }
  if (state === "in-progress" && !progress) progress = 19;

  // Application sections in order; the first unfinished one is "Next up".
  var STEPS = [
    { key: "applicant-detail", title: "Your application details" },
    { key: "documents", title: "Upload your documents" },
    { key: "assets-and-savings", title: "Your assets and savings" },
    { key: "financial-commitments", title: "Your financial commitments" },
    { key: "mortgage-needs", title: "Your mortgage needs" },
    { key: "mortgage-declarations", title: "Your mortgage declaration" },
  ];

  var nextIndex = -1;
  STEPS.forEach(function (step, i) {
    step.done = completed.indexOf(step.key) !== -1;
    if (!step.done && nextIndex === -1) nextIndex = i;
  });

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---- Upcoming appointment ----------------------------------------------------------
  var appts = [];
  try {
    var rawAppts = window.localStorage.getItem("portal.appointments");
    if (rawAppts === null) {
      // Same sample booking the Appointments page shows on first visit.
      var soon = new Date();
      soon.setDate(soon.getDate() + 3);
      soon.setHours(10, 0, 0, 0);
      appts = [{ id: "APT-1002", specialist: "Tejal Sakpal", date: soon.toISOString(), recordings: 0 }];
    } else {
      appts = JSON.parse(rawAppts) || [];
    }
  } catch (e) { appts = []; }
  var upcoming = appts
    .filter(function (a) { return new Date(a.date).getTime() >= Date.now(); })
    .sort(function (a, b) { return a.date.localeCompare(b.date); })[0];

  var apptBox = document.querySelector("[data-next-appt]");
  if (upcoming) {
    var d = new Date(upcoming.date);
    apptBox.innerHTML =
      '<div class="next-appt">' +
        '<span class="next-appt__date"><span class="next-appt__month">' + d.toLocaleDateString("en-IE", { month: "short" }) + "</span>" +
        '<span class="next-appt__day">' + d.getDate() + "</span></span>" +
        '<span class="next-appt__body"><span class="next-appt__title">Call with ' + esc(upcoming.specialist) + "</span>" +
        '<span class="next-appt__meta">' + d.toLocaleDateString("en-IE", { weekday: "long" }) + ", " +
        d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) + " · " + esc(upcoming.id) + "</span></span>" +
      "</div>";
  } else {
    apptBox.innerHTML =
      '<div class="next-appt next-appt--empty">' +
        '<p>No appointments booked yet. Talk through your options with your mortgage specialist.</p>' +
        '<a class="btn btn--outline next-appt__book" href="appointment-new.html">Book an appointment</a>' +
      "</div>";
  }

  // ---- Action needed banner -------------------------------------------------------------
  // Once an application is under way: required documents with nothing uploaded,
  // and sections that still need answers (same messages as the live portal).
  function listNames(names) {
    return names.length < 2 ? names.join("") : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  if (progress) {
    var missingDocs = window.PortalDocList.outstanding(window.UploadsStore.all());
    var openSections = STEPS.filter(function (s) { return s.key !== "documents" && !s.done; });
    var banner = document.querySelector("[data-action-banner]");
    var docsItem = banner.querySelector('[data-action="documents"]');
    var infoItem = banner.querySelector('[data-action="info"]');

    docsItem.hidden = !missingDocs.length;
    infoItem.hidden = !openSections.length;
    banner.hidden = docsItem.hidden && infoItem.hidden;

    if (missingDocs.length) {
      var docsText = banner.querySelector("[data-action-docs-text]");
      var names = listNames(missingDocs.map(function (d) { return d.name; }));
      docsText.textContent = missingDocs.length + " to upload: " + names;
      docsText.closest(".action-row").setAttribute("title",
        "You have " + missingDocs.length + " required " + (missingDocs.length === 1 ? "document" : "documents") +
        " to upload under the “Your documents” section: " + names + ".");
    }
    if (openSections.length) {
      banner.querySelector("[data-action-info-link]").setAttribute("href", "application.html?section=" + openSections[0].key);
    }
  }

  // ---- Application in progress --------------------------------------------------------
  if (!progress) return;

  var R = 66.4;
  var C = 2 * Math.PI * R;
  var label = progress + "%";
  var next = STEPS[nextIndex] || STEPS[STEPS.length - 1];

  document.querySelector("[data-lede]").textContent = "Here's where your mortgage application stands.";
  document.getElementById("status-card").hidden = false;
  document.querySelector(".application-card").hidden = true;
  document.querySelector("[data-next-step]").textContent = next.title;
  document.querySelector("[data-next-link]").setAttribute("href", "application.html?section=" + next.key);

  document.querySelectorAll("[data-progress-text]").forEach(function (el) {
    el.textContent = label;
  });

  var ring = document.getElementById("status-ring");
  ring.setAttribute("aria-label", label + " complete");
  requestAnimationFrame(function () {
    ring.querySelector(".status-ring__bar").style.strokeDasharray = (C * progress) / 100 + " " + C;
  });
})();
