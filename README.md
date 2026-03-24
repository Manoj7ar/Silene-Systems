# Silene Systems — Static Marketing Site

<p align="center">
  <img src="./silene-clone/logo_dark.svg" alt="Silene Systems" width="200" />
</p>

<p align="center">
  <strong>Local, production-ready static mirror of the public <a href="https://silene.systems">Silene Systems</a> marketing site</strong>
</p>

---

## Overview

This repository contains a **self-contained static website** that reproduces the Silene Systems landing experience: hero with background video, product pillars, use cases, interactive-style workbench preview, disease database section, call-to-action, and legal pages. The build is optimized for **local preview** and **static hosting** (no Node.js runtime required in production).

The site uses the original compiled **Tailwind CSS** bundle, bundled **IBM Plex** fonts, and lightweight **vanilla JavaScript** for navigation, scroll-triggered motion, and stat animations—without relying on Next.js hydration.

---

## Features

| Area | Description |
|------|-------------|
| **Layout & content** | Full landing page sections: hero (`#hero`), platform pillars (`#platform`), use cases, workbench demo (desktop), supported diseases, CTA, footer |
| **Motion** | Framer-style fade/slide reveals on scroll, hero stagger, hero video settle, workbench window animation, optional count-up for aggregate stats |
| **Navigation** | Fixed pill nav (desktop), accessible mobile menu with overlay, in-page anchors, footer links |
| **Legal** | Standalone `/privacy/` and `/terms/` pages with shared styling |
| **Deploy** | Ready for Vercel, Netlify, Cloudflare Pages, S3/CloudFront, or any static file host |
| **Accessibility** | `prefers-reduced-motion` respected; ARIA on mobile dialog; keyboard Escape closes menu |

---

## Requirements

- **Python 3** (for the local dev server), or any static file server of your choice  
- A modern browser (for video, `IntersectionObserver`, and CSS used in motion)

---

## Quick start

```bash
cd silene-clone
python3 -m http.server 3000
```

Open **http://localhost:3000** in your browser.

Equivalent:

```bash
cd silene-clone && npm start
```

(`npm start` runs the same Python HTTP server on port 3000.)

---

## Project structure

```
silenesyetms/
├── README.md                 # This file
└── silene-clone/             # Site root — deploy this folder
    ├── index.html            # Landing page
    ├── site.js               # Nav + scroll motion + count-up
    ├── animations.css        # Motion utilities (reveal, hero, workbench)
    ├── hero.webm             # Hero background video
    ├── og.webp               # Default Open Graph image
    ├── icon.svg              # Favicon
    ├── logo_dark.svg         # Hero / light background
    ├── logo_light.svg        # Footer / dark background
    ├── robots.txt
    ├── vercel.json           # Optional headers (Vercel)
    ├── netlify.toml          # Optional headers (Netlify)
    ├── _headers              # Optional headers (Netlify)
    ├── privacy/index.html
    ├── terms/index.html
    ├── icons/                # SVG icons (workbench, diseases, etc.)
    └── _next/static/         # Original CSS, JS chunks (fonts, main stylesheet), mirrored images
```

---

## Deployment

1. Set the **publish directory** to `silene-clone` (the folder that contains `index.html`).
2. **Canonical & social:** Before going live on your own domain, update `og:url`, `og:site_name`, and use **absolute** URLs for `og:image` / `twitter:image` in `index.html` (see the HTML comment in `<head>`).
3. Optional configs included:
   - **`vercel.json`** — security and cache headers for large assets  
   - **`netlify.toml`** / **`_headers`** — similar for Netlify  

No build step is required; upload or connect the folder as a static site.

---

## Customization

- **Copy & branding:** Replace text, logos (`logo_dark.svg`, `logo_light.svg`), and links as needed for your deployment.
- **Motion:** Adjust timing and easing in `animations.css`; triggers and selectors live in `site.js`.
- **Stats:** Aggregate numbers in the database strip are animated from zero when the section enters view; final values are defined in the HTML (and can be aligned with your data).

---

## Third-party & attribution

Visual design, copy, and assets are derived from the public **Silene Systems** website. If you deploy this project publicly, ensure you have appropriate **rights and permissions** for branding and content, or replace them with your own.

External links (for example to `app.silene.systems`) remain as in the mirrored content unless you change them.

---

## License

This repository is provided as a **static mirror / reference implementation**. It does not grant a license to Silene Systems trademarks or proprietary assets. Use responsibly and in compliance with applicable law and the original rights holders’ terms.
