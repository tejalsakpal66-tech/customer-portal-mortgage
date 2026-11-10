/* Remembers which files the applicant chose in the upload dialog (name, size,
   document type, date) so the Documents page can list them. The list lives in
   localStorage; the files themselves are kept in this browser's IndexedDB so
   they can be opened again from the Documents page. Nothing is sent anywhere. */

window.UploadsStore = (function () {
  var KEY = "portal.uploads";
  var DB_NAME = "portal-files";
  var STORE = "files";

  // Dummy data shown until the applicant changes their uploads.
  var SAMPLE = [
    { id: "sample-1", name: "AIB_Current_Account_May-Oct_2026.pdf", size: 862315, doc: "Personal Current Account(s) Statements", date: "2026-11-02T09:41:00Z" },
    { id: "sample-2", name: "Revolut_Statement_May-Oct_2026.pdf", size: 528400, doc: "Personal Current Account(s) Statements", date: "2026-11-02T09:44:00Z" },
    { id: "sample-3", name: "Passport_Tejal_Sakpal.pdf", size: 1983201, doc: "Photo Identification", date: "2026-11-03T18:12:00Z" },
    { id: "sample-4", name: "Electricity_Bill_October_2026.pdf", size: 238600, doc: "Proof of Address", date: "2026-11-04T12:05:00Z" },
  ];

  function all() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw === null) return SAMPLE.slice();
      return JSON.parse(raw) || [];
    } catch (e) {
      return SAMPLE.slice();
    }
  }

  function save(list) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      /* storage blocked – the list just won't persist */
    }
  }

  // ---- File contents (IndexedDB) ---------------------------------------------
  var dbPromise = null;

  function db() {
    if (!dbPromise) {
      dbPromise = new Promise(function (resolve, reject) {
        if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
        var req = window.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    }
    return dbPromise;
  }

  function request(mode, run) {
    return db().then(function (d) {
      return new Promise(function (resolve) {
        var tx = d.transaction(STORE, mode);
        var req = run(tx.objectStore(STORE));
        tx.oncomplete = function () { resolve(req && req.result !== undefined ? req.result : null); };
        tx.onerror = tx.onabort = function () { resolve(null); };
      });
    }).catch(function () { return null; });
  }

  // Resolves with the stored File/Blob, or null when only the metadata exists
  // (sample data, or storage was blocked when the file was added).
  function getFile(id) {
    return request("readonly", function (store) { return store.get(id); });
  }

  function add(doc, file) {
    var list = all();
    var record = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name: file.name,
      size: file.size,
      type: file.type,
      doc: doc,
      date: new Date().toISOString(),
    };
    list.push(record);
    save(list);
    request("readwrite", function (store) { return store.put(file, record.id); });
    return record.id;
  }

  function remove(id) {
    save(all().filter(function (r) { return r.id !== id; }));
    request("readwrite", function (store) { return store.delete(id); });
  }

  return { all: all, add: add, remove: remove, getFile: getFile };
})();
