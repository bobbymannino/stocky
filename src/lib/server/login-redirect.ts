/** The sign-in page, remembering `url` so the user (and link previews) land back there. */
export function loginUrl(url: URL): string {
  const to = url.pathname + url.search;
  return to === "/" ? "/login" : `/login?redirectTo=${encodeURIComponent(to)}`;
}

/**
 * `value` if it's a path within this app, otherwise `/`. It comes from the
 * query string, so anything pointing at another site (`//evil.com`,
 * `https://…`, `/\evil.com`) must never be followed.
 */
export function safeRedirectTo(value: string | null | undefined): string {
  if (!value?.startsWith("/")) return "/";
  const base = "http://stocky.invalid";
  try {
    const target = new URL(value, base);
    if (target.origin !== base) return "/";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/";
  }
}
