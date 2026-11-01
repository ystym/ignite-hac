export class ApiClientError extends Error {
  code: string;
  status: number;
  retryable: boolean;
  details?: unknown;

  constructor(message: string, options: { code?: string; status?: number; retryable?: boolean; details?: unknown } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.code = options.code ?? "REQUEST_FAILED";
    this.status = options.status ?? 0;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  rawBody?: BodyInit;
};

export async function apiFetch<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const { body, rawBody, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | undefined = rawBody;

  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: requestBody,
    });
  } catch (error) {
    throw new ApiClientError(
      "Could not reach the server. Check that the app is running and try again.",
      { code: "NETWORK_ERROR", retryable: true, details: error },
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const data =
      payload && typeof payload === "object"
        ? (payload as { error?: string; code?: string; retryable?: boolean; details?: unknown })
        : {};
    throw new ApiClientError(
      data.error || `The request failed (${response.status}). Please retry.`,
      {
        code: data.code,
        status: response.status,
        retryable: data.retryable,
        details: data.details,
      },
    );
  }

  if (payload === null) {
    throw new ApiClientError("The server returned an unexpected response. Please retry.", {
      code: "INVALID_RESPONSE",
      status: response.status,
      retryable: true,
    });
  }

  return payload as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please retry.";
}
