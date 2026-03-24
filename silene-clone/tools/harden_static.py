#!/usr/bin/env python3
"""One-off processor: production-harden index.html (strip Next hydration, add nav IDs)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"


def strip_next_scripts(html: str) -> str:
    def repl(m: re.Match) -> str:
        full = m.group(0)
        if 'src="/_next/' in full or ("/_next/" in full and "src=" in full):
            return ""
        if "__next_f" in full:
            return ""
        return full

    return re.sub(r"<script\b[^>]*>[\s\S]*?</script>", repl, html)


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")

    html = strip_next_scripts(html)

    html = re.sub(
        r'<link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/b79d602f30593662.js"/>',
        "",
        html,
    )
    html = re.sub(
        r'<link rel="preload" href="https://plausible\.io/js/[^"]+" as="script"/>',
        "",
        html,
    )

    html = html.replace('charSet="utf-8"', 'charset="utf-8"')

    # How It Works → platform section (single anchor target)
    html = html.replace('href="#how-it-works"', 'href="#platform"')

    # Footer legal URLs (directory index on major hosts)
    html = html.replace('href="/privacy"', 'href="/privacy/"')
    html = html.replace('href="/terms"', 'href="/terms/"')

    # Mobile nav: stable hooks for site.js
    html = html.replace(
        '<button class="flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-surface/80 backdrop-blur-sm text-primary-dark" aria-label="Open Menu">',
        '<button type="button" id="site-nav-toggle" class="flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-surface/80 backdrop-blur-sm text-primary-dark" aria-expanded="false" aria-controls="site-nav-overlay" aria-label="Open menu">',
    )
    html = html.replace(
        '<div class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm transition-all duration-300 sm:hidden opacity-0 pointer-events-none">',
        '<div id="site-nav-overlay" class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm transition-all duration-300 sm:hidden opacity-0 pointer-events-none" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Site menu">',
    )

    # Database summary stats (static mirror had SSR zeros; match visible disease grid totals)
    block = "supported-diseases"
    idx = html.find(f'id="{block}"')
    if idx != -1:
        end = html.find("</section>", idx)
        chunk = html[idx:end]
        count = {"n": 0}
        vals = ("492", "17", "297")

        def stat_repl(m: re.Match) -> str:
            count["n"] += 1
            if count["n"] <= 3:
                return f'<p class="text-2xl font-bold text-primary sm:text-3xl md:text-4xl"><span>{vals[count["n"] - 1]}</span></p>'
            return m.group(0)

        chunk_new = re.sub(
            r'<p class="text-2xl font-bold text-primary sm:text-3xl md:text-4xl"><span>0</span></p>',
            stat_repl,
            chunk,
        )
        html = html[:idx] + chunk_new + html[end:]

    # OG / Twitter image → local asset (set absolute URLs on your host when deploying)
    html = re.sub(
        r'<meta property="og:image" content="https://silene\.systems/og\.webp"/>',
        '<meta property="og:image" content="/og.webp"/>',
        html,
    )
    html = re.sub(
        r'<meta name="twitter:image" content="https://silene\.systems/og\.webp"/>',
        '<meta name="twitter:image" content="/og.webp"/>',
        html,
    )

    inject_css = (
        '<style>html{scroll-behavior:smooth}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}</style>'
    )
    if inject_css not in html:
        html = html.replace("</title>", "</title>" + inject_css, 1)

    if '<script src="/site.js" defer></script>' not in html:
        html = html.replace("</body>", '<script src="/site.js" defer></script></body>')

    INDEX.write_text(html, encoding="utf-8")
    print("Wrote hardened index.html")


if __name__ == "__main__":
    main()
