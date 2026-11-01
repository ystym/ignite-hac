import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/lib/schemas";

export class AppError extends Error {
  code: string;
  status: number;
  retryable: boolean;
  details?: unknown;

  constructor(options: {
    message: string;
    code?: string;
    status?: number;
    retryable?: boolean;
    details?: unknown;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code ?? "INTERNAL_ERROR";
    this.status = options.status ?? 500;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

export class AIError extends AppError {
  constructor(options: {
    message: string;
    code?: string;
    status?: number;
    retryable?: boolean;
    details?: unknown;
    cause?: unknown;
  }) {
    super({
      ...options,
      code: options.code ?? "AI_ERROR",
      status: options.status ?? 502,
      retryable: options.retryable ?? true,
    });
    this.name = "AIError";
  }
}

export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}

/**
 * Converts provider/SDK errors to messages that are safe to show to a student.
 * Raw provider payloads and API keys are never returned to the browser.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("api key") || lower.includes("unauthenticated") || lower.includes("permission denied")) {
    return new AppError({
      message:
        "Gemini rejected the API key. Check GEMINI_API_KEY in .env, then restart the server. The key never reaches the browser.",
      code: "AI_AUTH_FAILED",
      status: 502,
      retryable: false,
      cause: error,
    });
  }

  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("429") || lower.includes("resource_exhausted")) {
    return new AppError({
      message:
        "The AI provider is rate-limiting this workspace. Wait a minute, then retry. Nothing was silently substituted.",
      code: "AI_RATE_LIMITED",
      status: 429,
      retryable: true,
      cause: error,
    });
  }

  if (lower.includes("safety") || lower.includes("blocked")) {
    return new AppError({
      message:
        "The model blocked this request. Try a shorter excerpt or rephrase the question. No fallback answer was invented.",
      code: "AI_BLOCKED",
      status: 422,
      retryable: false,
      cause: error,
    });
  }

  if (
    lower.includes("fetch failed") ||
    lower.includes("timeout") ||
    lower.includes("network") ||
    lower.includes("503") ||
    lower.includes("unavailable")
  ) {
    return new AppError({
      message:
        "The AI service could not be reached. Check your connection and retry. Your uploaded file is still saved.",
      code: "AI_UNAVAILABLE",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  return new AppError({
    message: "Something went wrong while processing this request. Please retry.",
    code: "UNEXPECTED_ERROR",
    status: 500,
    retryable: true,
    cause: error,
  });
}

export function errorResponse(error: unknown): NextResponse<ApiErrorBody> {
  const appError = toAppError(error);
  if (process.env.NODE_ENV !== "production") {
    console.error("[studymate]", appError.code, error);
  }
  return NextResponse.json(
    {
      error: appError.message,
      code: appError.code,
      retryable: appError.retryable,
      ...(process.env.NODE_ENV !== "production" && appError.details
        ? { details: appError.details }
        : {}),
    },
    { status: appError.status },
  );
}
