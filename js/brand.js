/* ==========================================================================
   White-label brand configuration
   --------------------------------------------------------------------------
   Everything that identifies the company running the portal lives here:
   name, logos, colours, fonts and legal wording. Load this file in the <head>
   of every page (before js/layout.js) so the theme applies before first paint.

   To add a brand: copy a theme below, change its values and drop its logo
   files in assets/brand/. Pick the active theme by setting
   window.PORTAL_BRAND = "<id>" before this script, or for previews open any
   page with ?brand=<id> (remembered in this browser; ?brand=default resets).
   See BRANDING.md for the full checklist.
   ========================================================================== */

(function () {
  var THEMES = {
    figor: {
      name: "Figor",                       // shown in titles, copy and consents
      legalName: "Figor",                  // used in legal/consent wording
      logo: "assets/brand/figor-logo.svg", // header + signed-out page
      mark: "assets/brand/figor-submark.svg", // browser-tab icon
      authImage: null,  // optional photo beside the sign-in forms; null = illustration in brand colours
      colors: {
        primary: "#913721",  // Warm Clay / terracotta
        accent: "#c08b4a",   // Golden Amber
        ink: "#4a2311",      // deep brown
        surface: "#fafaf8",  // near-white, so cards and brand colours stand out
        onPrimary: "#ffffff",
        onAccent: "#4a2311",
      },
      // Optional overrides; omitted values keep the defaults in css/styles.css.
      fonts: null,
      neutrals: null,
    },

    // Neutral demo theme showing what changes when the portal is re-branded.
    example: {
      name: "Example Lender",
      legalName: "Example Lender Ltd",
      logo: "assets/brand/example-logo.svg",
      mark: "assets/brand/example-mark.svg",
      authImage: null,
      colors: {
        primary: "#1f4e79",
        accent: "#2a9d8f",
        ink: "#10263b",
        surface: "#f5f7fa",
        onPrimary: "#ffffff",
        onAccent: "#ffffff",
      },
      fonts: {
        heading: '"Fraunces", Georgia, "Times New Roman", serif',
        body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        stylesheet: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&display=swap",
      },
      // Cool greys instead of the warm ones that suit Figor.
      neutrals: {
        900: "#111827", 800: "#1f2937", 700: "#374151", 600: "#4b5563", 500: "#6b7280",
        400: "#9ca3af", 300: "#cbd5e1", 200: "#e2e8f0", 100: "#eef2f6",
      },
    },
  };

  var DEFAULT_ID = "figor";
  var STORE_KEY = "portal.brand";

  // ---- Pick the active theme ------------------------------------------------------
  function chooseId() {
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(window.location.search).get("brand"); } catch (e) { /* old browser */ }
    if (fromUrl) {
      try {
        if (fromUrl === "default") window.localStorage.removeItem(STORE_KEY);
        else if (THEMES[fromUrl]) window.localStorage.setItem(STORE_KEY, fromUrl);
      } catch (e) { /* storage blocked: applies to this page only */ }
      if (THEMES[fromUrl]) return fromUrl;
    }
    // A deployment's own setting wins over a preview remembered in the browser.
    if (window.PORTAL_BRAND && THEMES[window.PORTAL_BRAND]) return window.PORTAL_BRAND;
    var saved = null;
    try { saved = window.localStorage.getItem(STORE_KEY); } catch (e) { saved = null; }
    if (saved && THEMES[saved]) return saved;
    return DEFAULT_ID;
  }

  var id = chooseId();
  var theme = THEMES[id];

  // ---- Apply colours and fonts as CSS custom properties ----------------------------
  var root = document.documentElement;
  var c = theme.colors;
  var vars = {
    "--brand-primary": c.primary,
    "--brand-accent": c.accent,
    "--brand-ink": c.ink,
    "--brand-surface": c.surface,
    "--on-primary": c.onPrimary || "#ffffff",
    "--on-accent": c.onAccent || c.ink,
    "--icon-check-on-accent": checkIcon(c.onAccent || c.ink),
  };
  // Absolute URL: a relative url() inside a custom property would resolve
  // against the stylesheet that uses it (css/), not the page.
  if (theme.authImage) vars["--auth-image"] = 'url("' + new URL(theme.authImage, document.baseURI).href + '")';
  if (theme.neutrals) {
    Object.keys(theme.neutrals).forEach(function (step) { vars["--gray-" + step] = theme.neutrals[step]; });
  }
  if (theme.fonts) {
    if (theme.fonts.heading) vars["--font-heading"] = theme.fonts.heading;
    if (theme.fonts.body) vars["--font"] = theme.fonts.body;
    if (theme.fonts.stylesheet) {
      var fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = theme.fonts.stylesheet;
      document.head.appendChild(fontLink);
    }
  }
  Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });
  root.setAttribute("data-brand", id);

  function checkIcon(color) {
    return 'url("data:image/svg+xml,' + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='" + color +
      "' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg>"
    ) + '")';
  }

  // ---- Browser chrome: tab icon, theme colour, page title ----------------------------
  var icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.type = "image/svg+xml";
  icon.href = theme.mark;

  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    document.head.appendChild(themeColor);
  }
  themeColor.content = c.surface;

  // Titles are written "Page | Figor" in the HTML; swap the brand part.
  document.title = document.title.replace(/\|[^|]*$/, "| " + theme.name);

  // ---- Brand text and logos already in the HTML ----------------------------------------
  //   <span data-brand-name>Figor</span>        → brand name
  //   <span data-brand-legal-name>Figor</span>  → legal name
  //   <img data-brand-logo>                     → logo (alt = brand name)
  function fillMarkup(scope) {
    (scope || document).querySelectorAll("[data-brand-name]").forEach(function (el) { el.textContent = theme.name; });
    (scope || document).querySelectorAll("[data-brand-legal-name]").forEach(function (el) { el.textContent = theme.legalName; });
    (scope || document).querySelectorAll("img[data-brand-logo]").forEach(function (img) {
      img.src = theme.logo;
      if (!img.hasAttribute("data-brand-logo-alt")) img.alt = theme.name;
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { fillMarkup(); });
  else fillMarkup();

  window.PortalBrand = {
    id: id,
    name: theme.name,
    legalName: theme.legalName,
    logo: theme.logo,
    mark: theme.mark,
    colors: c,
    authImage: theme.authImage || null,
    themes: Object.keys(THEMES),
    // File-name friendly version of the brand name, e.g. "example-lender".
    slug: theme.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    fill: fillMarkup,
  };
})();
