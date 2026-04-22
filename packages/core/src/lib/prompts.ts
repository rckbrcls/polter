import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

interface PromptOptions {
  defaultValue?: string;
  required?: boolean;
}

export async function promptText(
  label: string,
  options: PromptOptions = {},
): Promise<string> {
  const rl = createInterface({ input, output });

  try {
    while (true) {
      const suffix = options.defaultValue
        ? ` (${options.defaultValue})`
        : "";
      const answer = (await rl.question(`${label}${suffix}: `)).trim();

      if (!answer && options.defaultValue) {
        return options.defaultValue;
      }

      if (!answer && options.required) {
        output.write("This value is required.\n");
        continue;
      }

      return answer;
    }
  } finally {
    rl.close();
  }
}

export async function promptConfirm(
  label: string,
  defaultValue = true,
): Promise<boolean> {
  const rl = createInterface({ input, output });

  try {
    const answer = (
      await rl.question(`${label} ${defaultValue ? "(Y/n)" : "(y/N)"}: `)
    )
      .trim()
      .toLowerCase();

    if (!answer) {
      return defaultValue;
    }

    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

export async function promptSelect(
  label: string,
  options: Array<{ value: string; label: string }>,
  defaultValue?: string,
): Promise<string> {
  const rl = createInterface({ input, output });

  try {
    output.write(`${label}\n`);
    for (const [index, option] of options.entries()) {
      const marker = option.value === defaultValue ? " (default)" : "";
      output.write(`  ${index + 1}. ${option.label}${marker}\n`);
    }

    while (true) {
      const answer = (
        await rl.question(
          `Choose 1-${options.length}${defaultValue ? " (press Enter for default)" : ""}: `,
        )
      ).trim();

      if (!answer && defaultValue) {
        return defaultValue;
      }

      const selectedIndex = Number(answer);
      if (
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 1 &&
        selectedIndex <= options.length
      ) {
        return options[selectedIndex - 1]!.value;
      }

      output.write("Invalid selection.\n");
    }
  } finally {
    rl.close();
  }
}
