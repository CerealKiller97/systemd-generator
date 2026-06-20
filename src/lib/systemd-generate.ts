import { SECTIONS, type SectionId, type SystemdOption } from "./systemd-options";

export type FormState = Record<string, string>;

/** Unique key for a field, since two groups share the [Service] section. */
export const fieldId = (sectionIndex: number, key: string) =>
  `${sectionIndex}.${key}`;

const ORDER: SectionId[] = ["Unit", "Service", "Install"];

function emitLines(opt: SystemdOption, raw: string): string[] {
  const value = raw ?? "";
  // boolean / select: skip when equal to default or empty.
  if (opt.type === "boolean") {
    const v = value || opt.default || "no";
    if (v === (opt.default ?? "no")) return [];
    return [`${opt.key}=${v}`];
  }
  if (opt.type === "select") {
    if (!value) return [];
    if (opt.default && value === opt.default) return [];
    return [`${opt.key}=${value}`];
  }
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (opt.type === "textarea") {
    // One directive per non-empty line.
    return trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `${opt.key}=${l}`);
  }
  // text / number / list -> single line.
  return [`${opt.key}=${trimmed}`];
}

export type GenerateResult = {
  content: string;
  /** number of directives emitted */
  count: number;
};

export function generateUnitFile(state: FormState): GenerateResult {
  const buckets: Record<SectionId, string[]> = {
    Unit: [],
    Service: [],
    Install: [],
  };

  SECTIONS.forEach((section, sectionIndex) => {
    section.options.forEach((opt) => {
      const id = fieldId(sectionIndex, opt.key);
      const lines = emitLines(opt, state[id] ?? "");
      buckets[section.id].push(...lines);
    });
  });

  const parts: string[] = [];
  for (const id of ORDER) {
    if (buckets[id].length === 0) {
      continue;
    }
    parts.push(`[${id}]`);
    parts.push(...buckets[id]);
    parts.push(""); // blank line between sections
  }

  const count = ORDER.reduce((n, id) => n + buckets[id].length, 0);

  if (count === 0) {
    return {
      content:
        "# Your unit file will appear here as you fill in options on the left.\n",
      count: 0,
    };
  }

  return { content: parts.join("\n").trimEnd() + "\n", count };
}

/** A clean slate carrying only each option's own default value. */
export function emptyState(): FormState {
  const s: FormState = {};
  SECTIONS.forEach((section, sectionIndex) => {
    section.options.forEach((opt) => {
      if (opt.default) {
        s[fieldId(sectionIndex, opt.key)] = opt.default;
      }
    });
  });
  return s;
}

/** Sensible starting point so the right pane is never empty. */
export function defaultState(): FormState {
  const s = emptyState();

  // A friendly starter example.
  s[fieldId(0, "Description")] = "My example service";
  s[fieldId(0, "After")] = "network-online.target";
  s[fieldId(0, "Wants")] = "network-online.target";
  s[fieldId(1, "ExecStart")] = "/usr/local/bin/myapp --port 8080";
  s[fieldId(1, "Restart")] = "on-failure";
  s[fieldId(1, "RestartSec")] = "5s";
  s[fieldId(1, "User")] = "myapp";

  return s;
}
