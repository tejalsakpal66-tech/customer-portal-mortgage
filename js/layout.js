/* ==========================================================================
   Shared layout: renders the header and floating chat button on every page.
   Each page sets <body data-page="dashboard|application|..."> to mark the
   active nav item and includes <div id="site-header"></div>.
   ========================================================================== */

(function () {
  // Brand (name, logo, colours) comes from js/brand.js, loaded in each page's <head>.
  var BRAND = window.PortalBrand || { name: "Figor", legalName: "Figor", logo: "assets/brand/figor-logo.svg", slug: "figor" };

  var NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", href: "index.html" },
    { id: "application", label: "Application", href: "application.html" },
    { id: "documents", label: "Documents", href: "documents.html" },
    { id: "appointments", label: "Appointments", href: "appointments.html" },
    { id: "messages", label: "Messages", href: "messages.html" },
  ];

  // ---- Profile (shared so the header shows the saved name) -------------------
  window.PortalProfile = (function () {
    var KEY = "portal.profile";
    var DEFAULTS = {
      firstName: "Tejal",
      lastName: "Sakpal",
      email: "tejal.sakpal@example.com",
      country: "Ireland",
      photo: null,      // data URL, downscaled for the avatar
      signature: null,  // data URL (PNG) drawn on the signature pad
      prefs: { email: true, sms: false, documents: true, appointments: true, messages: true },
      // Marketing consent: choice is null until ticked/unticked, then true/false with the date.
      marketing: { choice: null, date: null },
      contactMethods: [], // any of "email", "phone", "post"
      passwordChanged: "2026-08-12",
      deletionRequested: null,
    };

    function get() {
      var saved = {};
      try { saved = JSON.parse(window.localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
      var out = {};
      Object.keys(DEFAULTS).forEach(function (k) { out[k] = saved[k] !== undefined ? saved[k] : DEFAULTS[k]; });
      out.prefs = Object.assign({}, DEFAULTS.prefs, saved.prefs || {});
      return out;
    }

    // Returns false when the browser refused to store it (e.g. storage full).
    function save(data) {
      var ok = true;
      try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { ok = false; }
      document.dispatchEvent(new CustomEvent("profile:change"));
      return ok;
    }

    function initials(p) {
      p = p || get();
      return ((p.firstName || "").charAt(0) + (p.lastName || "").charAt(0)).toUpperCase() || "?";
    }

    return { get: get, save: save, initials: initials };
  })();

  // ---- Notifications (sample feed until connected to the portal) --------------
  window.PortalNotifications = (function () {
    var KEY = "portal.notifications";

    function ago(days, hour, minute) {
      var d = new Date();
      d.setDate(d.getDate() - days);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    }

    function hoursAgo(h) {
      return new Date(Date.now() - h * 3600 * 1000).toISOString();
    }

    function sample() {
      // Mention the real upcoming booking when there is one.
      var call = new Date();
      call.setDate(call.getDate() + 3);
      call.setHours(10, 0, 0, 0);
      try {
        var booked = (JSON.parse(window.localStorage.getItem("portal.appointments")) || [])
          .filter(function (a) { return new Date(a.date) > new Date(); })
          .sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
        if (booked) call = new Date(booked.date);
      } catch (e) { /* keep the default */ }
      var callText = call.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" }) + " at " + call.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
      return [
        { id: "n-docs", type: "action", title: "2 documents still needed", body: "Upload your Employment Detail Summary and Irish Residence Permit to keep your application moving.", href: "application.html?section=documents", date: hoursAgo(2), read: false },
        { id: "n-message", type: "message", title: "New message from Tejal Sakpal", body: "You can add them under Your documents → Personal Current Account(s) Statements.", href: "messages.html", date: ago(1, 11, 41), read: false },
        { id: "n-call", type: "appointment", title: "Your call is coming up", body: "Call with Tejal Sakpal on " + callText + ".", href: "appointments.html", date: ago(1, 9, 0), read: false },
        { id: "n-photo-id", type: "document", title: "Photo ID accepted", body: "Your specialist has checked Passport_Tejal_Sakpal.pdf.", href: "documents.html", date: ago(2, 16, 20), read: true },
        { id: "n-aip", type: "document", title: "New file from your specialist", body: "Approval in Principle is ready to view in Client documents.", href: "documents.html", date: ago(4, 15, 20), read: true },
        { id: "n-progress", type: "application", title: "Application details almost done", body: "You're 94% of the way through your application details.", href: "application.html?section=applicant-detail", date: ago(5, 18, 2), read: true },
        { id: "n-welcome", type: "welcome", title: "Welcome to " + BRAND.name, body: "Your mortgage specialist, Tejal Sakpal, will guide you through your application.", href: "index.html", date: ago(6, 9, 5), read: true },
      ];
    }

    function all() {
      try {
        var raw = window.localStorage.getItem(KEY);
        return raw === null ? sample() : JSON.parse(raw) || [];
      } catch (e) {
        return sample();
      }
    }

    function save(list) {
      try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* not persisted */ }
      document.dispatchEvent(new CustomEvent("notifications:change"));
    }

    function unreadCount() {
      return all().filter(function (n) { return !n.read; }).length;
    }

    function setRead(id, read) {
      var list = all();
      list.forEach(function (n) { if (n.id === id) n.read = read; });
      save(list);
    }

    function markAllRead() {
      var list = all();
      list.forEach(function (n) { n.read = true; });
      save(list);
    }

    return { all: all, unreadCount: unreadCount, setRead: setRead, markAllRead: markAllRead };
  })();

  // ---- Appointments (shared so the booking pop-up works on every page) ----------
  window.PortalAppointments = (function () {
    var KEY = "portal.appointments";

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

    function add(specialist, iso) {
      var list = load();
      var nextId = list.reduce(function (max, a) { return Math.max(max, parseInt(String(a.id).replace(/\D/g, ""), 10) || 0); }, 1000) + 1;
      list.push({ id: "APT-" + nextId, specialist: specialist, date: iso, recordings: 0 });
      store(list);
      return "APT-" + nextId;
    }

    return { load: load, store: store, add: add };
  })();

  var profile = window.PortalProfile.get();

  var ICONS = {
    bell:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    menu:
      '<svg class="icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
      '<svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18"/></svg>',
    chat:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    user:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    consent:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6"/></svg>',
    data:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v6.5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V5.5"/><path d="M4.5 12v6.5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V12"/></svg>',
    lock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    logout:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4M5 12h10"/></svg>',
  };

  var activePage = document.body.getAttribute("data-page");

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Photo when one has been uploaded, otherwise initials.
  function avatarInner(p) {
    return p.photo && /^data:image\//.test(p.photo)
      ? '<img src="' + esc(p.photo) + '" alt="">'
      : esc(window.PortalProfile.initials(p));
  }

  var navLinks = NAV_ITEMS.map(function (item) {
    var active = item.id === activePage;
    return (
      '<a class="main-nav__link' + (active ? " is-active" : "") + '" href="' + item.href + '"' +
      (active ? ' aria-current="page"' : "") + ">" + item.label + "</a>"
    );
  }).join("");

  var headerHTML =
    '<header class="site-header">' +
    '<div class="site-header__inner">' +
    '<a class="site-header__logo" href="index.html"><img src="' + esc(BRAND.logo) + '" alt="' + esc(BRAND.name) + ' – home"></a>' +
    '<nav class="main-nav" id="main-nav" aria-label="Main">' + navLinks + "</nav>" +
    '<div class="site-header__actions">' +
    '<button class="icon-btn notif-btn" type="button" aria-haspopup="dialog" aria-controls="notif-drawer" aria-expanded="false" data-notif-toggle>' + ICONS.bell +
      '<span class="notif-badge" data-notif-badge hidden></span><span class="sr-only" data-notif-label>Notifications</span></button>' +
    '<div class="account">' +
      '<button class="user-avatar" type="button" aria-label="Account menu" aria-haspopup="true" aria-expanded="false" aria-controls="account-menu" data-account-toggle>' +
        '<span class="avatar-fill" data-profile-avatar>' + avatarInner(profile) + "</span></button>" +
      '<div class="account-menu" id="account-menu" hidden>' +
        '<div class="account-menu__head">' +
          '<span class="account-menu__avatar avatar-fill" data-profile-avatar>' + avatarInner(profile) + "</span>" +
          '<div class="account-menu__who"><p class="account-menu__name" data-profile-name>' + esc(profile.firstName + " " + profile.lastName) + "</p>" +
          '<p class="account-menu__email" data-profile-email>' + esc(profile.email) + "</p></div>" +
        "</div>" +
        '<a class="account-menu__item" href="profile.html">' + ICONS.user + "Account details</a>" +
        '<a class="account-menu__item" href="consents.html">' + ICONS.consent + "My consents</a>" +
        '<a class="account-menu__item" href="your-data.html">' + ICONS.data + "Your data</a>" +
        '<a class="account-menu__item" href="password.html">' + ICONS.lock + "Change password</a>" +
        '<span class="account-menu__divider" aria-hidden="true"></span>' +
        '<a class="account-menu__item account-menu__item--logout" href="logout.html">' + ICONS.logout + "Log out</a>" +
      "</div>" +
    "</div>" +
    '<button class="icon-btn menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="main-nav">' +
    ICONS.menu + "</button>" +
    "</div>" +
    "</div>" +
    "</header>";

  var mount = document.getElementById("site-header");
  if (mount) {
    mount.outerHTML = headerHTML;
  } else {
    document.body.insertAdjacentHTML("afterbegin", headerHTML);
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    '<button class="chat-fab" type="button" aria-label="Open AI Assistant" aria-expanded="false" aria-controls="ai-assistant">' + ICONS.chat + "</button>"
  );

  // Mobile menu toggle
  var header = document.querySelector(".site-header");
  var toggle = header.querySelector(".menu-toggle");

  function setOpen(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("is-open"));
  });

  document.addEventListener("click", function (e) {
    if (!header.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) {
    if (mq.matches) setOpen(false);
  });

  // ---- Notification badge ---------------------------------------------------------
  function renderBadge() {
    var n = window.PortalNotifications.unreadCount();
    var badge = header.querySelector("[data-notif-badge]");
    badge.hidden = !n;
    badge.textContent = n > 9 ? "9+" : n;
    header.querySelector("[data-notif-label]").textContent = n ? "Notifications, " + n + " unread" : "Notifications";
  }
  renderBadge();
  document.addEventListener("notifications:change", renderBadge);

  // ---- Notifications drawer (slides in from the right) -------------------------------
  var NOTIF_ICONS = {
    action: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14l3-3 3 3"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/>',
    appointment: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    document: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14.5l2 2 4-4.5"/>',
    application: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    welcome: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  };

  document.body.insertAdjacentHTML("beforeend",
    '<div class="notif-drawer__overlay" data-notif-close hidden></div>' +
    '<aside class="notif-drawer" id="notif-drawer" role="dialog" aria-modal="true" aria-labelledby="notif-drawer-title" hidden>' +
      '<header class="notif-drawer__head">' +
        '<h2 class="notif-drawer__title" id="notif-drawer-title">Notifications</h2>' +
        '<button class="notif-drawer__mark" type="button" data-notif-markall>Mark all as read</button>' +
        '<button class="notif-drawer__close" type="button" aria-label="Close notifications" data-notif-close>' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      "</header>" +
      '<div class="notif-drawer__tabs" role="group" aria-label="Show notifications">' +
        '<button class="notif-drawer__tab is-active" type="button" data-notif-filter="all" aria-pressed="true">All</button>' +
        '<button class="notif-drawer__tab" type="button" data-notif-filter="unread" aria-pressed="false">Unread <span class="notif-drawer__count" data-notif-unread></span></button>' +
      "</div>" +
      '<div class="notif-drawer__list" data-notif-list></div>' +
      '<footer class="notif-drawer__foot"><a href="notification-settings.html">Notification settings</a></footer>' +
    "</aside>");

  var drawer = document.getElementById("notif-drawer");
  var overlay = document.querySelector(".notif-drawer__overlay");
  var bell = header.querySelector("[data-notif-toggle]");

  function dayDiff(iso) {
    var a = new Date(); a.setHours(0, 0, 0, 0);
    var b = new Date(iso); b.setHours(0, 0, 0, 0);
    return Math.round((a - b) / 86400000);
  }

  function groupLabel(iso) {
    var n = dayDiff(iso);
    return n <= 0 ? "Today" : n === 1 ? "Yesterday" : n < 7 ? "Earlier this week" : "Older";
  }

  function whenLabel(iso) {
    var d = new Date(iso), n = dayDiff(iso);
    var clock = d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
    if (n <= 0) {
      var mins = Math.max(1, Math.round((Date.now() - d) / 60000));
      return mins < 60 ? mins + " min ago" : Math.round(mins / 60) + "h ago";
    }
    if (n === 1) return clock;
    if (n < 7) return d.toLocaleDateString("en-IE", { weekday: "short" }) + ", " + clock;
    return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
  }

  // Renders the list into a scope: the drawer, or the Notifications page on phones.
  function renderNotifs(scope) {
    var filter = scope.getAttribute("data-filter") || "all";
    var all = window.PortalNotifications.all().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var unread = all.filter(function (n) { return !n.read; }).length;
    var countEl = scope.querySelector("[data-notif-unread]");
    countEl.textContent = unread;
    countEl.hidden = !unread;
    scope.querySelector("[data-notif-markall]").disabled = !unread;
    var items = filter === "unread" ? all.filter(function (n) { return !n.read; }) : all;
    var listEl = scope.querySelector("[data-notif-list]");
    if (!items.length) {
      listEl.innerHTML = '<div class="notif-drawer__empty"><p class="notif-drawer__empty-title">' +
        (filter === "unread" ? "You're all caught up" : "No notifications yet") + "</p><p>" +
        "Updates on your application, documents and appointments will appear here.</p></div>";
      return;
    }
    var html = "", current = null;
    items.forEach(function (n) {
      var g = groupLabel(n.date);
      if (g !== current) {
        if (current) html += "</ul>";
        html += '<p class="notif-drawer__group">' + g + '</p><ul class="notif-drawer__items">';
        current = g;
      }
      html +=
        '<li class="notif-item' + (n.read ? "" : " is-unread") + '">' +
          '<a class="notif-item__link" href="' + esc(n.href) + '" data-notif-open="' + esc(n.id) + '">' +
            '<span class="notif-item__icon notif-item__icon--' + esc(n.type) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (NOTIF_ICONS[n.type] || NOTIF_ICONS.welcome) + "</svg></span>" +
            '<span class="notif-item__main">' +
              '<span class="notif-item__title">' + (n.read ? "" : '<span class="sr-only">Unread: </span>') + esc(n.title) + "</span>" +
              '<span class="notif-item__body">' + esc(n.body) + "</span>" +
              '<span class="notif-item__time">' + whenLabel(n.date) + "</span>" +
            "</span>" +
          "</a>" +
          '<button class="notif-item__toggle" type="button" data-notif-toggle-read="' + esc(n.id) + '" aria-label="' + (n.read ? "Mark as unread: " : "Mark as read: ") + esc(n.title) + '" title="' + (n.read ? "Mark as unread" : "Mark as read") + '"><span aria-hidden="true"></span></button>' +
        "</li>";
    });
    listEl.innerHTML = html + "</ul>";
  }

  function renderDrawer() { renderNotifs(drawer); }
  var notifPage = document.querySelector("[data-notif-page]");
  if (notifPage) renderNotifs(notifPage);

  // Back arrow: return to the page the bell was tapped on; the dashboard if
  // the page was opened directly.
  var notifBack = document.querySelector("[data-notif-back]");
  if (notifBack) {
    notifBack.addEventListener("click", function (e) {
      var ref = document.referrer;
      if (ref && ref.indexOf(window.location.origin) === 0 && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  }

  // Phones get the full Notifications page; larger screens the side drawer.
  var phone = window.matchMedia("(max-width: 600px)");

  function setDrawer(open) {
    drawer.hidden = !open;
    overlay.hidden = !open;
    bell.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("has-notif-drawer", open);
    if (open) {
      setAccountOpen(false);
      setOpen(false);
      renderDrawer();
      drawer.querySelector(".notif-drawer__close").focus();
    } else {
      bell.focus();
    }
  }

  bell.addEventListener("click", function (e) {
    e.stopPropagation();
    if (phone.matches) {
      if (!notifPage) window.location.href = "notifications.html";
      return;
    }
    setDrawer(drawer.hidden);
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-notif-close]")) { setDrawer(false); return; }
    var scope = e.target.closest("#notif-drawer, [data-notif-page]");
    if (!scope) return;
    var tab = e.target.closest("[data-notif-filter]");
    if (tab) {
      scope.setAttribute("data-filter", tab.getAttribute("data-notif-filter"));
      scope.querySelectorAll("[data-notif-filter]").forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-pressed", String(t === tab));
      });
      renderNotifs(scope);
      return;
    }
    if (e.target.closest("[data-notif-markall]")) { window.PortalNotifications.markAllRead(); return; }
    var toggleRead = e.target.closest("[data-notif-toggle-read]");
    if (toggleRead) {
      var tid = toggleRead.getAttribute("data-notif-toggle-read");
      var item = window.PortalNotifications.all().filter(function (n) { return n.id === tid; })[0];
      if (item) window.PortalNotifications.setRead(tid, !item.read);
      var again = scope.querySelector('[data-notif-toggle-read="' + tid + '"]');
      if (again) again.focus();
      return;
    }
    var openLink = e.target.closest("[data-notif-open]");
    if (openLink && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      var href = openLink.getAttribute("href");
      window.PortalNotifications.setRead(openLink.getAttribute("data-notif-open"), true);
      window.location.href = href;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (drawer.hidden) return;
    if (e.key === "Escape") { setDrawer(false); return; }
    if (e.key === "Tab") {
      var f = Array.prototype.filter.call(drawer.querySelectorAll("a[href], button:not([disabled])"), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { f[0].focus(); e.preventDefault(); }
    }
  });

  document.addEventListener("notifications:change", function () {
    if (!drawer.hidden) renderDrawer();
    if (notifPage) renderNotifs(notifPage);
  });

  // Links to #notifications open the drawer
  if (window.location.hash === "#notifications") {
    setTimeout(function () { setDrawer(true); }, 0);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  // ---- Account menu ------------------------------------------------------------------
  var accountToggle = header.querySelector("[data-account-toggle]");
  var accountMenu = header.querySelector("#account-menu");

  function setAccountOpen(open, focusFirst) {
    accountMenu.hidden = !open;
    accountToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      setOpen(false);
      if (focusFirst) accountMenu.querySelector(".account-menu__item").focus();
    }
  }

  accountToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    setAccountOpen(accountMenu.hidden, e.detail === 0);
  });

  document.addEventListener("click", function (e) {
    if (!accountMenu.hidden && !accountMenu.contains(e.target)) setAccountOpen(false);
  });

  accountMenu.addEventListener("keydown", function (e) {
    var items = Array.prototype.slice.call(accountMenu.querySelectorAll(".account-menu__item"));
    var i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === "Escape") { setAccountOpen(false); accountToggle.focus(); }
  });

  // Keep the header in step with profile edits
  document.addEventListener("profile:change", function () {
    var p = window.PortalProfile.get();
    header.querySelectorAll("[data-profile-avatar]").forEach(function (el) { el.innerHTML = avatarInner(p); });
    header.querySelector("[data-profile-name]").textContent = p.firstName + " " + p.lastName;
    header.querySelector("[data-profile-email]").textContent = p.email;
  });

  // ---- Book an appointment (pop-up, opened from any booking link) ------------------
  var CAL_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/></svg>';

  document.body.insertAdjacentHTML("beforeend",
    '<div class="book-modal" id="book-modal" role="dialog" aria-modal="true" aria-labelledby="book-modal-title" hidden>' +
      '<div class="book-modal__backdrop" data-book-close></div>' +
      '<form class="book-modal__panel" novalidate>' +
        '<header class="book-modal__head">' +
          '<div><h2 class="book-modal__title" id="book-modal-title">Book an appointment</h2>' +
          '<p class="book-modal__lede">Choose a time to talk through your mortgage with your specialist.</p></div>' +
          '<button class="book-modal__close" type="button" aria-label="Close" data-book-close>' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        "</header>" +
        '<div class="book-modal__body">' +
          '<div class="book-field"><label for="book-specialist">Mortgage specialist</label>' +
            '<div class="book-select"><select id="book-specialist" name="specialist"><option selected>Tejal Sakpal</option></select></div></div>' +
          '<div class="book-field"><label for="book-date">Date</label>' +
            '<div class="book-select"><select id="book-date" name="date" required><option value="" selected disabled>Select a date</option></select></div>' +
            '<p class="book-chosen" data-book-chosen aria-live="polite" hidden>' + CAL_ICON + "<span></span></p></div>" +
        "</div>" +
        '<footer class="book-modal__foot">' +
          '<button class="btn btn--text book-modal__cancel" type="button" data-book-close>Cancel</button>' +
          '<button class="btn btn--primary book-modal__submit" type="submit" disabled>Book appointment</button>' +
        "</footer>" +
      "</form>" +
    "</div>");

  var bookModal = document.getElementById("book-modal");
  var bookForm = bookModal.querySelector("form");
  var bookDate = bookModal.querySelector("#book-date");
  var bookSubmit = bookModal.querySelector(".book-modal__submit");
  var bookChosen = bookModal.querySelector("[data-book-chosen]");
  var bookOpener = null;

  function fillSlots() {
    // Sample availability: the next 10 weekdays, morning and afternoon, grouped by day.
    // Replace with the specialist's real calendar once connected.
    while (bookDate.options.length > 1) bookDate.remove(1);
    bookDate.querySelectorAll("optgroup").forEach(function (g) { g.remove(); });
    var day = new Date();
    day.setHours(0, 0, 0, 0);
    var added = 0;
    while (added < 10) {
      day.setDate(day.getDate() + 1);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      var group = document.createElement("optgroup");
      group.label = day.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });
      [10, 14].forEach(function (h) {
        var slot = new Date(day);
        slot.setHours(h, 0, 0, 0);
        var opt = document.createElement("option");
        opt.value = slot.toISOString();
        opt.textContent = slot.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" }) + ", " +
          slot.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) + (h < 12 ? " · Morning" : " · Afternoon");
        group.appendChild(opt);
      });
      bookDate.appendChild(group);
      added += 1;
    }
  }

  function setBook(open) {
    bookModal.hidden = !open;
    document.body.classList.toggle("has-book-modal", open);
    if (open) {
      setAccountOpen(false);
      setOpen(false);
      fillSlots();
      bookDate.value = "";
      bookSubmit.disabled = true;
      bookChosen.hidden = true;
      bookDate.focus();
    } else if (bookOpener) {
      bookOpener.focus();
    }
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href$="appointment-new.html"]');
    if (link && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      bookOpener = link;
      setBook(true);
      return;
    }
    if (!bookModal.hidden && e.target.closest("[data-book-close]")) setBook(false);
  });

  bookDate.addEventListener("change", function () {
    bookSubmit.disabled = !bookDate.value;
    if (!bookDate.value) return;
    var d = new Date(bookDate.value);
    bookChosen.querySelector("span").textContent =
      d.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" }) + " at " +
      d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) + (d.getHours() < 12 ? " · Morning" : " · Afternoon");
    bookChosen.hidden = false;
  });

  bookForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!bookDate.value) return;
    window.PortalAppointments.add(bookModal.querySelector("#book-specialist").value, bookDate.value);
    window.location.href = "appointments.html";
  });

  document.addEventListener("keydown", function (e) {
    if (bookModal.hidden) return;
    if (e.key === "Escape") { setBook(false); return; }
    if (e.key === "Tab") {
      var f = Array.prototype.filter.call(bookModal.querySelectorAll("button:not([disabled]), select"), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { f[0].focus(); e.preventDefault(); }
    }
  });

  // appointments.html#book (and the old booking page) open the pop-up
  if (window.location.hash === "#book") {
    setTimeout(function () { setBook(true); }, 0);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
})();

/* ==========================================================================
   AI Assistant panel (opened from the chat button or a document's
   "Need help?"). Design mirrors the live portal. Replies are placeholders
   until the panel is connected to the real assistant service.
   ========================================================================== */

window.PortalAssistant = (function () {
  var SVG = {
    robot:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3v3"/><circle cx="12" cy="2.6" r="0.9" fill="currentColor" stroke="none"/>' +
      '<rect x="4" y="7" width="16" height="12" rx="4"/><path d="M2 12v3M22 12v3"/>' +
      '<path d="M8.5 12.5c.5-.8 1.5-.8 2 0M13.5 12.5c.5-.8 1.5-.8 2 0"/><path d="M9.5 15.5c1.4 1 3.6 1 5 0"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    help:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5"/><circle cx="12" cy="17.6" r="0.6" fill="currentColor"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
    doc:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  };

  var DEFAULT_ACTIONS = ["What is needed?", "Already uploaded", "Upload problem", "Looks incorrect", "Ask advisor"];
  var BANK_ACTIONS = ["What is needed?", "Already uploaded", "Account closed", "No transactions", "Ask advisor"];

  var REPLIES = {
    "Already uploaded": "Thanks for letting us know. I've flagged this for your advisor to check – uploads can take a little while to be processed.",
    "Upload problem": "Sorry about that. Please make sure the file is an original or scanned PDF, isn't password protected, and shows all 4 corners of each page. If it still won't upload, tap “Ask advisor”.",
    "Looks incorrect": "Thanks – I've noted that something looks incorrect. Your advisor will review it and get back to you.",
    "Account closed": "Thanks. I've noted that this account is closed. Please still upload the statements from the last 6 months, including the closing statement.",
    "No transactions": "Thanks. I've noted that there were no transactions on this account. Your advisor may still ask for a statement showing the balance.",
    "Ask advisor": "I've passed this to your mortgage specialist, Tejal Sakpal. You'll get a reply in Messages.",
  };

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var root = document.createElement("section");
  root.className = "assistant";
  root.id = "ai-assistant";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-labelledby", "assistant-title");
  root.hidden = true;
  var firstName = window.PortalProfile ? window.PortalProfile.get().firstName : "";
  root.innerHTML =
    '<header class="assistant__header">' +
      '<span class="assistant__avatar">' + SVG.robot + "</span>" +
      '<div class="assistant__heading">' +
        '<h2 class="assistant__title" id="assistant-title">AI Assistant</h2>' +
        '<p class="assistant__subtitle">Help with your documents and uploads</p>' +
      "</div>" +
      '<button class="assistant__close" type="button" aria-label="Close AI Assistant">' + SVG.close + "</button>" +
    "</header>" +
    '<p class="assistant__context" data-context hidden>' + SVG.doc + '<span>Asking about <strong data-context-name></strong></span></p>' +
    '<div class="assistant__body" aria-live="polite">' +
      '<div class="assistant__intro">' +
        '<div class="assistant__row assistant__row--bot">' +
          '<span class="assistant__bot" aria-hidden="true">' + SVG.robot + "</span>" +
          '<p class="assistant__msg assistant__msg--bot">' +
            (firstName ? "Hi " + esc(firstName) + ". " : "Hi. ") +
            "I can explain what a document needs, help if an upload isn't working, or pass a question to your specialist." +
          "</p>" +
        "</div>" +
        '<p class="assistant__actions-label">Suggested</p>' +
        '<div class="assistant__suggestions" data-chips></div>' +
      "</div>" +
      '<ol class="assistant__messages"></ol>' +
    "</div>" +
    '<div class="assistant__chips assistant__chips--dock" data-chips hidden></div>' +
    '<form class="assistant__composer">' +
      '<div class="assistant__box">' +
        '<label class="sr-only" for="assistant-input">Type your question</label>' +
        '<textarea id="assistant-input" rows="1" placeholder="Ask a question…"></textarea>' +
        '<button class="assistant__send" type="submit" aria-label="Send" disabled>' + SVG.send + "</button>" +
      "</div>" +
      '<p class="assistant__note">Answers are guidance. Your specialist confirms anything important.</p>' +
    "</form>";
  document.body.appendChild(root);

  var fab = document.querySelector(".chat-fab");
  var intro = root.querySelector(".assistant__intro");
  var list = root.querySelector(".assistant__messages");
  var body = root.querySelector(".assistant__body");
  var dock = root.querySelector(".assistant__chips--dock");
  var input = root.querySelector("textarea");
  var sendBtn = root.querySelector(".assistant__send");
  var contextBar = root.querySelector("[data-context]");
  var context = null;

  function renderChips() {
    var actions = context && /Current Account/.test(context.name) ? BANK_ACTIONS : DEFAULT_ACTIONS;
    var html = actions.map(function (a) {
      return '<button class="assistant__chip" type="button" data-chip="' + esc(a) + '"><span>' + esc(a) + "</span>" + SVG.arrow + "</button>";
    }).join("");
    root.querySelectorAll("[data-chips]").forEach(function (el) { el.innerHTML = html; });
  }

  function whatIsNeeded() {
    if (context && context.instruction) {
      var tmp = document.createElement("div");
      tmp.innerHTML = context.instruction;
      return "For “" + context.name + "”: " + tmp.textContent;
    }
    var docs = window.PortalDocs && window.PortalDocs.outstanding ? window.PortalDocs.outstanding() : [];
    return docs.length
      ? "These documents are still needed: " + docs.map(function (d) { return d.name; }).join(", ") + ". You can upload them in “Your documents”."
      : "You can see everything that's still needed on the Application status page.";
  }

  function addMessage(text, from) {
    intro.hidden = true;
    dock.hidden = false;
    list.insertAdjacentHTML("beforeend",
      '<li class="assistant__row assistant__row--' + from + '">' +
        (from === "bot" ? '<span class="assistant__bot" aria-hidden="true">' + SVG.robot + "</span>" : "") +
        '<p class="assistant__msg assistant__msg--' + from + '">' + esc(text) + "</p>" +
      "</li>");
    body.scrollTop = body.scrollHeight;
  }

  function reply(question) {
    var typing = document.createElement("li");
    typing.className = "assistant__row assistant__row--bot";
    typing.setAttribute("aria-label", "Assistant is typing");
    typing.innerHTML = '<span class="assistant__bot" aria-hidden="true">' + SVG.robot + "</span>" +
      '<span class="assistant__msg assistant__msg--bot assistant__typing"><span></span><span></span><span></span></span>';
    list.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    setTimeout(function () {
      typing.remove();
      var answer = question === "What is needed?" ? whatIsNeeded()
        : REPLIES[question] || "Thanks for your question. I've shared it with your advisor, who will reply in Messages.";
      addMessage(answer, "bot");
    }, 700);
  }

  function ask(text) {
    text = text.trim();
    if (!text) return;
    addMessage(text, "user");
    reply(text);
  }

  function open(ctx) {
    var changed = (ctx && ctx.name) !== (context && context.name);
    context = ctx || null;
    if (changed) {
      list.innerHTML = "";
      intro.hidden = false;
      dock.hidden = true;
    }
    renderChips();
    contextBar.hidden = !(context && context.name);
    if (context && context.name) root.querySelector("[data-context-name]").textContent = context.name;
    root.hidden = false;
    fab.hidden = true;
    fab.setAttribute("aria-expanded", "true");
    input.focus();
  }

  function close() {
    root.hidden = true;
    fab.hidden = false;
    fab.setAttribute("aria-expanded", "false");
    fab.focus();
  }

  fab.addEventListener("click", function () { open(context); });
  root.querySelector(".assistant__close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !root.hidden) close();
  });

  root.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-chip]");
    if (chip) ask(chip.getAttribute("data-chip"));
  });

  input.addEventListener("input", function () {
    sendBtn.disabled = !input.value.trim();
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      root.querySelector("form").requestSubmit();
    }
  });

  root.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
    input.value = "";
    input.style.height = "";
    sendBtn.disabled = true;
  });

  return { open: open, close: close };
})();
