/* Welcome page: shown once to first-time applicants (after registering, or on
   their first visit to the dashboard). Greets them by name, explains the
   three steps and starts the application with their two answers. */

(function () {
  var profile = window.PortalProfile ? window.PortalProfile.get() : null;
  if (profile && profile.firstName) {
    document.querySelector("[data-first-name]").textContent = profile.firstName;
  }

  // Remember it's been seen so the dashboard doesn't send them here again.
  try { window.localStorage.setItem("portal.welcomeSeen", "1"); } catch (e) { /* storage blocked */ }
})();
