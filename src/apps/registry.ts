import type { AppProfile } from "./types.js";
import { polterstoreProfile } from "./polterstore.js";

const profiles = [polterstoreProfile];

export function getAppProfile(appId: string): AppProfile | undefined {
  return profiles.find((profile) => profile.id === appId);
}

export function detectContextualApp(startDir: string = process.cwd()): AppProfile | undefined {
  return profiles.find((profile) => profile.detect(startDir));
}
