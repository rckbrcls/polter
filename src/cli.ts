import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  getCategoryOptions,
  getCommandOptions,
  categories,
} from "./commands.js";
import { globalFlags } from "./flags.js";
import {
  getPinnedCommands,
  addPinnedCommand,
  removePinnedCommand,
  isPinned,
} from "./pins.js";
import { runSupabaseCommand, handleCommandResult } from "./runner.js";

const VERSION = "0.1.2";

function printBanner() {
  const c = pc.cyan;
  const d = pc.dim;
  const ghost = [
    "    ▄▄████████████▄▄",
    "   █                █",
    "  █   ▄██▄     ▂█▂   █",
    "  █   ▀██▀     ▔█▔   █",
    "  █                  █",
    "  █   ██ ██████ ██   █",
    "  █                  █",
    "  █▄██▀▀██▄▄▄▄██▀▀██▄█",
  ];
  console.log("");
  ghost.forEach((line) => console.log(c(line)));
  console.log("");
  console.log(
    "   " + pc.bgCyan(pc.black(pc.bold(" POLTERBASE "))) + d(`  v${VERSION}`),
  );
  console.log(d("   The modern interactive CLI for Supabase"));
  console.log("");
}

export async function main() {
  console.clear();
  printBanner();

  let shouldExit = false;

  while (!shouldExit) {
    const action = await showMainMenu();

    switch (action) {
      case "exit":
        shouldExit = true;
        break;
      case "manage-pins":
        await managePins();
        break;
      case "custom":
        await handleCustomCommand();
        break;
      default:
        if (action.startsWith("pin:")) {
          await executePinnedCommand(action.replace("pin:", ""));
        } else {
          await handleCategoryFlow(action);
        }
        break;
    }

    if (!shouldExit) {
      console.log("");
    }
  }

  p.outro(
    pc.dim("Thank you for using ") +
      pc.cyan(pc.bold("Polterbase")) +
      pc.dim("!"),
  );
}

async function showMainMenu(): Promise<string> {
  const pinned = getPinnedCommands();

  const options: { value: string; label: string; hint?: string }[] = [];

  // Pinned commands section
  if (pinned.length > 0) {
    options.push({
      value: "__header_pins__",
      label: pc.dim("── 📌 Pinned ──────────────────"),
      hint: "",
    });
    for (const cmd of pinned) {
      options.push({
        value: `pin:${cmd}`,
        label: "   " + pc.bold(cmd),
        hint: pc.cyan("pinned"),
      });
    }
    options.push({
      value: "manage-pins",
      label: pc.dim("   ⚙️  Manage pinned commands"),
    });
    options.push({
      value: "__header_cats__",
      label: pc.dim("── 📂 Categories ──────────────"),
      hint: "",
    });
  }

  // Category options
  for (const catOpt of getCategoryOptions()) {
    options.push(catOpt);
  }

  // Custom + Exit
  options.push(
    {
      value: "custom",
      label: "✏️  Custom Command",
      hint: "Free-form args or check version",
    },
    { value: "exit", label: pc.dim("🚪 Exit") },
  );

  const choice = await p.select({
    message:
      pinned.length > 0
        ? "Choose a pinned command or category:"
        : "What would you like to do?",
    options,
    maxItems: 10,
  });

  if (p.isCancel(choice)) return "exit";
  const val = choice as string;
  if (val.startsWith("__header_")) return showMainMenu();
  return val;
}

async function managePins() {
  const pinned = getPinnedCommands();
  if (pinned.length === 0) {
    p.log.info("No pinned commands yet.");
    return;
  }

  const toRemove = await p.multiselect({
    message: "Select commands to unpin (Space to toggle, Enter to confirm):",
    options: pinned.map((cmd) => ({
      value: cmd,
      label: `📌 ${cmd}`,
    })),
    required: false,
  });

  if (p.isCancel(toRemove)) return;

  if (Array.isArray(toRemove) && toRemove.length > 0) {
    toRemove.forEach((cmd) => removePinnedCommand(cmd));
    p.log.success(
      `Removed ${toRemove.length} pinned command${toRemove.length > 1 ? "s" : ""}!`,
    );
  } else {
    p.log.info("No changes made.");
  }
}

async function handleCategoryFlow(categoryKey: string) {
  const cat = categories[categoryKey];
  if (!cat) return;

  const commandOptions = [
    { value: "__back__", label: pc.yellow("← Back to menu") },
    ...getCommandOptions(categoryKey),
  ];

  const command = await p.select({
    message: `${cat.icon}  ${cat.label}:`,
    options: commandOptions,
    maxItems: 10,
  });

  if (p.isCancel(command) || command === "__back__") return;

  const extraArgs = await p.text({
    message: `Additional args for ${pc.cyan(`supabase ${command}`)}?`,
    placeholder: "e.g. push, pull, list (Enter to skip)",
    defaultValue: "",
  });

  if (p.isCancel(extraArgs)) return;

  const args = buildArgs(command as string, extraArgs as string);
  await executeWithFlags(args);
}

async function handleCustomCommand() {
  const custom = await p.text({
    message: "Enter your Supabase command/flags:",
    placeholder: "e.g. -v, status -o json, db pull",
    validate: (val: string | undefined) => {
      if (!val || !val.trim()) return "Please enter a command";
    },
  });

  if (p.isCancel(custom)) return;

  const args = (custom as string).split(" ").filter(Boolean);
  await executeWithFlags(args);
}

async function executeWithFlags(args: string[]) {
  const selectedFlags = await p.multiselect({
    message: "Global flags (Space to toggle, Enter to skip):",
    options: globalFlags,
    required: false,
  });

  if (p.isCancel(selectedFlags)) return;

  const finalArgs =
    Array.isArray(selectedFlags) && selectedFlags.length > 0
      ? [...args, ...selectedFlags]
      : args;

  await executeCommand(finalArgs, false);
}

async function executePinnedCommand(cmdStr: string) {
  const args = cmdStr.split(" ").filter(Boolean);
  await executeCommand(args, true);
}

async function executeCommand(args: string[], isPinnedExec: boolean) {
  const cmdDisplay = `supabase ${args.join(" ")}`;

  const confirm = await p.confirm({
    message: `Execute ${pc.cyan(pc.bold(cmdDisplay))}?`,
    initialValue: true,
  });

  if (p.isCancel(confirm) || !confirm) return;

  let shouldRetry = true;
  let currentArgs = [...args];

  while (shouldRetry) {
    const result = await runSupabaseCommand(currentArgs);
    const action = await handleCommandResult(result, currentArgs);

    switch (action) {
      case "success":
        shouldRetry = false;
        // Offer to pin (only if not already pinned and not a pinned execution)
        if (!isPinnedExec && !isPinned(currentArgs.join(" "))) {
          await offerPin(currentArgs);
        }
        break;

      case "retry":
        // Loop continues with same args
        break;

      case "retry-debug":
        if (!currentArgs.includes("--debug")) {
          currentArgs = [...currentArgs, "--debug"];
        }
        break;

      case "menu":
      case "exit":
        shouldRetry = false;
        break;
    }
  }
}

async function offerPin(args: string[]) {
  const cmdStr = args.join(" ");
  const shouldPin = await p.confirm({
    message: pc.dim("📌 Pin this command for quick access?"),
    initialValue: false,
  });

  if (shouldPin && !p.isCancel(shouldPin)) {
    addPinnedCommand(cmdStr);
    p.log.success(
      pc.green("Pinned! ") + pc.dim("It will appear at the top of the menu."),
    );
  }
}

function buildArgs(command: string, extra: string): string[] {
  const parts = [command];
  if (extra && extra.trim()) {
    parts.push(...extra.trim().split(" ").filter(Boolean));
  }
  return parts;
}
