import type { ApiErrorBody } from "./types";

/**
 * An error response from the API, built from its standard error body
 * (design.md 5.1). `apiMessage` keeps the original shape: validation errors
 * (400) return one message per failed rule as an array.
 */
export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly statusCode: number;
  readonly apiMessage: string | string[];

  constructor(statusCode: number, apiMessage: string | string[]) {
    // Error.message must be a string, so arrays are joined for logs and dev tools.
    super(Array.isArray(apiMessage) ? apiMessage.join("; ") : apiMessage);
    this.statusCode = statusCode;
    this.apiMessage = apiMessage;
  }

  /** The API's message(s), always as an array. */
  get messages(): string[] {
    return Array.isArray(this.apiMessage) ? this.apiMessage : [this.apiMessage];
  }
}

/** The request never got a response: offline, DNS failure, connection refused. */
export class NetworkError extends Error {
  override readonly name = "NetworkError";

  constructor(options?: ErrorOptions) {
    super("Network request failed", options);
  }
}

/** The session is over (refresh was rejected); the user is being sent to /login. */
export class SessionExpiredError extends Error {
  override readonly name = "SessionExpiredError";

  constructor() {
    super("Session expired");
  }
}

/** Whether `error` is an {@link ApiError}, optionally with a specific status code. */
export function isApiError(error: unknown, statusCode?: number): error is ApiError {
  return error instanceof ApiError && (statusCode === undefined || error.statusCode === statusCode);
}

/** Whether `error` is a {@link NetworkError}. */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/** Whether `error` is a {@link SessionExpiredError}. */
export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

function isApiErrorBody(value: unknown): value is Pick<ApiErrorBody, "statusCode" | "message"> {
  if (typeof value !== "object" || value === null) return false;
  const { statusCode, message } = value as Record<string, unknown>;
  const messageIsValid =
    typeof message === "string" ||
    (Array.isArray(message) && message.every((item) => typeof item === "string"));
  return typeof statusCode === "number" && messageIsValid;
}

/**
 * Builds an {@link ApiError} from a failed response. Bodies that aren't the API's
 * error shape (e.g. an HTML 502 page from a proxy) still produce an ApiError
 * with the HTTP status, so callers handle one error type.
 */
export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON; fall through to the generic message.
  }
  if (isApiErrorBody(body)) return new ApiError(body.statusCode, body.message);
  return new ApiError(response.status, response.statusText || `HTTP ${response.status}`);
}
