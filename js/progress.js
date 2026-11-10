/* Shared application progress, remembered in the browser so the dashboard
   can show the "in progress" state. Safe when storage is unavailable. */

window.AppProgress = (function () {
  var KEY = "portal.applicationProgress";

  function get() {
    try {
      return Math.max(0, parseInt(window.localStorage.getItem(KEY), 10) || 0);
    } catch (e) {
      return 0;
    }
  }

  function set(value) {
    try {
      // Never go backwards when the applicant revisits an earlier part.
      if (value > get()) window.localStorage.setItem(KEY, String(value));
    } catch (e) {
      /* storage blocked – the dashboard just shows the start state */
    }
  }

  // Sections the applicant has finished (reached the summary for).
  var DONE_KEY = "portal.completedSections";

  function completed() {
    try {
      return JSON.parse(window.localStorage.getItem(DONE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function complete(name) {
    var list = completed();
    if (list.indexOf(name) !== -1) return;
    list.push(name);
    try {
      window.localStorage.setItem(DONE_KEY, JSON.stringify(list));
    } catch (e) {
      /* not persisted */
    }
  }

  return { get: get, set: set, completed: completed, complete: complete };
})();
