type LinkMetadata = {
  title?: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
};

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function readMeta(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeEntities(match[1].trim());
    }
  }
}

function absoluteUrl(value: string | undefined, baseUrl: string) {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('text/html')) return {};

    const html = (await response.text()).slice(0, 500_000);
    const pageUrl = response.url || url;
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const icon = html.match(/<link[^>]+rel=["'][^"']*(?:icon|shortcut icon)[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1];

    return {
      title: readMeta(html, ['og:title', 'twitter:title']) ?? (titleTag ? decodeEntities(titleTag.trim()) : undefined),
      description: readMeta(html, ['og:description', 'twitter:description', 'description']),
      imageUrl: absoluteUrl(readMeta(html, ['og:image', 'twitter:image']), pageUrl),
      faviconUrl: absoluteUrl(icon, pageUrl) ?? absoluteUrl('/favicon.ico', pageUrl),
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

export function extractFirstUrl(value: string) {
  const match = value.match(/https?:\/\/[^\s<>"']+/i);
  return match?.[0]?.replace(/[),.;!?]+$/, '') ?? null;
}
