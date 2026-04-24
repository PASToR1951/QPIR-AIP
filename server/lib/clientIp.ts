import type { Context } from "hono";

export const INTERNAL_REMOTE_ADDR_HEADER = "x-aip-pir-remote-addr";

type HeaderReader = (name: string) => string | undefined;

type ResolveClientIpOptions = {
  headers: HeaderReader;
  remoteAddress?: string | null;
  trustProxy?: boolean;
  trustedProxyCidrs?: string;
};

function envFlag(name: string): boolean {
  return ["1", "true", "yes", "on"].includes(
    (Deno.env.get(name) ?? "").trim().toLowerCase(),
  );
}

function trustedProxyCidrsFromEnv(): string {
  return Deno.env.get("TRUSTED_PROXY_CIDRS") ?? "";
}

function normalizeIp(value: string | null | undefined): string | null {
  let ip = (value ?? "").trim();
  if (!ip) return null;

  if (ip.startsWith('"') && ip.endsWith('"')) ip = ip.slice(1, -1);
  if (ip.startsWith("[")) {
    const close = ip.indexOf("]");
    if (close <= 1) return null;
    const inner = ip.slice(1, close).trim();
    return inner.length > 0 ? inner : null;
  }

  const ipv4WithPort = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  if (ipv4WithPort) return ipv4WithPort[1];

  return ip;
}

function ipv4ToInt(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    result = (result << 8) + octet;
  }
  return result >>> 0;
}

function ipv4MatchesCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split("/");
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  const bits = Number(bitsRaw);
  if (ipInt === null || rangeInt === null) return false;
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function ipMatchesTrustedEntry(ip: string, entry: string): boolean {
  const trusted = normalizeIp(entry);
  if (!trusted) return false;
  if (!trusted.includes("/")) return ip === trusted;

  const [range, bitsRaw] = trusted.split("/");
  if (ip.includes(":")) {
    return bitsRaw === "128" && ip === normalizeIp(range);
  }
  return ipv4MatchesCidr(ip, trusted);
}

export function isTrustedProxy(
  remoteAddress: string | null | undefined,
  trustedProxyCidrs = trustedProxyCidrsFromEnv(),
): boolean {
  const ip = normalizeIp(remoteAddress);
  if (!ip) return false;
  return trustedProxyCidrs
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => ipMatchesTrustedEntry(ip, entry));
}

function forwardedFor(headers: HeaderReader): string | null {
  const forwarded = headers("forwarded");
  if (forwarded) {
    const first = forwarded.split(",")[0] ?? "";
    const match = first.match(/(?:^|;)\s*for=([^;]+)/i);
    const normalized = normalizeIp(match?.[1]);
    if (normalized) return normalized;
  }

  const xForwardedFor = headers("x-forwarded-for");
  const fromXForwardedFor = normalizeIp(xForwardedFor?.split(",")[0]);
  if (fromXForwardedFor) return fromXForwardedFor;

  return normalizeIp(headers("x-real-ip"));
}

export function resolveClientIp({
  headers,
  remoteAddress,
  trustProxy = envFlag("TRUST_PROXY"),
  trustedProxyCidrs = trustedProxyCidrsFromEnv(),
}: ResolveClientIpOptions): string | null {
  const remoteIp = normalizeIp(remoteAddress);
  if (!trustProxy || !isTrustedProxy(remoteIp, trustedProxyCidrs)) {
    return remoteIp;
  }

  return forwardedFor(headers) ?? remoteIp;
}

export function getClientIp(c: Context): string | null {
  return resolveClientIp({
    headers: (name) => c.req.header(name),
    remoteAddress: c.req.header(INTERNAL_REMOTE_ADDR_HEADER),
  });
}

export function isPrivateIp(ip: string | null | undefined): boolean {
  const normalized = normalizeIp(ip);
  if (!normalized) return false;
  return normalized === "::1" ||
    /^127\./.test(normalized) ||
    /^10\./.test(normalized) ||
    /^192\.168\./.test(normalized) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized) ||
    /^::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      normalized,
    );
}

export function shouldBypassRecaptchaForPrivateIp(
  ip: string | null,
  bypassPrivateIps = envFlag("RECAPTCHA_BYPASS_PRIVATE_IPS"),
): boolean {
  return bypassPrivateIps && isPrivateIp(ip);
}
