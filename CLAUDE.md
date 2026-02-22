# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Website for **Mycelium Tech Coop** — a technology cooperative advancing technological sovereignty for the solidarity economy. The site is a branding/informational site with sections: Landing/Hero, Mission, Team, Services, and Footer.

## Tech Stack

- **Vite** (v7) — build tool and dev server
- **Vanilla JS** (ESM) — no framework
- **CSS** — split by concern into `src/styles/` (no preprocessor)
- **Fontsource** — self-hosted Google Fonts via npm packages
- **Marked** — Markdown parsing for the content plugin
- **Node 22** — matches CI

## Project Structure

```
index.html                  # Template entry point with content placeholders
content/*.md                # Copy blocks split by <!-- @id: key --> markers
src/
  main.js                   # UI behavior (font switcher, collapse toggle)
  fonts.js                  # Centralized font imports
  styles/
    variables.css           # Design tokens (colors, fonts, spacing)
    reset.css               # CSS reset
    layout.css              # Section/grid layout
    typography.css          # Font styling
    controls.css            # Font testing controls bar
vite-plugin-content.js      # Custom Vite plugin: injects Markdown → HTML
vite.config.js              # Vite config (base: "./", content plugin)
design.pen                  # Pencil design file (use Pencil MCP tools only)
.github/workflows/deploy.yml  # GitHub Pages deploy on push to main
```

## Content System

- `{{key}}` in `index.html` → inline content (parsed with `marked.parseInline`)
- `{{{key}}}` in `index.html` → block content (parsed with `marked.parse`)
- Content blocks are defined in `content/*.md` using `<!-- @id: key -->` markers
- Each key must be unique across all content files
- The custom `vite-plugin-content.js` resolves placeholders at build/dev time and triggers full-reload on content file changes

## Commands

- `npm ci` — install exact dependencies
- `npm run dev` — start Vite dev server with live reload
- `npm run build` — production build to `dist/`
- `npm run preview` — serve built site locally

## Design Tokens

All design tokens live in `src/styles/variables.css`. Add new tokens there instead of using one-off values.

### Color Palette (Earthy Vitality)

| Name            | CSS Variable                | Hex       |
|-----------------|-----------------------------|-----------|
| Warm White      | `--color-warm-white`        | `#FFF8F0` |
| Sage Green      | `--color-sage-green`        | `#9CAF88` |
| Healthy Growth  | `--color-healthy-growth`    | `#7FA67C` |
| Mushroom Beige  | `--color-mushroom-beige`    | `#BFA993` |
| Rich Soil       | `--color-rich-soil`         | `#6B4E3D` |

Derived tints: `--color-sage-tint` (`#e8ede4`), `--color-mushroom-tint` (`#f0e8e0`)

### Font Setup

Fonts are self-hosted via Fontsource and imported in `src/fonts.js`:

- **Logo**: Rubik Dirt, Rubik Distressed, Rubik Maze, Rubik Microbe (decorative, static)
- **Headers**: Archivo Black, DM Sans (variable), IBM Plex Mono (700), Poppins (700), Inter (variable)
- **Body**: IBM Plex Mono (400), Poppins (400), Nunito (variable), Work Sans (variable), Source Sans 3 (variable), Inter (variable)

Current defaults: Logo = Rubik Maze, Header = Archivo Black, Body = IBM Plex Mono.

Font families are controlled via CSS custom properties (`--font-logo`, `--font-header`, `--font-body`) and switchable at runtime through the font testing controls bar.

## Coding Style

- 2-space indentation in JS, CSS, and HTML
- ESM with double quotes and semicolons
- CSS class names and content IDs in kebab-case (e.g. `principle-card`, `service-1-title`)
- Behavior in `src/main.js`; no inline scripts in `index.html`

## Commit Conventions

Follow Conventional Commits as seen in history:
- `feat:`, `fix:`, `refactor(html):`, `style(typography):`, `design:`, `content:`, `ci:`, `chore:`
- `design:` prefix for `.pen` file and visual layout changes
- `content:` prefix for `content/*.md` changes

## Design File

`design.pen` is the Pencil design file. **Do not** use Read/Grep/Edit tools on `.pen` files — use the Pencil MCP tools exclusively (`batch_get`, `batch_design`, `get_screenshot`, `snapshot_layout`, etc.).

## CI/CD

GitHub Actions deploys to GitHub Pages on push to `main` (`.github/workflows/deploy.yml`). The workflow runs `npm ci && npm run build` and uploads `dist/`.

## Tooling

- **Fontsource installer skill** available via `/fontsource-installer` for self-hosting Google Fonts
- **Playwright CLI skill** available for browser automation and testing
- **Canva integration** enabled for accessing design assets
- **Pencil MCP** for `.pen` design file editing
