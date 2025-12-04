import { z } from "zod";
import { sanitizeText } from "./content-filter";

// Game visibility validation
export const visibilitySchema = z.enum(["private", "unlisted", "public"]);
export type Visibility = z.infer<typeof visibilitySchema>;

// Title validation - sanitized and length-checked
export const titleSchema = z.string()
  .min(2, "Title must be at least 2 characters")
  .max(100, "Title must not exceed 100 characters")
  .transform(val => sanitizeText(val, 100));

// Description validation - sanitized and length-checked
export const descriptionSchema = z.string()
  .min(10, "Description must be at least 10 characters")
  .max(500, "Description must not exceed 500 characters")
  .transform(val => sanitizeText(val, 500));

// Game ID validation (UUID format)
export const gameIdSchema = z.string().uuid("Invalid game ID format");

// Language validation
export const languageSchema = z.enum(["python", "javascript"], {
  errorMap: () => ({ message: "Language must be 'python' or 'javascript'" })
});

// Slug validation
export const slugSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

/**
 * Validate request body size
 * @param request Request object
 * @param maxSizeKB Maximum size in KB
 * @returns true if valid, false if too large
 */
export async function validateRequestSize(request: Request, maxSizeKB: number = 100): Promise<boolean> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const sizeKB = parseInt(contentLength) / 1024;
    return sizeKB <= maxSizeKB;
  }
  return true; // Can't determine size, allow it
}

/**
 * Safe JSON parse with size and structure validation
 */
export async function safeJsonParse<T>(request: Request, schema: z.ZodSchema<T>): Promise<
  { success: true; data: T } | { success: false; error: string }
> {
  try {
    // Check request size
    const isValidSize = await validateRequestSize(request, 500); // 500KB max
    if (!isValidSize) {
      return { success: false, error: "Request body too large" };
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error.errors[0]?.message || "Invalid request data" 
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error("JSON parse error:", error);
    return { success: false, error: "Invalid JSON format" };
  }
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    // Don't expose internal paths or sensitive info
    return error.replace(/\/[^\s]+/g, '[path]');
  }
  return "An error occurred";
}
