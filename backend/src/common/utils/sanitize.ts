import sanitizeHtml from "sanitize-html";

export function sanitizeRichHtml(value: unknown) {
  if (typeof value !== "string") return value;
  return sanitizeHtml(value, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "video", "source", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "span", "div", "iframe"]),
    allowedAttributes: {
      "*": ["class", "id", "title", "aria-label", "style"],
      // data-* wildcard is intentionally omitted — it allows Alpine.js/Vue/Stimulus
      // directive injection (e.g. x-on:click, data-controller) which causes XSS (V-3 fix).
      div: ["class", "id", "title", "aria-label", "data-categories", "data-headingsize", "data-tabs", "data-cat-*"],
      figure: ["class", "id"],
      h1: ["class", "id"],
      h2: ["class", "id"],
      h3: ["class", "id"],
      h4: ["class", "id"],
      h5: ["class", "id"],
      h6: ["class", "id"],
      p: ["class", "id"],
      span: ["class", "id"],
      a: ["href", "name", "target", "rel", "class", "title"],
      img: ["src", "alt", "width", "height", "loading", "class", "title"],
      video: ["src", "controls", "poster", "class", "autoplay", "loop", "muted", "playsinline"],
      source: ["src", "type"],
      iframe: ["src", "frameborder", "allowfullscreen", "class", "allow"],
      table: ["class", "id"],
      td: ["colspan", "rowspan", "class"],
      th: ["colspan", "rowspan", "scope", "class"],
      tr: ["class", "data-cat"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ["youtube.com", "www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({ tagName: "a", attribs: { ...attribs, rel: "noopener noreferrer" } }),
    },
  });
}

export function sanitizeRichCss(value: unknown) {
  if (typeof value !== "string") return value;
  return value
    .replace(/<\/?style[^>]*>/gi, "")
    .replace(/@import\b[^;]*;?/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/url\s*\(\s*['\"]?\s*(?:javascript|vbscript|data):/gi, "url(")
    .replace(/behavior\s*:/gi, "")
    .slice(0, 100_000);
}
