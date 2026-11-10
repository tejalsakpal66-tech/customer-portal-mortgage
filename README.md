# Customer Portal – Mortgage

A responsive customer portal for mortgage applicants: dashboard, application
form, document uploads, appointments, messages, notifications, account
settings and sign-in pages. Plain HTML, CSS and JavaScript, with no build step.

## Run locally

```bash
python3 .claude/serve.py
```

Then open http://localhost:5173/signin.html (or `index.html` for the
dashboard). The bundled server disables caching so edits show on reload.

Data you enter (application progress, uploads, messages, appointments,
profile) is kept in your browser's localStorage, with sample data on first
visit. Nothing is sent to a server.

## White-labelling

The brand (name, logos, colours, fonts, sign-in photo) is configured in
`js/brand.js`. See [BRANDING.md](BRANDING.md).

## Structure

- `*.html`: one file per page
- `css/`: `styles.css` (shared tokens, header, components) plus one stylesheet per page
- `js/`: `brand.js` and `layout.js` (shared), plus one script per page
- `assets/`: brand logos and images
