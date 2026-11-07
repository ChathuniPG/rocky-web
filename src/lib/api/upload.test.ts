import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { refreshSession } from "./client";
import { ApiError, NetworkError, SessionExpiredError } from "./errors";
import { uploadFile } from "./upload";

vi.mock("./client", () => ({ refreshSession: vi.fn() }));

type Behaviour =
  | { kind: "respond"; status: number; body: unknown; progress?: number[] }
  | { kind: "network-error" }
  | { kind: "hang" };

/** A minimal XMLHttpRequest stand-in that plays one scripted behaviour per request. */
class FakeXhr {
  static behaviours: Behaviour[] = [];
  static instances: FakeXhr[] = [];

  status = 0;
  statusText = "";
  responseText = "";
  withCredentials = false;
  method = "";
  url = "";
  body: FormData | null = null;
  aborted = false;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor() {
    FakeXhr.instances.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader() {}

  send(body: FormData) {
    this.body = body;
    const behaviour = FakeXhr.behaviours.shift() ?? { kind: "hang" };
    queueMicrotask(() => {
      if (this.aborted) return;
      if (behaviour.kind === "network-error") this.onerror?.();
      if (behaviour.kind !== "respond") return;
      for (const loaded of behaviour.progress ?? []) {
        this.upload.onprogress?.({ lengthComputable: true, loaded, total: 100 } as ProgressEvent);
      }
      this.status = behaviour.status;
      this.responseText = JSON.stringify(behaviour.body);
      this.onload?.();
    });
  }

  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

const stored = {
  url: "https://firebasestorage.googleapis.com/v0/b/test/o/posts%2Fu%2Fa.png?alt=media",
  path: "posts/u/a.png",
  mediaType: "IMAGE",
  contentType: "image/png",
  sizeBytes: 4,
};

const file = new File([new Uint8Array([1, 2, 3, 4])], "photo.png", { type: "image/png" });

beforeEach(() => {
  FakeXhr.behaviours = [];
  FakeXhr.instances = [];
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  vi.mocked(refreshSession).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadFile", () => {
  it("posts the file and purpose as multipart and returns the stored file", async () => {
    FakeXhr.behaviours.push({ kind: "respond", status: 201, body: stored });

    await expect(uploadFile({ file, purpose: "post" })).resolves.toEqual(stored);

    const [xhr] = FakeXhr.instances;
    expect(xhr?.method).toBe("POST");
    expect(xhr?.url).toBe("/api/v1/uploads");
    expect(xhr?.body?.get("purpose")).toBe("post");
    expect(xhr?.body?.get("file")).toBeInstanceOf(File);
  });

  it("reports progress as a fraction", async () => {
    FakeXhr.behaviours.push({ kind: "respond", status: 201, body: stored, progress: [25, 100] });
    const onProgress = vi.fn();

    await uploadFile({ file, purpose: "post", onProgress });
    expect(onProgress.mock.calls).toEqual([[0.25], [1]]);
  });

  it("refreshes the session once on a 401 and retries", async () => {
    FakeXhr.behaviours.push(
      { kind: "respond", status: 401, body: { statusCode: 401, message: "Unauthorized" } },
      { kind: "respond", status: 201, body: stored },
    );
    vi.mocked(refreshSession).mockResolvedValue("refreshed");
    const onProgress = vi.fn();

    await expect(uploadFile({ file, purpose: "post", onProgress })).resolves.toEqual(stored);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(FakeXhr.instances).toHaveLength(2);
    expect(onProgress).toHaveBeenCalledWith(0);
  });

  it("throws SessionExpiredError when the refresh is rejected", async () => {
    FakeXhr.behaviours.push({
      kind: "respond",
      status: 401,
      body: { statusCode: 401, message: "x" },
    });
    vi.mocked(refreshSession).mockResolvedValue("expired");

    await expect(uploadFile({ file, purpose: "post" })).rejects.toBeInstanceOf(SessionExpiredError);
    expect(FakeXhr.instances).toHaveLength(1);
  });

  it("keeps the 401 when the refresh fails temporarily", async () => {
    FakeXhr.behaviours.push({
      kind: "respond",
      status: 401,
      body: { statusCode: 401, message: "x" },
    });
    vi.mocked(refreshSession).mockResolvedValue("failed");

    const error: unknown = await uploadFile({ file, purpose: "post" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(401);
  });

  it("turns error responses into ApiError with the API's message", async () => {
    FakeXhr.behaviours.push({
      kind: "respond",
      status: 413,
      body: { statusCode: 413, message: "File too large" },
    });

    const error: unknown = await uploadFile({ file, purpose: "post" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ statusCode: 413, apiMessage: "File too large" });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("throws NetworkError when the request fails", async () => {
    FakeXhr.behaviours.push({ kind: "network-error" });
    await expect(uploadFile({ file, purpose: "post" })).rejects.toBeInstanceOf(NetworkError);
  });

  it("cancels the request when the signal aborts", async () => {
    const controller = new AbortController();
    const promise = uploadFile({ file, purpose: "post", signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(FakeXhr.instances[0]?.aborted).toBe(true);
  });

  it("does not start when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      uploadFile({ file, purpose: "post", signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(FakeXhr.instances).toHaveLength(0);
  });
});
