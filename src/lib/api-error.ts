export function readApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybe = error as { message?: unknown; details?: unknown; hint?: unknown };
    const parts = [maybe.message, maybe.details, maybe.hint]
      .filter((value): value is string => typeof value === "string" && value.trim() !== "")
      .join(" | ");
    if (parts) return parts;
  }
  return fallback;
}
