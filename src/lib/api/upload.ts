import { refreshSession } from "./client";
import { apiErrorFromResponse, NetworkError, SessionExpiredError } from "./errors";
import type { Upload, UploadPurpose } from "./types";

/*
 * File uploads to POST /api/v1/uploads (ADR-007). A separate helper from the
 * JSON API client because fetch can't report upload progress (FR-POST-03);
 * XMLHttpRequest can. It follows the client's session rule (design.md 3.6): on
 * a 401, refresh once and retry. Used for post media now, avatars later.
 */

const UPLOAD_URL = "/api/v1/uploads";

/** Options for {@link uploadFile}. */
export type UploadFileOptions = {
  file: File;
  /** Decides the allowed types and sizes on the server. */
  purpose: UploadPurpose;
  /** Aborting cancels the upload; the promise rejects with an `AbortError`. */
  signal?: AbortSignal;
  /** Called with the fraction sent so far, from 0 to 1. Starts over at 0 on a retry. */
  onProgress?: (fraction: number) => void;
};

function abortError(): DOMException {
  return new DOMException("The upload was cancelled.", "AbortError");
}

/**
 * Sends the file once and resolves with the server's answer as a `Response`, so
 * error bodies go through the same parsing as the API client's. Rejects with a
 * `NetworkError` when no answer arrives and an `AbortError` when cancelled.
 */
function sendOnce({ file, purpose, signal, onProgress }: UploadFileOptions): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const xhr = new XMLHttpRequest();
    const onAbortSignal = () => xhr.abort();
    const cleanUp = () => signal?.removeEventListener("abort", onAbortSignal);

    xhr.open("POST", UPLOAD_URL);
    // Same-origin requests send cookies anyway; stated to match the API client.
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      cleanUp();
      // `Response` only accepts statuses 200–599, which is everything a server sends.
      resolve(new Response(xhr.responseText, { status: xhr.status, statusText: xhr.statusText }));
    };
    xhr.onerror = () => {
      cleanUp();
      reject(new NetworkError());
    };
    xhr.onabort = () => {
      cleanUp();
      reject(abortError());
    };

    signal?.addEventListener("abort", onAbortSignal, { once: true });

    const body = new FormData();
    body.append("file", file);
    body.append("purpose", purpose);
    // No Content-Type header: the browser sets multipart/form-data with its boundary.
    xhr.send(body);
  });
}

/**
 * Uploads a file through the API and returns where it was stored. Pass the
 * returned `path` to POST /posts (or the profile update for avatars).
 *
 * Throws `ApiError` for error responses (e.g. 400 wrong type, 413 too large),
 * `NetworkError` when the request fails, `SessionExpiredError` when the session
 * can't be refreshed, and an `AbortError` `DOMException` when cancelled.
 */
export async function uploadFile(options: UploadFileOptions): Promise<Upload> {
  let response = await sendOnce(options);

  if (response.status === 401) {
    const outcome = await refreshSession();
    if (outcome === "expired") throw new SessionExpiredError();
    if (outcome === "refreshed") {
      // Retried once only; a second 401 is reported as is.
      options.onProgress?.(0);
      response = await sendOnce(options);
    }
    // "failed": keep the original 401 instead of ending the session over a
    // temporary outage (same as the API client).
  }

  if (!response.ok) throw await apiErrorFromResponse(response);
  // The API is the source of truth for the shape (docs/openapi.json).
  return (await response.json()) as Upload;
}
