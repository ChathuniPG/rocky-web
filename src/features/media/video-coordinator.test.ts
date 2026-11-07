import { describe, expect, it } from "vitest";

import { createVideoCoordinator, type CoordinatedVideo } from "./video-coordinator";

/** A fake video that records what the coordinator asked of it. */
function fakeVideo(log: string[], id: string): CoordinatedVideo {
  return { play: () => log.push(`play ${id}`), pause: () => log.push(`pause ${id}`) };
}

function setup(ids: string[]) {
  const coordinator = createVideoCoordinator();
  const log: string[] = [];
  const unregister = Object.fromEntries(
    ids.map((id) => [id, coordinator.register(id, fakeVideo(log, id))]),
  );
  return { coordinator, log, unregister };
}

describe("createVideoCoordinator", () => {
  it("plays the most visible video and pauses the previous one", () => {
    const { coordinator, log } = setup(["a", "b"]);
    coordinator.setVisibility("a", 1);
    coordinator.setVisibility("b", 0.3);
    expect(coordinator.activeId()).toBe("a");

    coordinator.setVisibility("b", 0.9);
    coordinator.setVisibility("a", 0.7);
    expect(coordinator.activeId()).toBe("b");
    expect(log).toEqual(["play a", "pause a", "play b"]);
  });

  it("plays nothing below the 60% threshold", () => {
    const { coordinator, log } = setup(["a"]);
    coordinator.setVisibility("a", 0.59);
    expect(coordinator.activeId()).toBeNull();
    coordinator.setVisibility("a", 0.6);
    expect(coordinator.activeId()).toBe("a");
    coordinator.setVisibility("a", 0.2);
    expect(coordinator.activeId()).toBeNull();
    expect(log).toEqual(["play a", "pause a"]);
  });

  it("keeps the playing video on a tie", () => {
    const { coordinator, log } = setup(["a", "b"]);
    coordinator.setVisibility("b", 0.8);
    coordinator.setVisibility("a", 0.8);
    expect(coordinator.activeId()).toBe("b");
    expect(log).toEqual(["play b"]);
  });

  it("settles a tie between videos that aren't playing in favour of the one registered first", () => {
    const { coordinator } = setup(["a", "b"]);
    coordinator.setVisibility("a", 0.8);
    coordinator.setVisibility("b", 0.8);
    coordinator.setPageVisible(false);
    coordinator.setPageVisible(true);
    expect(coordinator.activeId()).toBe("a");
  });

  it("pauses everything while the page is hidden and resumes after", () => {
    const { coordinator, log } = setup(["a"]);
    coordinator.setVisibility("a", 1);
    coordinator.setPageVisible(false);
    expect(coordinator.activeId()).toBeNull();
    coordinator.setVisibility("a", 1);
    expect(coordinator.activeId()).toBeNull();
    coordinator.setPageVisible(true);
    expect(log).toEqual(["play a", "pause a", "play a"]);
  });

  it("pauses an unregistered active video and elects the next one", () => {
    const { coordinator, log, unregister } = setup(["a", "b"]);
    coordinator.setVisibility("a", 1);
    coordinator.setVisibility("b", 0.7);
    unregister.a?.();
    expect(coordinator.activeId()).toBe("b");
    expect(log).toEqual(["play a", "pause a", "play b"]);
  });

  it("ignores a stale unregister after the id was registered again", () => {
    const coordinator = createVideoCoordinator();
    const log: string[] = [];
    const unregisterOld = coordinator.register("a", fakeVideo(log, "old"));
    coordinator.register("a", fakeVideo(log, "new"));
    coordinator.setVisibility("a", 1);
    unregisterOld();
    expect(coordinator.activeId()).toBe("a");
    expect(log).toEqual(["play new"]);
  });

  it("lets a manual play claim playback and pause the others", () => {
    const { coordinator, log } = setup(["a", "b"]);
    coordinator.setVisibility("a", 1);
    coordinator.claim("b");
    expect(coordinator.activeId()).toBe("b");
    expect(log).toEqual(["play a", "pause a"]);
  });
});
