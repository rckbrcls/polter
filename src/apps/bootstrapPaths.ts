import { homedir } from "node:os";
import { join } from "node:path";

export function getPolterstoreBootstrapPayloadPath(): string {
  const home = homedir();

  if (process.platform === "darwin") {
    return join(
      home,
      "Library",
      "Application Support",
      "polterstore",
      "bootstrap",
      "supabase.json",
    );
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
    return join(appData, "polterstore", "bootstrap", "supabase.json");
  }

  return join(home, ".config", "polterstore", "bootstrap", "supabase.json");
}
