import "./fonts.js";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/layout.css";
import "./styles/typography.css";
import "./styles/controls.css";
import { marked } from "marked";
import teamMarkdown from "../content/team.md?raw";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "hello@mycelium.coop";
const CONTACT_FORM_ENDPOINT = import.meta.env.VITE_CONTACT_FORM_ENDPOINT || "";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

const CONTENT_TOKEN_RE = /<!--\s*@id:\s*([a-zA-Z0-9_-]+)\s*-->|<!--|-->/g;
const TEAM_FIELD_RE = /^team-(\d+)-(name|role|image|bio)$/;
const MOBILE_NAV_BREAKPOINT = 980;
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileWidgetId = null;
let turnstileToken = "";

function parseContentBlocks(markdownSource) {
  const map = new Map();
  const markers = [];
  const topLevelCommentStarts = [];
  let commentDepth = 0;

  CONTENT_TOKEN_RE.lastIndex = 0;
  let tokenMatch = CONTENT_TOKEN_RE.exec(markdownSource);
  while (tokenMatch) {
    const [token, markerId] = tokenMatch;

    if (markerId) {
      if (commentDepth === 0) {
        markers.push({
          id: markerId,
          markerIndex: tokenMatch.index,
          contentStart: CONTENT_TOKEN_RE.lastIndex,
        });
      }
    } else if (token === "<!--") {
      if (commentDepth === 0) {
        topLevelCommentStarts.push(tokenMatch.index);
      }
      commentDepth += 1;
    } else if (token === "-->") {
      commentDepth = Math.max(0, commentDepth - 1);
    }

    tokenMatch = CONTENT_TOKEN_RE.exec(markdownSource);
  }

  if (!markers.length) {
    return map;
  }

  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const nextMarker = markers[index + 1];
    const nextMarkerIndex = nextMarker ? nextMarker.markerIndex : markdownSource.length;
    const nextTopLevelCommentIndex = topLevelCommentStarts.find((commentIndex) => (
      commentIndex >= marker.contentStart && commentIndex < nextMarkerIndex
    ));
    const contentEnd = nextTopLevelCommentIndex ?? nextMarkerIndex;
    map.set(marker.id, markdownSource.slice(marker.contentStart, contentEnd).trim());
  }

  return map;
}

function isCommentWrappedValue(value) {
  return /^\s*<!--[\s\S]*-->\s*$/.test(value);
}

function collectTeamMembers(teamSource) {
  const blocks = parseContentBlocks(teamSource);
  const membersByIndex = new Map();

  for (const [key, rawValue] of blocks) {
    const match = TEAM_FIELD_RE.exec(key);
    if (!match) {
      continue;
    }

    const index = Number(match[1]);
    const field = match[2];
    const value = rawValue.trim();

    if (!membersByIndex.has(index)) {
      membersByIndex.set(index, { index });
    }

    membersByIndex.get(index)[field] = value;
  }

  return [...membersByIndex.values()]
    .sort((a, b) => a.index - b.index)
    .filter((member) => (
      typeof member.name === "string" &&
      typeof member.role === "string" &&
      typeof member.bio === "string"
    ))
    .filter((member) => (
      member.name &&
      member.role &&
      member.bio &&
      !isCommentWrappedValue(member.name) &&
      !isCommentWrappedValue(member.role) &&
      !isCommentWrappedValue(member.bio)
    ));
}

function applyCompactLogos() {
  document.querySelectorAll("[data-logo-compact]").forEach((node) => {
    const text = node.textContent?.trim() || "";
    if (!text) {
      return;
    }

    const firstWord = text.split(/\s+/)[0];
    if (firstWord) {
      node.textContent = firstWord;
    }
  });
}

function imageKitUrlWithTransform(url, transform) {
  try {
    const parsed = new URL(url);
    const existingTransform = parsed.searchParams.get("tr");
    parsed.searchParams.set(
      "tr",
      existingTransform ? `${existingTransform},${transform}` : transform,
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

function buildImageKitSrcSet(url) {
  const widths = [360, 540, 720, 900];
  const srcset = widths
    .map((width) => (
      `${imageKitUrlWithTransform(url, `w-${width},f-auto,q-80`)} ${width}w`
    ))
    .join(", ");

  const src = imageKitUrlWithTransform(url, "w-720,f-auto,q-80");
  return { src, srcset };
}

function renderTeamBioHtml(markdown) {
  return marked.parse(markdown);
}

function renderTeamCards() {
  const teamList = document.getElementById("teamList");
  if (!teamList) {
    return;
  }

  const members = collectTeamMembers(teamMarkdown);
  if (!members.length) {
    teamList.innerHTML = "<p class=\"team-card__empty\">No team members found in content/team.md.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const member of members) {
    const card = document.createElement("article");
    card.className = "team-card";

    const media = document.createElement("div");
    media.className = "team-card__media";

    if (member.image && /^https?:\/\//i.test(member.image)) {
      const img = document.createElement("img");
      const { src, srcset } = buildImageKitSrcSet(member.image);
      img.src = src;
      img.srcset = srcset;
      img.sizes = "(max-width: 720px) 100vw, (max-width: 980px) 80vw, 360px";
      img.alt = `${member.name} profile photo`;
      img.loading = "lazy";
      img.decoding = "async";
      media.append(img);
    }

    const body = document.createElement("div");
    body.className = "team-card__body";

    const name = document.createElement("h3");
    name.className = "team-card__name";
    name.textContent = member.name;

    const role = document.createElement("p");
    role.className = "team-card__role";
    role.textContent = member.role;

    const divider = document.createElement("div");
    divider.className = "team-card__divider";
    divider.setAttribute("aria-hidden", "true");

    const bio = document.createElement("div");
    bio.className = "team-card__bio";
    bio.innerHTML = renderTeamBioHtml(member.bio);

    body.append(name, role, divider, bio);
    card.append(media, body);
    fragment.append(card);
  }

  teamList.replaceChildren(fragment);
}

function setContactEmailBindings() {
  const recipientInput = document.getElementById("contactRecipient");
  if (recipientInput) {
    recipientInput.value = CONTACT_EMAIL;
  }

  document.querySelectorAll("[data-contact-email-link]").forEach((node) => {
    node.setAttribute("href", `mailto:${CONTACT_EMAIL}`);
  });
}

function setFormStatus(message, state = "") {
  const statusEl = document.getElementById("contactStatus");
  if (!statusEl) {
    return;
  }

  statusEl.textContent = message;
  if (state) {
    statusEl.dataset.state = state;
  } else {
    delete statusEl.dataset.state;
  }
}

function setSubmitLoading(isLoading) {
  const submitButton = document.getElementById("contactSubmit");
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isLoading;
  submitButton.classList.toggle("is-loading", isLoading);
}

function getTurnstileSize() {
  return window.matchMedia("(max-width: 720px)").matches ? "flexible" : "normal";
}

function setTurnstileNote(message = "") {
  const note = document.getElementById("turnstileNote");
  if (!note) {
    return;
  }

  note.textContent = message;
}

function ensureTurnstileScript() {
  const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
  if (existing) {
    if (window.turnstile) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile.")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile."));
    document.head.append(script);
  });
}

async function mountTurnstile() {
  const mount = document.getElementById("turnstileMount");
  if (!mount) {
    return;
  }

  if (!TURNSTILE_SITE_KEY) {
    mount.dataset.placeholder = "true";
    mount.textContent = "Cloudflare Turnstile will render here when VITE_TURNSTILE_SITE_KEY is configured.";
    setTurnstileNote("Turnstile site key not configured yet.");
    return;
  }

  setTurnstileNote("");

  try {
    await ensureTurnstileScript();
  } catch (error) {
    mount.dataset.placeholder = "true";
    mount.textContent = "Unable to load Cloudflare Turnstile.";
    setTurnstileNote(error instanceof Error ? error.message : "Turnstile failed to load.");
    return;
  }

  if (!window.turnstile) {
    mount.dataset.placeholder = "true";
    mount.textContent = "Cloudflare Turnstile API unavailable.";
    setTurnstileNote("Turnstile API did not initialize.");
    return;
  }

  delete mount.dataset.placeholder;
  mount.textContent = "";

  turnstileWidgetId = window.turnstile.render(mount, {
    sitekey: TURNSTILE_SITE_KEY,
    theme: "light",
    size: getTurnstileSize(),
    action: "contact_form",
    callback: (token) => {
      turnstileToken = token;
      setTurnstileNote("");
      setFormStatus("");
    },
    "error-callback": () => {
      turnstileToken = "";
      setTurnstileNote("Captcha error. Please retry.");
    },
    "expired-callback": () => {
      turnstileToken = "";
      setTurnstileNote("Captcha expired. Please complete it again.");
    },
  });
}

function resetTurnstileIfPresent() {
  if (!window.turnstile || !turnstileWidgetId) {
    turnstileToken = "";
    return;
  }

  window.turnstile.reset(turnstileWidgetId);
  turnstileToken = "";
}

function getTurnstileToken() {
  const hiddenField = document.querySelector("input[name='cf-turnstile-response']");
  if (hiddenField instanceof HTMLInputElement && hiddenField.value) {
    return hiddenField.value;
  }

  if (window.turnstile && turnstileWidgetId) {
    return window.turnstile.getResponse(turnstileWidgetId) || "";
  }

  return turnstileToken;
}

function serializeContactForm(form) {
  const formData = new FormData(form);
  return {
    to: CONTACT_EMAIL,
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    organization: String(formData.get("organization") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    turnstileToken: getTurnstileToken(),
    pageUrl: window.location.href,
    submittedAt: new Date().toISOString(),
  };
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormStatus("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!CONTACT_FORM_ENDPOINT) {
      setFormStatus("Missing VITE_CONTACT_FORM_ENDPOINT configuration.", "error");
      return;
    }

    if (TURNSTILE_SITE_KEY && !getTurnstileToken()) {
      setFormStatus("Please complete the captcha before sending your message.", "error");
      return;
    }

    const payload = serializeContactForm(form);
    setSubmitLoading(true);
    setFormStatus("Sending message...");

    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let detail = "";
        try {
          detail = await response.text();
        } catch {
          detail = "";
        }

        throw new Error(
          detail ? `Request failed (${response.status}): ${detail}` : `Request failed (${response.status}).`,
        );
      }

      form.reset();
      resetTurnstileIfPresent();
      setFormStatus("Thanks for reaching out. Your message has been sent.", "success");
    } catch (error) {
      setFormStatus(
        error instanceof Error ? error.message : "Failed to send message. Please try again.",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  });
}

function setupResponsiveTurnstileResize() {
  const mediaQuery = window.matchMedia("(max-width: 720px)");
  mediaQuery.addEventListener("change", () => {
    if (!window.turnstile || !turnstileWidgetId) {
      return;
    }

    const mount = document.getElementById("turnstileMount");
    if (!mount) {
      return;
    }

    window.turnstile.remove(turnstileWidgetId);
    turnstileWidgetId = null;
    turnstileToken = "";
    mountTurnstile();
  });
}

function closeMobileNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.getElementById("navToggle");
  if (!header || !toggle) {
    return;
  }

  header.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
}

function setupNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  if (!header || !toggle || !menu) {
    return;
  }

  toggle.addEventListener("click", () => {
    const willOpen = !header.classList.contains("is-open");
    header.classList.toggle("is-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= MOBILE_NAV_BREAKPOINT) {
        closeMobileNav();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_NAV_BREAKPOINT) {
      closeMobileNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileNav();
    }
  });
}

function init() {
  applyCompactLogos();
  setupNavigation();
  renderTeamCards();
  setContactEmailBindings();
  setupContactForm();
  mountTurnstile();
  setupResponsiveTurnstileResize();
}

init();
