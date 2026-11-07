import { apiErrorFromResponse, NetworkError, SessionExpiredError } from "./errors";
import type { ApiPaths } from "./types";

/*
 * The one API client for browser code. It only calls same-origin /api/v1
 * (ADR-004) and sends cookies with every request; the browser attaches the
 * httpOnly session cookies, so this code never sees a token (ADR-003).
 * All request and response types are inferred from the generated OpenAPI types.
 */

const API_PREFIX = "/api/v1";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type StripPrefix<K> = K extends `${typeof API_PREFIX}${infer Path}` ? Path : never;

/** Every API path without the /api/v1 prefix, e.g. `"/auth/me"` or `"/posts/{id}"`. */
export type ApiPath = StripPrefix<keyof ApiPaths>;

type PathItem<P extends ApiPath> = ApiPaths[`${typeof API_PREFIX}${P}` & keyof ApiPaths];

/** The OpenAPI operation for a path and method (`never` if the path lacks that method). */
type Operation<P extends ApiPath, M extends HttpMethod> = NonNullable<PathItem<P>[M]>;

/** Paths that support method `M`. Unsupported methods are generated as `?: never`. */
type PathsWithMethod<M extends HttpMethod> = {
  [P in ApiPath]: [Operation<P, M>] extends [never] ? never : P;
}[ApiPath];

// Operations without a body are generated as `requestBody?: never`. The tuple
// check stops `never` from matching every shape (`never extends X` is true).
type JsonRequestBody<Op> = Op extends { requestBody?: infer Body }
  ? [NonNullable<Body>] extends [never]
    ? never
    : NonNullable<Body> extends { content: { "application/json": infer Json } }
      ? Json
      : never
  : never;

type SuccessStatus = 200 | 201 | 204;

/** The JSON body of the operation's success response; `void` for 204 No Content. */
type SuccessBody<Op> = Op extends { responses: infer Responses }
  ? {
      [Status in keyof Responses & SuccessStatus]: Responses[Status] extends {
        content: { "application/json": infer Json };
      }
        ? Json
        : void;
    }[keyof Responses & SuccessStatus]
  : never;

type PathOption<Params> = Params extends { path: infer Path } ? { path: Path } : { path?: never };

type QueryOption<Params> = Params extends { query: infer Query }
  ? { query: Query }
  : Params extends { query?: infer Query }
    ? { query?: Query }
    : { query?: never };

type BodyOption<Op> = [JsonRequestBody<Op>] extends [never]
  ? { body?: never }
  : { body: JsonRequestBody<Op> };

/** Options for one request: path/query parameters and body as the operation defines them. */
export type RequestOptions<Op> = (Op extends { parameters: infer Params }
  ? PathOption<Params> & QueryOption<Params>
  : object) &
  BodyOption<Op> & {
    /** Lets TanStack Query cancel requests it no longer needs. */
    signal?: AbortSignal;
  };

// The options argument may be left out only when nothing in it is required.
type RequestArgs<Op> =
  object extends RequestOptions<Op>
    ? [options?: RequestOptions<Op>]
    : [options: RequestOptions<Op>];

type UntypedOptions = {
  path?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

// Auth endpoints answer 401 for their own reasons (wrong password, session over);
// refreshing and retrying them would be wrong. /auth/me is deliberately not listed:
// it is how the AuthProvider learns the session state, so it refreshes like any
// other endpoint (ADR-013).
const PATHS_WITHOUT_REFRESH = new Set<string>([
  "/auth/signup",
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
]);

function buildUrl(path: string, options: UntypedOptions | undefined): string {
  const resolvedPath = path.replace(/\{(\w+)\}/g, (_token, name: string) => {
    const value = options?.path?.[name];
    if (value === undefined) throw new Error(`Missing path parameter "${name}" for ${path}`);
    return encodeURIComponent(String(value));
  });

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(options?.query ?? {})) {
    if (value !== undefined) search.set(key, String(value));
  }
  const queryString = search.toString();
  return `${API_PREFIX}${resolvedPath}${queryString ? `?${queryString}` : ""}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function send(
  method: HttpMethod,
  path: string,
  options: UntypedOptions | undefined,
): Promise<Response> {
  const hasBody = options?.body !== undefined;
  try {
    return await fetch(buildUrl(path, options), {
      method: method.toUpperCase(),
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });
  } catch (error) {
    // Cancellation is not a network failure; TanStack Query expects the AbortError back.
    if (isAbortError(error)) throw error;
    throw new NetworkError({ cause: error });
  }
}

/** Result of one refresh attempt. "failed" = a temporary problem (429, 5xx, offline). */
type RefreshOutcome = "refreshed" | "expired" | "failed";

let refreshInFlight: Promise<RefreshOutcome> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

async function performRefresh(): Promise<RefreshOutcome> {
  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    return "failed";
  }
  if (response.ok) return "refreshed";
  if (response.status === 401) {
    // Notified here, not per request, so N concurrent 401s redirect only once.
    sessionExpiredHandler?.();
    return "expired";
  }
  return "failed";
}

/**
 * Renews the session via POST /auth/refresh (design.md 3.6). Concurrent callers
 * share one request, so a page firing several queries refreshes only once.
 */
export function refreshSession(): Promise<RefreshOutcome> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Registers what happens when the session is over (refresh rejected): the
 * AuthProvider clears the cache and redirects to login. Keeps this module free
 * of React. Returns a function that unregisters the handler.
 */
export function setSessionExpiredHandler(handler: () => void): () => void {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = null;
  };
}

async function request(
  method: HttpMethod,
  path: string,
  options: UntypedOptions | undefined,
): Promise<unknown> {
  let response = await send(method, path, options);

  if (response.status === 401 && !PATHS_WITHOUT_REFRESH.has(path)) {
    const outcome = await refreshSession();
    if (outcome === "refreshed") {
      // Retried once only; a second 401 is reported as is.
      response = await send(method, path, options);
    } else if (outcome === "expired") {
      throw new SessionExpiredError();
    }
    // "failed": keep the original 401 instead of logging the user out over a
    // temporary outage.
  }

  if (!response.ok) throw await apiErrorFromResponse(response);
  if (response.status === 204) return undefined;
  return response.json();
}

function createMethod<M extends HttpMethod>(method: M) {
  return <P extends PathsWithMethod<M>>(
    path: P,
    ...[options]: RequestArgs<Operation<P, M>>
  ): Promise<SuccessBody<Operation<P, M>>> =>
    // The API is the source of truth for the response shape (docs/openapi.json);
    // the generated types describe it, so the parsed JSON is trusted here.
    request(method, path, options as UntypedOptions | undefined) as Promise<
      SuccessBody<Operation<P, M>>
    >;
}

/**
 * Typed API client. Paths are written without the /api/v1 prefix, e.g.
 * `api.get("/auth/me")` or `api.patch("/posts/{id}", { path: { id }, body })`.
 * Throws `ApiError` for error responses, `NetworkError` when the request fails,
 * and `SessionExpiredError` when a 401 can't be fixed by refreshing.
 */
export const api = {
  get: createMethod("get"),
  post: createMethod("post"),
  put: createMethod("put"),
  patch: createMethod("patch"),
  delete: createMethod("delete"),
};
