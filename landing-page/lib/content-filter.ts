// Content filtering and moderation utilities

const BLOCKED_WORDS = [
  // Add offensive words here
  // This is a basic example - use a proper profanity filter service in production
  "spam",
  "scam",
];

const SUSPICIOUS_PATTERNS = [
  /\b(?:https?:\/\/|www\.)[^\s]+/gi, // URLs (except in allowed contexts)
  /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi, // Email addresses
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
];

export interface ContentCheckResult {
  isClean: boolean;
  reason?: string;
  severity?: "low" | "medium" | "high";
}

export function checkContent(content: string): ContentCheckResult {
  const lowerContent = content.toLowerCase();

  // Check for blocked words
  for (const word of BLOCKED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      return {
        isClean: false,
        reason: "Contains prohibited content",
        severity: "high",
      };
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isClean: false,
        reason: "Contains suspicious patterns (URLs/emails/phone numbers)",
        severity: "medium",
      };
    }
  }

  // Check for excessive caps
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  if (capsCount > content.length * 0.5 && content.length > 20) {
    return {
      isClean: false,
      reason: "Excessive use of capital letters",
      severity: "low",
    };
  }

  // Check for repeated characters
  if (/(.)\1{10,}/.test(content)) {
    return {
      isClean: false,
      reason: "Contains spam-like repeated characters",
      severity: "medium",
    };
  }

  return { isClean: true };
}

export function sanitizeUsername(username: string): string {
  // Remove special characters except underscores and hyphens
  return username.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30);
}

export function sanitizeText(text: string, maxLength: number = 1000): string {
  // Remove control characters and trim
  return text
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

