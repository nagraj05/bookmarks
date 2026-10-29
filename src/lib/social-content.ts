export const SOCIAL_POST_SOURCES = ['instagram', 'x', 'substack', 'tumblr', 'linkedin', 'threads'] as const;

export type SocialPostSource = (typeof SOCIAL_POST_SOURCES)[number];

const SOURCE_LABELS: Record<SocialPostSource, string> = {
  instagram: 'Instagram',
  x: 'X',
  substack: 'Substack',
  tumblr: 'Tumblr',
  linkedin: 'LinkedIn',
  threads: 'Threads',
};

function decodeCodePoint(fallback: string, value: string, radix: number) {
  const codePoint = Number.parseInt(value, radix);
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : fallback;
}

export function decodeTextEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x([\da-f]+);/gi, (match, code: string) => decodeCodePoint(match, code, 16))
    .replace(/&#(\d+);/g, (match, code: string) => decodeCodePoint(match, code, 10))
    .replace(/\\u\{([\da-f]{1,6})\}/gi, (match, code: string) => decodeCodePoint(match, code, 16))
    .replace(
      /\\u([\da-f]{4})\\u([\da-f]{4})/gi,
      (match, highValue: string, lowValue: string) => {
        const high = Number.parseInt(highValue, 16);
        const low = Number.parseInt(lowValue, 16);
        if (high < 0xd800 || high > 0xdbff || low < 0xdc00 || low > 0xdfff) return match;
        return String.fromCodePoint((high - 0xd800) * 0x400 + low - 0xdc00 + 0x10000);
      },
    )
    .replace(/\\u([\da-f]{4})/gi, (match, code: string) => decodeCodePoint(match, code, 16));
}

export function isSocialPostSource(source: string): source is SocialPostSource {
  return SOCIAL_POST_SOURCES.includes(source as SocialPostSource);
}

export function socialSourceFromUrl(url: string): SocialPostSource | null {
  try {
    const domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (domain === 'instagram.com' || domain.endsWith('.instagram.com')) return 'instagram';
    if (domain === 'x.com' || domain.endsWith('.x.com') || domain === 'twitter.com' || domain.endsWith('.twitter.com')) return 'x';
    if (domain === 'substack.com' || domain.endsWith('.substack.com')) return 'substack';
    if (domain === 'tumblr.com' || domain.endsWith('.tumblr.com')) return 'tumblr';
    if (domain === 'linkedin.com' || domain.endsWith('.linkedin.com') || domain === 'lnkd.in') return 'linkedin';
    if (
      domain === 'threads.net' ||
      domain.endsWith('.threads.net') ||
      domain === 'threads.com' ||
      domain.endsWith('.threads.com')
    ) return 'threads';
  } catch {
    // Invalid URLs are handled by the caller.
  }
  return null;
}

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripOuterQuotes(value: string) {
  return value.replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim();
}

function cleanPostText(value: string, source: SocialPostSource) {
  let text = cleanWhitespace(decodeTextEntities(value));

  const attribution = text.match(/\bon (?:Instagram|Threads|X|Twitter|Tumblr|LinkedIn)\s*:\s*(.+)$/i);
  if (attribution?.[1]) text = attribution[1];

  const firstQuote = text.search(/["“]/);
  const lastStraightQuote = text.lastIndexOf('"');
  const lastCurlyQuote = text.lastIndexOf('”');
  const lastQuote = Math.max(lastStraightQuote, lastCurlyQuote);
  if (firstQuote >= 0 && lastQuote > firstQuote) {
    text = text.slice(firstQuote + 1, lastQuote);
  }

  text = stripOuterQuotes(text)
    .replace(/\s+(?:[|/]\s*)?(?:Instagram|Threads|X|Twitter|Tumblr|LinkedIn)\s*$/i, '')
    .replace(/\s+[|·]\s+(?:Instagram|Threads|X|Twitter|Tumblr|LinkedIn)\s*$/i, '')
    .trim();

  if (source === 'substack') {
    text = text.replace(/\s+-\s+by\s+.+$/i, '').trim();
  }

  return text;
}

function isAttributionOnly(value: string) {
  return (
    /\bon (?:Instagram|Threads|X|Twitter|Tumblr|LinkedIn)\s*$/i.test(value) ||
    /^(?:Instagram|Threads|X|Twitter|Tumblr|LinkedIn)(?: post)?$/i.test(value) ||
    /^(?:See|View) (?:photos|posts|profile|content)\b/i.test(value)
  );
}

export function getSocialPostText(
  source: SocialPostSource,
  title?: string | null,
  description?: string | null,
) {
  const values = [description, title];

  for (const value of values) {
    if (!value) continue;
    const text = cleanPostText(value, source);
    if (text && !isAttributionOnly(text)) return text;
  }

  return `${SOURCE_LABELS[source]} post`;
}
