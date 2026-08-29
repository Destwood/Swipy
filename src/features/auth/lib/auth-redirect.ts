function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function originFromEnvUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/\/$/, "");
  try {
    const parsed = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );
    if (isLocalHost(parsed.hostname)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function publicAppOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (process.env.NODE_ENV !== "development") {
    if (forwardedHost && !isLocalHost(forwardedHost)) {
      const proto = forwardedProto === "http" ? "http" : "https";
      return `${proto}://${forwardedHost}`;
    }
    if (!isLocalHost(url.hostname)) {
      return url.origin;
    }
    const siteUrl = originFromEnvUrl(process.env.NEXT_PUBLIC_SITE_URL);
    if (siteUrl) return siteUrl;
    const vercelHost = (
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_URL ??
      ""
    ).replace(/^https?:\/\//, "");
    if (vercelHost && !isLocalHost(vercelHost)) {
      return `https://${vercelHost}`;
    }
  }

  return url.origin;
}

export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return "/";
  }
  return next;
}

export function oauthCallbackUrl(next?: string | null) {
  const url = new URL(`${window.location.origin}/auth/callback`);
  if (next) {
    const safe = safeNextPath(next);
    if (safe !== "/") url.searchParams.set("next", safe);
  }
  return url.toString();
}
