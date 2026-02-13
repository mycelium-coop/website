import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const CONTENT_MARKER_RE = /<!--\s*@id:\s*([a-zA-Z0-9_-]+)\s*-->/g;
const BLOCK_PLACEHOLDER_RE = /{{{\s*([a-zA-Z0-9_-]+)\s*}}}/g;
const INLINE_PLACEHOLDER_RE = /{{(?!{)\s*([a-zA-Z0-9_-]+)\s*}}/g;

function parseContentBlocks(markdownSource, sourcePath) {
  const contentMap = new Map();
  let markerMatch = CONTENT_MARKER_RE.exec(markdownSource);

  if (!markerMatch) {
    return contentMap;
  }

  let currentId = markerMatch[1];
  let sectionStart = CONTENT_MARKER_RE.lastIndex;

  markerMatch = CONTENT_MARKER_RE.exec(markdownSource);
  while (markerMatch) {
    const sectionEnd = markerMatch.index;
    const sectionContent = markdownSource.slice(sectionStart, sectionEnd).trim();

    if (!sectionContent) {
      throw new Error(
        `Content block "${currentId}" in ${sourcePath} is empty.`,
      );
    }

    contentMap.set(currentId, sectionContent);
    currentId = markerMatch[1];
    sectionStart = CONTENT_MARKER_RE.lastIndex;
    markerMatch = CONTENT_MARKER_RE.exec(markdownSource);
  }

  const finalContent = markdownSource.slice(sectionStart).trim();
  if (!finalContent) {
    throw new Error(`Content block "${currentId}" in ${sourcePath} is empty.`);
  }

  contentMap.set(currentId, finalContent);
  return contentMap;
}

function readAllContentBlocks(contentDir) {
  if (!fs.existsSync(contentDir)) {
    throw new Error(`Content directory does not exist: ${contentDir}`);
  }

  const mdFiles = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(contentDir, entry.name))
    .sort();

  const mergedMap = new Map();

  for (const filePath of mdFiles) {
    CONTENT_MARKER_RE.lastIndex = 0;
    const source = fs.readFileSync(filePath, "utf8");
    const fileMap = parseContentBlocks(source, filePath);

    for (const [key, value] of fileMap) {
      if (mergedMap.has(key)) {
        throw new Error(
          `Duplicate content id "${key}" found in ${filePath}.`,
        );
      }

      mergedMap.set(key, value);
    }
  }

  return mergedMap;
}

function resolveContentValue(contentMap, key) {
  const value = contentMap.get(key);
  if (value === undefined) {
    throw new Error(
      `Missing content for placeholder "${key}". Add it to a file in content/.`,
    );
  }

  return value;
}

function isContentFile(filePath, contentDir) {
  const normalizedDir = `${path.resolve(contentDir)}${path.sep}`;
  const normalizedPath = path.resolve(filePath);
  return normalizedPath.startsWith(normalizedDir) && normalizedPath.endsWith(".md");
}

export default function contentPlugin(options = {}) {
  const contentDir = options.contentDir
    ? path.resolve(options.contentDir)
    : path.resolve(process.cwd(), "content");

  return {
    name: "vite-plugin-content",
    configureServer(server) {
      server.watcher.add(contentDir);

      const onContentChange = (filePath) => {
        if (isContentFile(filePath, contentDir)) {
          server.ws.send({ type: "full-reload" });
        }
      };

      server.watcher.on("add", onContentChange);
      server.watcher.on("change", onContentChange);
      server.watcher.on("unlink", onContentChange);
    },
    transformIndexHtml(html) {
      const contentMap = readAllContentBlocks(contentDir);

      const withBlockContent = html.replace(
        BLOCK_PLACEHOLDER_RE,
        (_match, key) => marked.parse(resolveContentValue(contentMap, key)),
      );

      return withBlockContent.replace(
        INLINE_PLACEHOLDER_RE,
        (_match, key) =>
          marked.parseInline(resolveContentValue(contentMap, key)),
      );
    },
  };
}
