# Repository Guidelines

## Project Overview
- Website for **Mycelium Tech Coop** (branding/informational site) with sections for hero, values/mission, services, team, and footer/contact.
- Built as a static Vite site with Markdown-driven content injection into `index.html`.
- Frontend behavior includes responsive navigation, dynamic team card rendering from Markdown content, and a configurable contact form flow with optional Cloudflare Turnstile.

## Tech Stack
- Vite v7 (dev/build)
- Vanilla JS (ESM)
- CSS split by concern in `src/styles/`
- Fontsource (self-hosted fonts)
- Marked (Markdown parsing in the content plugin and team bios)
- Cloudflare Turnstile (client-side widget, optional via env vars)
- Node 22 (matches CI)

## Project Structure & Module Organization
- `index.html` is the template entry point and contains content placeholders (`{{id}}` for inline, `{{{id}}}` for block HTML).
- `content/*.md` stores copy blocks, split by marker comments like `<!-- @id: mission-heading -->`.
- `content/team.md` contains team member fields keyed like `team-1-name`, `team-1-role`, `team-1-image`, `team-1-bio`.
- `src/main.js` wires UI behavior (mobile nav, team rendering, contact form submit flow, Turnstile mount/reset); `src/fonts.js` centralizes font imports.
- `src/styles/*.css` is split by concern (`reset`, `variables`, `layout`, `typography`, `controls`).
- `vite-plugin-content.js` injects Markdown content into `index.html` at build/dev time and triggers full reloads on `content/*.md` changes.
- `vite.config.js` sets `base: "./"` and registers the content plugin.
- `design.pen` is the Pencil design file for visual/layout work.
- `.github/workflows/deploy.yml` builds and deploys GitHub Pages from `main`.
- `CLAUDE.md` contains a more detailed repo briefing; keep `AGENTS.md` aligned when workflow conventions evolve.
- `dist/` is build output (generated, do not edit manually).

## Content System Patterns
- `{{id}}` placeholders are rendered as inline Markdown (`marked.parseInline`).
- `{{{id}}}` placeholders are rendered as block Markdown (`marked.parse`).
- Every placeholder key in `index.html` must have exactly one matching `@id` block across `content/*.md`.
- Content IDs must remain unique and non-empty; the plugin throws on duplicates or empty blocks.
- Keep content IDs stable and kebab-case to avoid breaking template bindings.
- Team entries must follow `team-{index}-{field}` with fields: `name`, `role`, `image`, `bio`.

## Environment Variables
- `VITE_CONTACT_EMAIL`: used for mailto links and contact defaults (fallback: `hello@mycelium.coop`).
- `VITE_CONTACT_FORM_ENDPOINT`: backend endpoint for contact form POST requests.
- `VITE_TURNSTILE_SITE_KEY`: enables Cloudflare Turnstile widget when set.
- In CI, these are provided via GitHub Actions repository/environment variables in `deploy.yml`.

## Build, Test, and Development Commands
- `npm ci`: install exact dependencies from `package-lock.json`.
- `npm run dev`: start Vite dev server with live reload.
- `npm run build`: create production build in `dist/`.
- `npm run preview`: serve the built site locally for final verification.

Use Node 22 to match CI (`.github/workflows/deploy.yml`).

## Coding Style & Naming Conventions
- Use 2-space indentation in JS, CSS, and HTML.
- JavaScript uses ESM, double quotes, and semicolons.
- Keep CSS class names and content IDs in kebab-case (for example, `principle-card`, `service-1-title`).
- Add new design tokens in `src/styles/variables.css` before introducing one-off values.
- Keep behavior in `src/main.js`; avoid inline scripts in `index.html`.
- Preserve the content/template split: copy changes in `content/*.md`, structure/markup changes in `index.html`.
- Keep font imports centralized in `src/fonts.js` and use CSS custom properties for font swaps.

## Design File & Visual Workflow Patterns
- Treat `design.pen` as the source for design explorations and layout iterations; do not hand-edit binary-ish `.pen` internals with generic text tools.
- Use Pencil MCP tools for `.pen` updates (`batch_get`, `batch_design`, `snapshot_layout`, `get_screenshot`, etc.).
- For visual refinements, verify both desktop and mobile layouts before considering work complete.
- Watch for common regressions seen recently: text overflow on mobile, card/header wrapping, quote accent alignment, and footer wrapping issues.
- Include screenshots for UI/layout changes in PRs when possible.

## Testing Guidelines
- There is no automated test suite yet.
- Required validation for each change:
  - Run `npm run build` (must pass).
  - Run `npm run preview` and verify key sections render correctly.
  - For content changes, confirm every placeholder has a matching unique `@id` block in `content/*.md`.
  - For team content/logic changes, verify cards render from `content/team.md` and invalid or comment-wrapped entries are excluded.
  - For contact form changes, verify behavior with and without `VITE_CONTACT_FORM_ENDPOINT` and `VITE_TURNSTILE_SITE_KEY`.
  - For layout/style changes, check at least one mobile viewport and one desktop viewport for overflow/wrapping regressions.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat: ...`, `fix: ...`, `refactor(html): ...`, `style(typography): ...`, `design: ...`, `content: ...`, `ci: ...`, `chore: ...`.
- Use `design:` for `design.pen` and visual layout changes.
- Use `content:` for `content/*.md` copy/placeholder updates.
- Keep commits scoped to one logical change.
- PRs should include:
  - concise summary of user-visible impact,
  - linked issue/task when available,
  - screenshots for layout/typography/UI updates,
  - confirmation that `npm run build` succeeded.
