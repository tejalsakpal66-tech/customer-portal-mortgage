/* "Your documents" section: two pages of document types, each with a
   progress ring, upload count, Upload button and an optional
   "Why isn't this 100% complete?" panel. Content mirrors the live portal. */

window.PortalDocs = (function () {
  var NEED_HELP = "Need help?";

  var PAGES = window.PortalDocList.pages;

  var list = document.getElementById("docs-list");
  var backBtn = document.querySelector('[data-docs="back"]');
  var nextBtn = document.querySelector('[data-docs="next"]');
  var page = 1;
  var docIndex = 0;

  // Files per document name. Starts from what the applicant uploaded before
  // (remembered in this browser, including the sample files); nothing is sent anywhere.
  var uploads = {};
  if (window.UploadsStore) {
    window.UploadsStore.all().forEach(function (r) {
      (uploads[r.doc] = uploads[r.doc] || []).push({ name: r.name, size: r.size, storeId: r.id });
    });
  }

  var R = (44 - 3.6) / 2;
  var C = 2 * Math.PI * R;

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ringHtml(percent) {
    var na = percent === null;
    var bar = !na && percent > 0
      ? '<circle class="ring__bar" cx="22" cy="22" r="' + R + '" stroke-dasharray="' + (C * percent) / 100 + " " + C + '"/>'
      : "";
    return (
      '<span class="ring' + (na ? " ring--na" : "") + '" role="img" aria-label="' +
      (na ? "No progress yet" : percent + "% complete") + '">' +
      '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="ring__track" cx="22" cy="22" r="' + R + '"/>' + bar + "</svg>" +
      '<span class="ring__value" aria-hidden="true">' + (na ? "%" : percent + "%") + "</span></span>"
    );
  }

  function countLabel(name) {
    var n = (uploads[name] || []).length;
    return n + (n === 1 ? " upload" : " uploads");
  }

  // needed: required and nothing uploaded yet · optional: not required · done: has uploads
  function stateOf(doc) {
    if ((uploads[doc.name] || []).length) return "done";
    return doc.percent === null ? "optional" : "needed";
  }

  var STATUS_LABEL = { needed: "Needed", optional: "Optional", done: "Uploaded" };

  function docHtml(doc, i) {
    var state = stateOf(doc);
    var alertId = "doc-alert-" + page + "-" + i;
    var alert = doc.issues && state !== "done"
      ? '<div class="doc-alert">' +
          '<button class="doc-alert__toggle" type="button" aria-expanded="false" aria-controls="' + alertId + '">' +
            '<span class="ms ms--fill" aria-hidden="true">error</span>' +
            "<span>Why isn't this 100% complete?</span>" +
            '<span class="ms doc-alert__chevron" aria-hidden="true">expand_more</span>' +
          "</button>" +
          '<div class="doc-alert__body" id="' + alertId + '" hidden>' +
            "<ul>" + doc.issues.map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("") + "</ul>" +
            '<button class="doc-alert__help" type="button"><span class="ms" aria-hidden="true">help</span>' + NEED_HELP + "</button>" +
          "</div>" +
        "</div>"
      : "";

    return (
      '<article class="doc doc--' + state + '">' +
        '<div class="doc__row">' +
          '<span class="ms doc__icon" aria-hidden="true">library_books</span>' +
          '<div class="doc__info">' +
            '<h3 class="doc__name">' + escapeHtml(doc.name) + "</h3>" +
            '<p class="doc__meta" data-count="' + escapeHtml(doc.name) + '">' + countLabel(doc.name) + "</p>" +
          "</div>" +
          '<span class="doc-status doc-status--' + state + '">' + STATUS_LABEL[state] + "</span>" +
          '<button class="btn ' + (state === "needed" ? "btn--primary" : "btn--outline") + ' doc__upload" type="button" data-upload-index="' + i + '">' +
            '<span class="ms" aria-hidden="true">upload_file</span>' + (state === "done" ? "Add more" : "Upload") +
          "</button>" +
        "</div>" +
        alert +
      "</article>"
    );
  }

  function renderOverview() {
    var counts = { needed: 0, optional: 0, done: 0 };
    PAGES.forEach(function (docs) { docs.forEach(function (d) { counts[stateOf(d)] += 1; }); });
    var el = document.getElementById("docs-overview");
    if (!el) return;
    el.innerHTML =
      '<span class="docs-overview__item"><span class="docs-overview__dot docs-overview__dot--needed"></span><strong>' + counts.needed + "</strong> still needed</span>" +
      '<span class="docs-overview__item"><span class="docs-overview__dot docs-overview__dot--done"></span><strong>' + counts.done + "</strong> uploaded</span>" +
      '<span class="docs-overview__item"><span class="docs-overview__dot docs-overview__dot--optional"></span><strong>' + counts.optional + "</strong> optional</span>";
  }

  function show(n) {
    page = n;
    renderOverview();
    list.innerHTML = PAGES[page - 1].map(docHtml).join("");
    backBtn.hidden = page === 1;
  }

  list.addEventListener("click", function (e) {
    var toggle = e.target.closest(".doc-alert__toggle");
    if (toggle) {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      document.getElementById(toggle.getAttribute("aria-controls")).hidden = !open;
      return;
    }
    var help = e.target.closest(".doc-alert__help");
    if (help) {
      var idx = Array.prototype.indexOf.call(list.children, help.closest(".doc"));
      window.PortalAssistant.open(PAGES[page - 1][idx]);
      return;
    }
    var upload = e.target.closest("[data-upload-index]");
    if (upload) openDialog(parseInt(upload.getAttribute("data-upload-index"), 10), upload);
  });

  backBtn.addEventListener("click", function () {
    show(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  nextBtn.addEventListener("click", function () {
    if (page < PAGES.length) {
      show(page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    else window.goToNextSection("documents");
  });

  // ---- Upload dialog --------------------------------------------------------
  var dialog = document.getElementById("upload-dialog");
  var title = document.getElementById("upload-title");
  var instruction = document.getElementById("upload-instruction");
  var input = document.getElementById("upload-input");
  var fileList = document.getElementById("upload-files");
  var fileCount = document.getElementById("upload-count");
  var dropzone = document.getElementById("upload-dropzone");
  var hint = document.getElementById("upload-hint");
  var stepEl = document.getElementById("upload-step");
  var statusEl = document.getElementById("upload-status");
  var rejectedEl = document.getElementById("upload-rejected");
  var nextWrap = document.getElementById("upload-next");
  var nextText = document.getElementById("upload-next-text");
  var nextLabel = document.getElementById("upload-next-label");
  var nextDocBtn = document.getElementById("upload-next-btn");
  var nextTarget = null; // { page, index } of the next document, or null to close
  var opener = null;

  // Every document in display order, with where it lives.
  function allDocs() {
    var out = [];
    PAGES.forEach(function (docs, p) {
      docs.forEach(function (doc, i) { out.push({ page: p + 1, index: i, doc: doc }); });
    });
    return out;
  }

  // Header (position + status) and the "next document" prompt.
  function renderDialogState() {
    var docs = allDocs();
    var pos = 0;
    docs.forEach(function (d, i) { if (d.page === page && d.index === docIndex) pos = i; });
    var state = stateOf(currentDoc());
    stepEl.textContent = "Document " + (pos + 1) + " of " + docs.length;
    statusEl.className = "doc-status doc-status--" + state + " upload-dialog__status";
    statusEl.textContent = STATUS_LABEL[state];

    // The next still-needed document after this one (wrapping round to the start).
    var next = null;
    for (var k = 1; k < docs.length && !next; k++) {
      var d = docs[(pos + k) % docs.length];
      if (stateOf(d.doc) === "needed") next = d;
    }
    if (next) {
      nextTarget = { page: next.page, index: next.index };
      nextText.innerHTML = "Next needed: <strong>" + escapeHtml(next.doc.name) + "</strong>";
      nextLabel.textContent = "Next document";
      nextWrap.hidden = false;
    } else if (state === "done") {
      nextTarget = null;
      nextText.textContent = "That's every required document uploaded.";
      nextLabel.textContent = "Back to your documents";
      nextWrap.hidden = false;
    } else {
      nextWrap.hidden = true;
    }
  }

  function currentDoc() {
    return PAGES[page - 1][docIndex];
  }

  function formatSize(bytes) {
    return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function renderFiles() {
    var files = uploads[currentDoc().name] || [];
    fileCount.textContent = files.length;
    renderDialogState();
    fileList.innerHTML = files.length
      ? files.map(function (f, i) {
          return '<li class="upload-file"><span class="upload-file__icon"><span class="ms" aria-hidden="true">description</span></span>' +
            '<span class="upload-file__main"><span class="upload-file__name">' + escapeHtml(f.name) + '</span>' +
            '<span class="upload-file__meta">' + formatSize(f.size) + ' · <span class="upload-file__saved"><span class="ms" aria-hidden="true">check</span>Saved</span></span></span>' +
            '<button class="upload-files__remove" type="button" data-remove="' + i + '" aria-label="Remove ' +
            escapeHtml(f.name) + '"><span class="ms" aria-hidden="true">close</span></button></li>';
        }).join("")
      : '<li class="upload-files__empty">No files uploaded yet</li>';
  }

  function openDialog(index, trigger, onPage) {
    if (onPage && onPage !== page) show(onPage);
    docIndex = index;
    if (trigger !== undefined) opener = trigger;
    rejectedEl.hidden = true;
    var doc = currentDoc();
    title.textContent = doc.name;
    instruction.innerHTML = doc.instruction;
    input.accept = doc.images ? "application/pdf,image/jpeg,image/png" : "application/pdf";
    hint.textContent = doc.images ? "PDF, JPG or PNG files" : "PDF files only";
    renderFiles();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    dialog.querySelector(".upload-dialog__close").focus();
  }

  function closeDialog() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    show(page);
    var again = list.querySelector('[data-upload-index="' + docIndex + '"]');
    if (again) again.focus();
  }

  function addFiles(fileListLike) {
    var name = currentDoc().name;
    var all = Array.prototype.slice.call(fileListLike);
    var files = all.filter(function (f) {
      return currentDoc().images ? /pdf|jpe?g|png/i.test(f.type || f.name) : /pdf/i.test(f.type || f.name);
    });
    var skipped = all.filter(function (f) { return files.indexOf(f) === -1; });
    rejectedEl.hidden = !skipped.length;
    if (skipped.length) {
      rejectedEl.textContent = (skipped.length === 1 ? skipped[0].name + " wasn't" : skipped.length + " files weren't") +
        " added – " + (currentDoc().images ? "only PDF, JPG or PNG files are accepted." : "only PDF files are accepted for this document.");
    }
    files.forEach(function (f) {
      f.storeId = window.UploadsStore ? window.UploadsStore.add(name, f) : null;
    });
    uploads[name] = (uploads[name] || []).concat(files);
    renderFiles();
  }

  input.addEventListener("change", function () {
    addFiles(input.files);
    input.value = "";
  });

  ["dragenter", "dragover"].forEach(function (type) {
    dropzone.addEventListener(type, function (e) {
      e.preventDefault();
      dropzone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach(function (type) {
    dropzone.addEventListener(type, function () { dropzone.classList.remove("is-dragging"); });
  });
  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  fileList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (!btn) return;
    var removed = uploads[currentDoc().name].splice(parseInt(btn.getAttribute("data-remove"), 10), 1)[0];
    if (removed && removed.storeId && window.UploadsStore) window.UploadsStore.remove(removed.storeId);
    renderFiles();
  });

  dialog.querySelector('[data-upload="cancel"]').addEventListener("click", closeDialog);

  nextDocBtn.addEventListener("click", function () {
    if (!nextTarget) { closeDialog(); return; }
    openDialog(nextTarget.index, undefined, nextTarget.page);
    dialog.querySelector(".upload-dialog__body").scrollTop = 0;
  });

  document.getElementById("upload-help").addEventListener("click", function () {
    window.PortalAssistant.open(currentDoc());
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !dialog.hidden) closeDialog();
  });

  // Document types still needing uploads (shown on the Application status page).
  function outstanding() {
    var out = [];
    PAGES.forEach(function (docs) {
      docs.forEach(function (d) {
        if (d.percent !== null && d.percent < 100 && !(uploads[d.name] || []).length) out.push(d);
      });
    });
    return out;
  }

  return { show: show, outstanding: outstanding };
})();
