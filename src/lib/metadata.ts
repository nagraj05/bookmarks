import { decodeTextEntities, getSocialPostText, socialSourceFromUrl } from '@/lib/social-content';

type LinkMetadata = {
  title?: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
};

function decodeEntities(value: string) {
  return decodeTextEntities(value);
}

function stripHtml(value: string) {
  return decodeEntities(value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
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

async function fetchXPostText(url: string, signal: AbortSignal) {
  try {
    const endpoint = `https://publish.twitter.com/oembed?omit_script=true&dnt=true&url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { html?: string };
    const paragraph = payload.html?.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];
    return paragraph ? stripHtml(paragraph) : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const metadata: LinkMetadata = {};
    const source = socialSourceFromUrl(url);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
        signal: controller.signal,
      });
      const contentType = response.headers.get('content-type') ?? '';

      if (response.ok && contentType.includes('text/html')) {
        const html = (await response.text()).slice(0, 500_000);
        const pageUrl = response.url || url;
        const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
        const icon = html.match(
          /<link[^>]+rel=["'][^"']*(?:icon|shortcut icon)[^"']*["'][^>]+href=["']([^"']+)["']/i,
        )?.[1];

        metadata.title =
          readMeta(html, ['og:title', 'twitter:title']) ??
          (titleTag ? decodeEntities(titleTag.trim()) : undefined);
        metadata.description = readMeta(html, ['og:description', 'twitter:description', 'description']);
        metadata.imageUrl = absoluteUrl(readMeta(html, ['og:image', 'twitter:image']), pageUrl);
        metadata.faviconUrl = absoluteUrl(icon, pageUrl) ?? absoluteUrl('/favicon.ico', pageUrl);
      }
    } catch {
      // Some social sites block page requests. Their platform fallback can still provide text.
    }

    if (source === 'x') {
      const postText = await fetchXPostText(url, controller.signal);
      if (postText) metadata.description = postText;
    }

    if (source) {
      metadata.title = getSocialPostText(source, metadata.title, metadata.description);
    }

    return metadata;
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
