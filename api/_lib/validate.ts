/**
 * Input validation and sanitization utilities.
 * Prevents injection attacks and ensures data integrity.
 */

/**
 * Sanitize a string: trim whitespace, strip HTML tags, enforce max length.
 */
export function sanitizeString(input: unknown, maxLength: number = 500): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>]/g, "")    // Remove any remaining angle brackets
    .slice(0, maxLength);
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate a UUID format (Supabase user IDs).
 */
export function isValidUUID(id: unknown): id is string {
  if (typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate a Stripe ID format (starts with a known prefix).
 */
export function isValidStripeId(id: unknown, prefix: string = ""): id is string {
  if (typeof id !== "string") return false;
  if (id.length > 255) return false;
  if (prefix && !id.startsWith(prefix)) return false;
  // Stripe IDs are alphanumeric with underscores
  return /^[a-zA-Z0-9_]+$/.test(id);
}

/**
 * Validate a URL format.
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validate that a value is one of the allowed values.
 */
export function isOneOf<T>(value: unknown, allowed: T[]): value is T {
  return allowed.includes(value as T);
}

/**
 * Validate that a value is a positive integer.
 */
export function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Reject request with a 400 Bad Request.
 */
export function badRequest(res: any, message: string = "Invalid input") {
  return res.status(400).json({ error: message });
}

// Aliases for backward compatibility
export const sanitize = sanitizeString;
export const isUuid = isValidUUID;
