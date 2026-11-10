/* Appointments: list (filters, search, sort, paging) and booking form.
   Booked appointments are kept in this browser until the page is connected
   to the scheduling service. */

(function () {
  var KEY = "portal.appointments";
  var PAGE_SIZE = 10;

  function at(days, hour) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  // Sample bookings shown until the applicant books or cancels one.
  function sample() {
    return [
      { id: "APT-1002", specialist: "Tejal Sakpal", date: at(3, 10), recordings: 0 },
      { id: "APT-1001", specialist: "Tejal Sakpal", date: at(-12, 14), recordings: 1 },
    ];
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw === null ? sample() : JSON.parse(raw) || [];
    } catch (e) {
      return sample();
    }
  }

  function store(list) {
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* not persisted */ }
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatSlot(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + ", " +
      d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  }

  // ---- List page ------------------------------------------------------------
  var rowsEl = document.querySelector("[data-rows]");
  if (rowsEl) {
    var filter = "all";
    var query = "";
    var sortKey = "date";
    var sortDir = 1;
    var page = 1;
    var label = document.querySelector("[data-page-label]");
    var prev = document.querySelector('[data-page="prev"]');
    var next = document.querySelector('[data-page="next"]');

    var emptyHtml = function () {
      if (query) return '<div class="appts-empty"><p class="appts-empty__title">No appointments match “' + esc(query) + '”</p><p>Try a different name, date or ID.</p></div>';
      var title = filter === "future" ? "No upcoming appointments" : filter === "past" ? "No past appointments" : "No appointments yet";
      return '<div class="appts-empty">' +
        '<span class="appts-empty__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></span>' +
        '<p class="appts-empty__title">' + title + "</p>" +
        "<p>Book a call with Tejal Sakpal to talk through your mortgage options.</p>" +
        '<a class="btn btn--outline" href="appointment-new.html">Book an Appointment</a></div>';
    };

    var nextEl = document.querySelector("[data-next]");
    var renderNext = function () {
      var upcoming = load()
        .filter(function (a) { return new Date(a.date).getTime() >= Date.now(); })
        .sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
      nextEl.hidden = !upcoming;
      if (!upcoming) return;
      var d = new Date(upcoming.date);
      nextEl.innerHTML =
        '<span class="appt-next__date"><span class="appt-next__month">' + d.toLocaleDateString("en-IE", { month: "short" }) + "</span>" +
        '<span class="appt-next__day">' + d.getDate() + "</span></span>" +
        '<div class="appt-next__body"><p class="appt-next__label">Next appointment</p>' +
        '<p class="appt-next__title">Call with ' + esc(upcoming.specialist) + "</p>" +
        '<p class="appt-next__meta">' + esc(formatSlot(upcoming.date)) + " · " + esc(upcoming.id) + "</p></div>" +
        '<button class="appt-next__cancel" type="button" data-cancel="' + esc(upcoming.id) + '">Cancel</button>';
    };

    nextEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cancel]");
      if (!btn) return;
      var id = btn.getAttribute("data-cancel");
      if (!window.confirm("Cancel appointment " + id + "?")) return;
      store(load().filter(function (a) { return a.id !== id; }));
      render();
    });

    var render = function () {
      var now = Date.now();
      var list = load().filter(function (a) {
        var t = new Date(a.date).getTime();
        if (filter === "future" && t < now) return false;
        if (filter === "past" && t >= now) return false;
        if (query) {
          var hay = (a.id + " " + a.specialist + " " + formatSlot(a.date)).toLowerCase();
          if (hay.indexOf(query) === -1) return false;
        }
        return true;
      });

      list.sort(function (a, b) {
        var x = sortKey === "date" ? a.date : sortKey === "recordings" ? (a.recordings || 0) : a.specialist;
        var y = sortKey === "date" ? b.date : sortKey === "recordings" ? (b.recordings || 0) : b.specialist;
        return (x > y ? 1 : x < y ? -1 : 0) * sortDir;
      });

      var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      page = Math.min(page, pages);
      var slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      renderNext();
      document.querySelector(".appts-table thead").hidden = !slice.length;
      document.querySelector(".appts-pager").hidden = pages <= 1;

      rowsEl.innerHTML = slice.length
        ? slice.map(function (a) {
            var past = new Date(a.date).getTime() < now;
            return (
              "<tr>" +
                '<td class="col-id" data-label="App. ID"><span class="cell">' + esc(a.id) + "</span></td>" +
                '<td class="col-name" data-label="Mortgage specialist"><span class="cell">' + esc(a.specialist) + "</span></td>" +
                '<td class="col-date" data-label="Discussion on"><span class="cell">' + esc(formatSlot(a.date)) +
                  '<span class="appt-status' + (past ? " appt-status--past" : "") + '">' + (past ? "Past" : "Upcoming") + "</span></span></td>" +
                '<td class="col-rec" data-label="Recordings"><span class="cell">' + (a.recordings ? a.recordings : "–") + "</span></td>" +
                '<td class="col-actions" data-label="Actions"><span class="cell">' +
                  (past ? "–" : '<button class="appt-cancel" type="button" data-cancel="' + esc(a.id) + '">Cancel</button>') +
                "</span></td>" +
              "</tr>"
            );
          }).join("")
        : '<tr class="is-empty"><td colspan="5">' + emptyHtml() + "</td></tr>";

      label.textContent = "Page " + page + " of " + pages;
      prev.disabled = page <= 1;
      next.disabled = page >= pages;
    };

    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filter = btn.getAttribute("data-filter");
        page = 1;
        document.querySelectorAll("[data-filter]").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        render();
      });
    });

    document.querySelector("[data-search]").addEventListener("input", function (e) {
      query = e.target.value.trim().toLowerCase();
      page = 1;
      render();
    });

    document.querySelectorAll("[data-sort]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-sort");
        sortDir = key === sortKey ? -sortDir : 1;
        sortKey = key;
        document.querySelectorAll("[data-sort]").forEach(function (b) {
          b.classList.toggle("is-sorted", b === btn);
          b.classList.toggle("is-desc", b === btn && sortDir === -1);
        });
        render();
      });
    });

    prev.addEventListener("click", function () { page -= 1; render(); });
    next.addEventListener("click", function () { page += 1; render(); });

    rowsEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cancel]");
      if (!btn) return;
      var id = btn.getAttribute("data-cancel");
      if (!window.confirm("Cancel appointment " + id + "?")) return;
      store(load().filter(function (a) { return a.id !== id; }));
      render();
    });

    render();
  }

  // ---- Booking page -----------------------------------------------------------
  var form = document.getElementById("appointment-form");
  if (form) {
    var dateSel = document.getElementById("appt-date");
    var save = form.querySelector(".appt-save");

    // Sample availability: the next 10 weekdays, morning and afternoon slots.
    // Replace with the specialist's real calendar once connected.
    var day = new Date();
    day.setHours(0, 0, 0, 0);
    var added = 0;
    while (added < 10) {
      day.setDate(day.getDate() + 1);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      [10, 14].forEach(function (h) {
        var slot = new Date(day);
        slot.setHours(h, 0, 0, 0);
        var opt = document.createElement("option");
        opt.value = slot.toISOString();
        opt.textContent = formatSlot(slot.toISOString());
        dateSel.appendChild(opt);
      });
      added += 1;
    }

    dateSel.addEventListener("change", function () {
      save.disabled = !dateSel.value;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!dateSel.value) return;
      var list = load();
      var nextId = list.reduce(function (max, a) { return Math.max(max, parseInt(String(a.id).replace(/\D/g, ""), 10) || 0); }, 1000) + 1;
      list.push({ id: "APT-" + nextId, specialist: document.getElementById("appt-specialist").value, date: dateSel.value, recordings: 0 });
      store(list);
      window.location.href = "appointments.html";
    });
  }
})();
