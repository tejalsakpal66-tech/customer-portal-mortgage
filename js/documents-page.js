/* Documents page: advisor-uploaded and applicant-uploaded file lists, and a
   viewer that opens a file in place. Files the applicant uploaded are read
   back from this browser (UploadsStore); sample entries have no file behind
   them, so the viewer shows a placeholder page instead. */

(function () {
  var FILE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>';
  var IMAGE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8.5 8.5"/></svg>';
  var EYE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';

  // Dummy advisor uploads (these come from the advisor's side of the portal).
  var advisorFiles = [
    { id: "advisor-1", name: "Approval_in_Principle_Bank_of_Ireland.pdf", size: 319488, doc: "Approval in Principle", date: "2026-11-01T15:20:00Z" },
    { id: "advisor-2", name: "Mortgage_Fact_Find_Summary.pdf", size: 202752, doc: "Fact find summary", date: "2026-10-28T11:02:00Z" },
    { id: "advisor-3", name: "Gift_Letter_Template.pdf", size: 65536, doc: "Template to complete", date: "2026-10-25T10:30:00Z" },
  ];

  var lists = {
    advisor: advisorFiles,
    mine: window.UploadsStore.all(),
  };

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatSize(bytes) {
    return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" }) + ", " +
      d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  }

  function isImage(f) {
    return /^image\//.test(f.type || "") || /\.(jpe?g|png)$/i.test(f.name);
  }

  function render(kind, singular, plural) {
    var files = lists[kind];
    var list = document.querySelector('[data-list="' + kind + '"]');
    document.querySelector('[data-count="' + kind + '"]').textContent = files.length + " " + (files.length === 1 ? singular : plural);

    if (!files.length) {
      list.innerHTML =
        '<li class="files-list__empty">' +
          (kind === "mine"
            ? 'Nothing uploaded yet. <a href="application.html?section=documents">Upload your documents</a>'
            : "Your specialist hasn't shared any files yet.") +
        "</li>";
      return;
    }

    list.innerHTML = files
      .slice()
      .sort(function (a, b) { return b.date.localeCompare(a.date); })
      .map(function (f) {
        return (
          '<li class="file-row">' +
            '<button class="file-row__open" type="button" data-view="' + kind + ":" + esc(f.id) + '" aria-label="View ' + esc(f.name) + '">' +
              '<span class="file-row__icon">' + (isImage(f) ? IMAGE_ICON : FILE_ICON) + "</span>" +
              '<span class="file-row__main">' +
                '<span class="file-row__name">' + esc(f.name) + "</span>" +
                '<span class="file-row__meta">' + esc(f.doc) + "</span>" +
                '<span class="file-row__sub">' + formatDate(f.date) + " · " + formatSize(f.size) + "</span>" +
              "</span>" +
              '<span class="file-row__date">' + formatDate(f.date) + "</span>" +
              '<span class="file-row__size">' + formatSize(f.size) + "</span>" +
              '<span class="file-row__view">' + EYE_ICON + "View</span>" +
            "</button>" +
          "</li>"
        );
      })
      .join("");
  }

  render("advisor", "file", "files");
  render("mine", "upload", "uploads");

  // ---- Viewer --------------------------------------------------------------------
  var viewer = document.getElementById("viewer");
  var body = viewer.querySelector("[data-viewer-body]");
  var download = viewer.querySelector("[data-viewer-download]");
  var objectUrl = null;
  var opener = null;
  var openToken = 0;

  function sheetHtml(f, kind) {
    // Placeholder "page": varying line widths so it reads as a document.
    var widths = [92, 86, 95, 70, 0, 88, 94, 81, 90, 64, 0, 93, 85, 76];
    var lines = widths.map(function (w) {
      return w ? '<span style="width:' + w + '%"></span>' : '<span class="doc-sheet__gap"></span>';
    }).join("");
    return (
      '<div class="viewer__sample">' +
        '<p class="viewer__note">' +
          (kind === "advisor"
            ? "This is sample data, so there's no file to open yet. Files your specialist shares will open here in full."
            : "This is sample data, so there's no file saved for it. Files you upload yourself open here in full.") +
        "</p>" +
        '<div class="doc-sheet" aria-hidden="true">' +
          '<span class="doc-sheet__tag">Sample</span>' +
          '<p class="doc-sheet__type">' + esc(f.doc) + "</p>" +
          '<p class="doc-sheet__name">' + esc(f.name) + "</p>" +
          '<div class="doc-sheet__lines">' + lines + "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function show(f, kind) {
    document.getElementById("viewer-title").textContent = f.name;
    viewer.querySelector("[data-viewer-meta]").textContent =
      f.doc + " · " + formatDate(f.date) + " · " + formatSize(f.size);
    download.hidden = true;
    body.innerHTML = '<p class="viewer__loading">Opening file…</p>';

    viewer.hidden = false;
    document.body.classList.add("has-viewer");
    viewer.querySelector(".viewer__close").focus();

    var token = ++openToken;
    var lookup = kind === "mine" ? window.UploadsStore.getFile(f.id) : Promise.resolve(null);
    lookup.then(function (file) {
      if (token !== openToken) return; // closed, or another file opened meanwhile
      if (!file) {
        body.innerHTML = sheetHtml(f, kind);
        return;
      }
      objectUrl = URL.createObjectURL(file);
      body.innerHTML = isImage(f)
        ? '<div class="viewer__image"><img src="' + objectUrl + '" alt="' + esc(f.name) + '"></div>'
        : '<iframe class="viewer__frame" src="' + objectUrl + '" title="' + esc(f.name) + '"></iframe>';
      download.href = objectUrl;
      download.setAttribute("download", f.name);
      download.hidden = false;
    });
  }

  function close() {
    openToken++;
    viewer.hidden = true;
    document.body.classList.remove("has-viewer");
    body.innerHTML = "";
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    if (opener) opener.focus();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-view]");
    if (!btn) return;
    var parts = btn.getAttribute("data-view").split(":");
    var file = lists[parts[0]].filter(function (f) { return String(f.id) === parts.slice(1).join(":"); })[0];
    if (!file) return;
    opener = btn;
    show(file, parts[0]);
  });

  viewer.addEventListener("click", function (e) {
    if (e.target.closest("[data-viewer-close]")) close();
  });

  document.addEventListener("keydown", function (e) {
    if (viewer.hidden) return;
    if (e.key === "Escape") close();
    // Keep Tab inside the dialog.
    if (e.key === "Tab") {
      var focusable = Array.prototype.filter.call(
        viewer.querySelectorAll("a[href], button, iframe"),
        function (el) { return !el.hidden && el.offsetParent !== null; }
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });
})();
