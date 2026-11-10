# White-labelling the Customer Portal

Everything that identifies the company running the portal is defined in one
file, [`js/brand.js`](js/brand.js). Pages, styles and scripts read the brand
from there, so a new brand needs no changes anywhere else.

## Add a brand

1. **Logos:** put two SVG files in `assets/brand/`:
   - a wordmark logo, shown in the header and on the signed-out page (about
     2:1 or wider)
   - a square mark, used as the browser-tab icon
2. **Theme:** in `js/brand.js`, copy the `example` theme inside `THEMES`, give
   it a new id (for example `acme`) and fill in its values:

   | Field | Used for |
   |---|---|
   | `name` | Page titles ("Dashboard \| Acme"), welcome copy, header logo alt text |
   | `legalName` | Consent wording ("marketing communications from …") |
   | `logo`, `mark` | Header / signed-out logo, browser-tab icon |
   | `authImage` (optional) | Photo beside the sign-in, register and password forms. Leave as `null` to use the built-in home-and-keys illustration, drawn in the brand colours |
   | `colors.primary` | Buttons, active states, own chat bubbles, current step |
   | `colors.accent` | Secondary highlights, progress bars, chat button, completed steps |
   | `colors.ink` | Deep brand colour for icons on the accent colour, and for shadows |
   | `colors.surface` | Page background |
   | `colors.onPrimary`, `colors.onAccent` | Text/icon colour placed on primary / accent |
   | `fonts` (optional) | `heading` / `body` font stacks, plus a `stylesheet` URL to load them |
   | `neutrals` (optional) | Grey scale `900`–`100`; leave out to keep the warm defaults |

   Tints, hover shades, borders and shadows are calculated from these colours
   (CSS `color-mix()` in `css/styles.css`), so only the values above are needed.
3. **Activate:** set the brand for a deployment before `js/brand.js` loads:

   ```html
   <script>window.PORTAL_BRAND = "acme";</script>
   <script src="js/brand.js"></script>
   ```

## Preview a brand

Open any page with `?brand=<id>`, for example `index.html?brand=example`. The
choice is remembered in that browser. Use `?brand=default` to go back. A
deployment's `window.PORTAL_BRAND` always wins over a remembered preview.

## Checklist

- **Contrast:** keep `primary` dark enough for white text (4.5:1). If it can't
  be, set `onPrimary` to a dark colour instead. Check `onAccent` against
  `accent` in the same way.
- **Legal and support copy:** review it for the new company. The consent and
  data-handling wording lives on `consents.html`. Terms of Business and the
  Privacy Policy are linked from the Documents page.
- **Brand text in HTML:** when adding new pages, wrap the brand name in
  `<span data-brand-name>…</span>` (or `data-brand-legal-name`). Mark logos
  with `<img data-brand-logo>`. In scripts, use `window.PortalBrand.name`.
  Don't hard-code a brand name or colour.
- **Colours in CSS:** use the tokens (`--primary`, `--accent`, `--accent-dark`,
  `--shadow-color`, the `--gray-*` scale), never hex values tied to a brand.
