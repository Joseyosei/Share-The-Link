/**
 * Content Moderation Utility
 * Blocks adult content URLs and inappropriate text.
 */

// Known adult/NSFW domain patterns
const BLOCKED_DOMAINS = [
  "pornhub", "xvideos", "xnxx", "redtube", "youporn", "tube8", "xhamster",
  "brazzers", "bangbros", "naughtyamerica", "realitykings", "mofos",
  "onlyfans", "fansly", "manyvids", "chaturbate", "stripchat", "bongacams",
  "livejasmin", "cam4", "myfreecams", "camsoda", "flirt4free",
  "backpage", "bedpage", "escort", "adultfriendfinder", "ashley-madison",
  "ashleymadison", "seeking", "sugardaddy",
  "xxxvideos", "xxx", "porn", "hentai", "rule34", "e621", "gelbooru",
  "nhentai", "hanime", "spankbang", "eporner", "tnaflix", "drtuber",
  "4tube", "sunporno", "txxx", "hdzog", "hclips",
];

// Blocked keywords in link titles/descriptions
const BLOCKED_KEYWORDS = [
  "porn", "xxx", "nsfw", "onlyfans", "adult content", "18+", "explicit",
  "nude", "nudes", "naked", "sex tape", "escort service", "cam girl",
  "cam boy", "strip show", "adult entertainment", "hookup",
];

/**
 * Check if a URL contains adult/NSFW content
 */
export function isBlockedUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return BLOCKED_DOMAINS.some((domain) => lower.includes(domain));
}

/**
 * Check if text contains adult/NSFW keywords
 */
export function isBlockedText(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Validate a link for adult content -- returns error message or null if clean
 */
export function validateLinkContent(title: string, url: string): string | null {
  if (isBlockedUrl(url)) {
    return "This URL contains content that violates our community guidelines. Adult and explicit content is not allowed.";
  }
  if (isBlockedText(title)) {
    return "This link title contains language that violates our community guidelines. Please use appropriate titles.";
  }
  return null;
}

/**
 * Validate stream content
 */
export function validateStreamContent(title: string, description?: string): string | null {
  if (isBlockedText(title)) {
    return "This stream title violates our community guidelines. Adult content is not allowed.";
  }
  if (description && isBlockedText(description)) {
    return "This stream description violates our community guidelines.";
  }
  return null;
}

/**
 * Validate chat message
 */
export function validateChatMessage(message: string): string | null {
  if (isBlockedText(message)) {
    return "This message contains content that violates our community guidelines.";
  }
  return null;
}
