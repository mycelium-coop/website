# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the template entry point and contains content placeholders (`{{id}}` for inline, `{{{id}}}` for block HTML).
- `content/*.md` stores copy blocks, split by marker comments like `<!-- @id: mission-heading -->`.
- `src/main.js` wires UI behavior; `src/fonts.js` centralizes font imports.
- `src/styles/*.css` is split by concern (`reset`, `variables`, `layout`, `typography`, `controls`).
- `vite-plugin-content.js` injects Markdown content into `index.html` at build/dev time.
- `dist/` is build output (generated, do not edit manually).

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

## Testing Guidelines
- There is no automated test suite yet.
- Required validation for each change:
  - Run `npm run build` (must pass).
  - Run `npm run preview` and verify key sections render correctly.
  - For content changes, confirm every placeholder has a matching unique `@id` block in `content/*.md`.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat: ...`, `refactor(html): ...`, `style(typography): ...`, `ci: ...`.
- Keep commits scoped to one logical change.
- PRs should include:
  - concise summary of user-visible impact,
  - linked issue/task when available,
  - screenshots for layout/typography/UI updates,
  - confirmation that `npm run build` succeeded.
