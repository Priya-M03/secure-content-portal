const allowed = {
  VIDEO: ["video/mp4", "video/webm"],
  PDF: ["application/pdf"],
  HTML: ["text/html"]
} as const;

export function isAllowedMime(type: keyof typeof allowed, mime: string) {
  return (allowed[type] as readonly string[]).includes(mime);
}

export function sanitizeText(value: string, max: number) {
  return value.replace(/[<>]/g, "").trim().slice(0, max);
}
