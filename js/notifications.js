/* Notifications page: the feed from PortalNotifications (js/layout.js),
   grouped by day, with an All / Unread filter and read state per item. */

(function () {
  var listEl = document.querySelector("[data-list]");
  var markAll = document.querySelector("[data-mark-all]");
  var unreadCountEl = document.querySelector("[data-unread-count]");
  var tabs = document.querySelectorAll("[data-filter]");
  var filter = "all";

  var ICONS = {
    action: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14l3-3 3 3"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/>',
    appointment: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    document: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14.5l2 2 4-4.5"/>',
    application: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    welcome: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  };

  var EMPTY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function daysAgo(iso) {
    return Math.round((startOfDay(new Date()) - startOfDay(iso)) / 86400000);
  }

  function groupOf(iso) {
    var n = daysAgo(iso);
    if (n <= 0) return "Today";
    if (n === 1) return "Yesterday";
    if (n < 7) return "Earlier this week";
    return "Older";
  }

  function clock(d) {
    return d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  }

  function when(iso) {
    var d = new Date(iso);
    var n = daysAgo(iso);
    if (n <= 0) {
      var mins = Math.max(1, Math.round((Date.now() - d) / 60000));
      return mins < 60 ? mins + " min ago" : Math.round(mins / 60) + "h ago";
    }
    if (n === 1) return clock(d);
    if (n < 7) return d.toLocaleDateString("en-IE", { weekday: "short" }) + ", " + clock(d);
    return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
  }

  function itemHtml(n) {
    return (
      '<li class="notif' + (n.read ? "" : " is-unread") + '">' +
        '<a class="notif__link" href="' + esc(n.href) + '" data-open="' + esc(n.id) + '">' +
          '<span class="notif__icon notif__icon--' + esc(n.type) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n.type] || ICONS.welcome) + "</svg></span>" +
          '<span class="notif__main">' +
            '<span class="notif__title">' + (n.read ? "" : '<span class="sr-only">Unread: </span>') + esc(n.title) + "</span>" +
            '<span class="notif__body">' + esc(n.body) + "</span>" +
            '<span class="notif__time">' + when(n.date) + "</span>" +
          "</span>" +
        "</a>" +
        '<button class="notif__toggle" type="button" data-toggle="' + esc(n.id) + '" title="' + (n.read ? "Mark as unread" : "Mark as read") + '" aria-label="' +
          (n.read ? "Mark as unread: " : "Mark as read: ") + esc(n.title) + '">' +
          '<span class="notif__dot" aria-hidden="true"></span></button>' +
      "</li>"
    );
  }

  function render() {
    var all = window.PortalNotifications.all().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var unread = all.filter(function (n) { return !n.read; }).length;
    unreadCountEl.textContent = unread;
    unreadCountEl.hidden = !unread;
    markAll.disabled = !unread;

    var items = filter === "unread" ? all.filter(function (n) { return !n.read; }) : all;
    if (!items.length) {
      listEl.innerHTML =
        '<div class="notifs-empty">' +
          '<span class="notifs-empty__icon">' + EMPTY_ICON + "</span>" +
          '<p class="notifs-empty__title">' + (filter === "unread" ? "You're all caught up" : "No notifications yet") + "</p>" +
          "<p>" + (filter === "unread"
            ? "You've read everything. New updates on your application will appear here."
            : "Updates on your application, documents and appointments will appear here.") + "</p>" +
        "</div>";
      return;
    }

    var html = "";
    var current = null;
    items.forEach(function (n) {
      var g = groupOf(n.date);
      if (g !== current) {
        if (current) html += "</ul></section>";
        html += '<section class="notifs-group"><h2 class="notifs-group__title">' + g + '</h2><ul class="notifs-group__list">';
        current = g;
      }
      html += itemHtml(n);
    });
    html += "</ul></section>";
    listEl.innerHTML = html;
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      filter = tab.getAttribute("data-filter");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  markAll.addEventListener("click", function () {
    window.PortalNotifications.markAllRead();
  });

  listEl.addEventListener("click", function (e) {
    var open = e.target.closest("[data-open]");
    if (open) {
      // Mark as read, then follow the link (marking re-renders the list, so
      // navigate explicitly rather than relying on the removed element).
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
        window.PortalNotifications.setRead(open.getAttribute("data-open"), true);
        return;
      }
      e.preventDefault();
      var href = open.getAttribute("href");
      window.PortalNotifications.setRead(open.getAttribute("data-open"), true);
      window.location.href = href;
      return;
    }
    var toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      var id = toggle.getAttribute("data-toggle");
      var item = window.PortalNotifications.all().filter(function (n) { return n.id === id; })[0];
      if (item) window.PortalNotifications.setRead(id, !item.read);
      var again = listEl.querySelector('[data-toggle="' + id + '"]');
      if (again) again.focus();
    }
  });

  document.addEventListener("notifications:change", render);
  render();
})();
