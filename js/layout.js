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
    '<a class="icon-btn notif-btn' + (activePage === "notifications" ? " is-active" : "") + '" href="notifications.html"' +
      (activePage === "notifications" ? ' aria-current="page"' : "") + ">" + ICONS.bell +
      '<span class="notif-badge" data-notif-badge hidden></span><span class="sr-only" data-notif-label>Notifications</span></a>' +
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
