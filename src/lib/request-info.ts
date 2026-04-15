/**
 * Tiny helpers for extracting a client IP + a friendly device label from
 * an incoming Request's headers. No external dependencies — the UA parsing
 * covers the common cases (Chrome/Safari/Firefox/Edge + macOS/Windows/iOS/
 * Android/Linux) and falls back to the raw UA string for anything unusual.
 */

export function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Vercel / most proxies put the real client IP first
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// Cap UA length so an attacker can't balloon the activity log row by
// sending a 1 MB user-agent header. 400 chars is well above any real
// browser UA string (~200 chars typical).
const MAX_UA_LENGTH = 400;

export function getUserAgent(req: Request): string {
  const raw = req.headers.get("user-agent") ?? "unknown";
  return raw.length > MAX_UA_LENGTH ? raw.slice(0, MAX_UA_LENGTH) : raw;
}

/** Derive a friendly "Browser on OS" label from a user-agent string. */
export function parseDeviceLabel(ua: string): string {
  if (!ua || ua === "unknown") return "알 수 없음";

  // OS detection (order matters — iOS before macOS, Android before Linux)
  let os = "Unknown OS";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/Windows NT/.test(ua)) os = "Windows";
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Linux/.test(ua)) os = "Linux";

  // Browser detection (order matters — Edge before Chrome, Chrome before Safari)
  let browser = "Unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari";

  return `${browser} · ${os}`;
}
