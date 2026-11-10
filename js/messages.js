/* Messages: conversations with the mortgage specialist.
   Threads are kept in this browser (with sample conversations on first
   visit) until the page is connected to the portal's messaging service. */

(function () {
  var KEY = "portal.messages";
  var BRAND_NAME = (window.PortalBrand && window.PortalBrand.name) || "Figor";
  var ADVISOR = "Tejal Sakpal";
  var REQUIRED = "Please input required content";

  var card = document.querySelector(".msgs-card");
  var threadsEl = document.querySelector("[data-threads]");
  var pane = document.querySelector("[data-pane]");
  var search = document.querySelector("[data-search]");
  var activeId = null;
  var pendingFiles = [];

  var ICON = {
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    clip: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M3 20.5l18-8.5L3 3.5v6.6l12.8 1.9L3 13.9z"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>',
    file: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  };

  // ---- Storage ------------------------------------------------------------------
  function ago(days, hour, minute) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  // Sample conversations shown until the applicant changes their messages.
  function sample() {
    return [
      {
        id: "sample-statements",
        subject: "Question about my bank statements",
        unread: true,
        messages: [
          { from: "you", text: "Hi Tejal, I closed my Revolut account in August. Do I still need to upload statements for it?", date: ago(1, 10, 12) },
          { from: "advisor", text: "Hi Tejal, yes please – lenders want to see all accounts used in the last 6 months, including closed ones. Upload the statements up to the closing date, and include the closing statement if you have it.", date: ago(1, 11, 40) },
          { from: "advisor", text: "You can add them under Your documents → Personal Current Account(s) Statements.", date: ago(1, 11, 41) },
        ],
      },
      {
        id: "sample-welcome",
        subject: "Welcome to " + BRAND_NAME,
        unread: false,
        messages: [
          { from: "advisor", text: "Hi Tejal, welcome to " + BRAND_NAME + "! I'm your mortgage specialist and I'll guide you through your application. Message me here any time if you have questions.", date: ago(4, 9, 5) },
          { from: "you", text: "Thanks Tejal, looking forward to getting started!", date: ago(4, 9, 32) },
        ],
      },
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

  function save(list) {
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* not persisted */ }
  }

  // ---- Formatting -----------------------------------------------------------------
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function sameDay(a, b) { return a.toDateString() === b.toDateString(); }

  function dayLabel(iso) {
    var d = new Date(iso);
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });
  }

  function time(iso) {
    var d = new Date(iso);
    var h = d.getHours();
    return (h % 12 || 12) + ":" + String(d.getMinutes()).padStart(2, "0") + (h < 12 ? "am" : "pm");
  }

  function listDate(iso) {
    var d = new Date(iso);
    if (sameDay(d, new Date())) return time(iso);
    var label = dayLabel(iso);
    return label === "Yesterday" ? label : d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
  }

  function last(t) { return t.messages[t.messages.length - 1]; }

  // ---- Thread list ------------------------------------------------------------------
  function renderThreads() {
    var q = search.value.trim().toLowerCase();
    var all = load();
    var list = all
      .filter(function (t) {
        if (!q) return true;
        return (t.subject + " " + t.messages.map(function (m) { return m.text; }).join(" ")).toLowerCase().indexOf(q) !== -1;
      })
      .sort(function (a, b) { return last(b).date.localeCompare(last(a).date); });

    if (!all.length) {
      threadsEl.innerHTML =
        '<li class="msgs-empty-list"><p>No messages yet.</p><button class="btn btn--outline" type="button" data-compose>Start a conversation</button></li>';
      return;
    }
    if (!list.length) {
      threadsEl.innerHTML = '<li class="msgs-empty-list"><p>No messages match “' + esc(q) + "”.</p></li>";
      return;
    }

    threadsEl.innerHTML = list.map(function (t) {
      var m = last(t);
      return (
        '<li><button class="thread' + (t.id === activeId ? " is-active" : "") + (t.unread ? " is-unread" : "") + '" type="button" data-thread="' + esc(t.id) + '">' +
          '<span class="thread__top"><span class="thread__subject">' + esc(t.subject) + "</span>" +
          '<span class="thread__date">' + listDate(m.date) + "</span></span>" +
          '<span class="thread__bottom"><span class="thread__snippet">' + (m.from === "you" ? "You: " : "") + esc(m.text || "Attachment") + "</span>" +
          (t.unread ? '<span class="thread__dot"><span class="sr-only">Unread</span></span>' : "") + "</span>" +
        "</button></li>"
      );
    }).join("");
  }

  // ---- Panes ------------------------------------------------------------------------
  function showPane() { card.setAttribute("data-view", "pane"); }
  function showList() { card.setAttribute("data-view", "list"); }

  function showEmpty() {
    activeId = null;
    pane.innerHTML =
      '<div class="msgs-placeholder">' +
        '<span class="msgs-placeholder__icon">' + ICON.chat + "</span>" +
        '<h2 class="msgs-placeholder__title">Select a conversation</h2>' +
        "<p>Choose a conversation on the left, or send a new message to your specialist.</p>" +
        '<button class="btn btn--outline" type="button" data-compose>New message</button>' +
      "</div>";
    renderThreads();
    showList();
  }

  function messagesHtml(messages) {
    var html = "";
    var prevDay = null;
    messages.forEach(function (m, i) {
      var day = new Date(m.date).toDateString();
      if (day !== prevDay) {
        html += '<li class="convo__day"><span>' + dayLabel(m.date) + "</span></li>";
        prevDay = day;
      }
      var prev = messages[i - 1];
      var grouped = prev && prev.from === m.from && new Date(prev.date).toDateString() === day;
      var you = m.from === "you";
      var files = m.files && m.files.length
        ? '<span class="msg__files">' + m.files.map(function (f) { return '<span class="msg__file">' + ICON.file + esc(f) + "</span>"; }).join("") + "</span>"
        : "";
      html +=
        '<li class="msg msg--' + (you ? "you" : "advisor") + (grouped ? " msg--grouped" : "") + '">' +
          (you ? "" : '<span class="avatar avatar--advisor avatar--sm" aria-hidden="true">' + (grouped ? "" : "TS") + "</span>") +
          '<div class="msg__body">' +
            '<div class="msg__bubble">' + (m.text ? esc(m.text) : "") + files + "</div>" +
            '<span class="msg__meta">' + (you ? "You" : ADVISOR) + " · " + time(m.date) + "</span>" +
          "</div>" +
        "</li>";
    });
    return html;
  }

  function composerHtml() {
    return (
      '<form class="composer" novalidate>' +
        '<div class="composer__files" data-files></div>' +
        '<div class="composer__box">' +
          '<label class="composer__icon" title="Attach a file">' + ICON.clip +
            '<span class="sr-only">Attach a file</span><input type="file" class="sr-only" multiple data-attach></label>' +
          '<label class="sr-only" for="composer-text">Message</label>' +
          '<textarea id="composer-text" rows="1" placeholder="Write a message…"></textarea>' +
          '<button class="composer__send" type="submit" aria-label="Send" disabled>' + ICON.send + "</button>" +
        "</div>" +
        '<p class="composer__error" data-error hidden>' + REQUIRED + "</p>" +
      "</form>"
    );
  }

  function openThread(id, opts) {
    var list = load();
    var t = list.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    if (t.unread) { t.unread = false; save(list); }
    activeId = id;
    pendingFiles = [];
    pane.innerHTML =
      '<header class="convo__head">' +
        '<button class="convo__back" type="button" data-back aria-label="Back to conversations">' + ICON.back + "</button>" +
        '<span class="avatar avatar--advisor" aria-hidden="true">TS</span>' +
        '<div class="convo__titles"><h2 class="convo__subject">' + esc(t.subject) + "</h2>" +
        '<p class="convo__with">' + ADVISOR + " · Mortgage specialist</p></div>" +
      "</header>" +
      '<ol class="convo__messages" aria-live="polite">' + messagesHtml(t.messages) + "</ol>" +
      composerHtml();
    renderThreads();
    showPane();
    var box = pane.querySelector(".convo__messages");
    box.scrollTop = box.scrollHeight;
    if (!opts || opts.focus !== false) pane.querySelector("textarea").focus({ preventScroll: true });
  }

  // Desktop shows the list and a conversation side by side, so open the most
  // recent conversation instead of an empty panel. Phones start on the list.
  var wide = window.matchMedia("(min-width: 861px)");

  function showDefault() {
    var latest = load().sort(function (a, b) { return last(b).date.localeCompare(last(a).date); })[0];
    if (wide.matches && latest) openThread(latest.id, { focus: false });
    else showEmpty();
  }

  function renderPendingFiles() {
    var box = pane.querySelector("[data-files]");
    if (!box) return;
    box.innerHTML = pendingFiles.map(function (f, i) {
      return '<span class="file-chip">' + ICON.file + esc(f.name) + '<button type="button" data-unattach="' + i + '" aria-label="Remove ' + esc(f.name) + '">' + ICON.x + "</button></span>";
    }).join("");
    syncSend();
  }

  function syncSend() {
    var form = pane.querySelector(".composer");
    if (!form) return;
    form.querySelector(".composer__send").disabled = !form.querySelector("textarea").value.trim() && !pendingFiles.length;
  }

  function sendReply(form) {
    var text = form.querySelector("textarea").value.trim();
    if (!text && !pendingFiles.length) {
      form.querySelector("[data-error]").hidden = false;
      return;
    }
    var list = load();
    var t = list.filter(function (x) { return x.id === activeId; })[0];
    t.messages.push({ from: "you", text: text, files: pendingFiles.map(function (f) { return f.name; }), date: new Date().toISOString() });
    save(list);
    openThread(activeId);
  }

  function openCompose() {
    activeId = null;
    pendingFiles = [];
    renderThreads();
    pane.innerHTML =
      '<header class="convo__head">' +
        '<button class="convo__back" type="button" data-back aria-label="Back to conversations">' + ICON.back + "</button>" +
        '<div class="convo__titles"><h2 class="convo__subject">New message</h2><p class="convo__with">To ' + ADVISOR + ", your mortgage specialist</p></div>" +
      "</header>" +
      '<form class="compose-form" novalidate>' +
        '<div class="compose-field"><label for="compose-subject">Subject</label><input id="compose-subject" type="text" maxlength="120" placeholder="What is it about?"></div>' +
        '<div class="compose-field"><label for="compose-message">Message</label><textarea id="compose-message" placeholder="Write your message…"></textarea></div>' +
        '<p class="composer__error" data-error hidden>' + REQUIRED + "</p>" +
        '<div class="compose-form__actions">' +
          '<button class="btn btn--text" type="button" data-cancel>Cancel</button>' +
          '<button class="btn btn--primary" type="submit">Send message</button>' +
        "</div>" +
      "</form>";
    showPane();
    pane.querySelector("#compose-subject").focus();
  }

  function sendNew(form) {
    var subject = form.querySelector("#compose-subject");
    var message = form.querySelector("#compose-message");
    var missing = false;
    [subject, message].forEach(function (el) {
      var empty = !el.value.trim();
      el.parentElement.classList.toggle("has-error", empty);
      if (empty) missing = true;
    });
    form.querySelector("[data-error]").hidden = !missing;
    if (missing) return;
    var list = load();
    var id = "t" + Date.now();
    list.push({ id: id, subject: subject.value.trim(), unread: false, messages: [{ from: "you", text: message.value.trim(), date: new Date().toISOString() }] });
    save(list);
    openThread(id);
  }

  // ---- Events --------------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-compose]")) openCompose();
  });

  threadsEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-thread]");
    if (btn) openThread(btn.getAttribute("data-thread"));
  });

  search.addEventListener("input", renderThreads);

  pane.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) showEmpty();
    if (e.target.closest("[data-cancel]")) showDefault();
    var un = e.target.closest("[data-unattach]");
    if (un) {
      pendingFiles.splice(parseInt(un.getAttribute("data-unattach"), 10), 1);
      renderPendingFiles();
    }
  });

  pane.addEventListener("change", function (e) {
    if (e.target.matches("[data-attach]")) {
      pendingFiles = pendingFiles.concat(Array.prototype.slice.call(e.target.files));
      e.target.value = "";
      renderPendingFiles();
      pane.querySelector("[data-error]").hidden = true;
    }
  });

  pane.addEventListener("input", function (e) {
    if (e.target.matches(".composer textarea")) {
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
      pane.querySelector("[data-error]").hidden = true;
      syncSend();
    }
    if (e.target.closest(".compose-field")) e.target.parentElement.classList.remove("has-error");
  });

  pane.addEventListener("keydown", function (e) {
    if (e.target.matches(".composer textarea") && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.target.form.requestSubmit();
    }
  });

  pane.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.classList.contains("composer")) sendReply(e.target);
    else sendNew(e.target);
  });

  showDefault();
})();
