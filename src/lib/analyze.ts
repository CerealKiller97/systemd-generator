import { SECTIONS } from "./systemd-options";
import { fieldId, type FormState } from "./systemd-generate";

// Resolve section indices by identity so the analysis survives any reordering
// of SECTIONS. Two sections share id "Service"; the title disambiguates them.
const UNIT = SECTIONS.findIndex((s) => s.id === "Unit");
const SERVICE = SECTIONS.findIndex((s) => s.id === "Service" && s.title === "[Service]");
const HARDENING = SECTIONS.findIndex((s) => s.title === "Security hardening");
const INSTALL = SECTIONS.findIndex((s) => s.id === "Install");

/** Trimmed value of a directive, or "" when unset. */
function val(form: FormState, section: number, key: string): string {
  return (form[fieldId(section, key)] ?? "").trim();
}

/** A boolean directive is "on" only when explicitly set to yes/true/on. */
function on(form: FormState, section: number, key: string): boolean {
  return ["yes", "true", "on", "1"].includes(val(form, section, key).toLowerCase());
}

/** A list/text directive counts as set when it has any content. */
function set(form: FormState, section: number, key: string): boolean {
  return val(form, section, key) !== "";
}

// ── Hardening score ─────────────────────────────────────────────────────────

export type HardeningCheck = {
  label: string;
  /** Relative weight toward the score. */
  weight: number;
  satisfied: boolean;
  /** Short reason / what it buys you. */
  hint: string;
};

export type HardeningResult = {
  /** 0–10, one decimal. */
  score: number;
  /** Count of satisfied checks. */
  passed: number;
  total: number;
  checks: HardeningCheck[];
};

/**
 * A pragmatic, weighted echo of `systemd-analyze security` over the subset of
 * directives this tool exposes. Not a 1:1 reproduction — a directional nudge.
 */
export function hardeningScore(form: FormState): HardeningResult {
  const protectSystem = val(form, HARDENING, "ProtectSystem");
  const protectHome = val(form, HARDENING, "ProtectHome");
  const userSet = set(form, SERVICE, "User") && val(form, SERVICE, "User").toLowerCase() !== "root";

  const checks: HardeningCheck[] = [
    {
      label: "NoNewPrivileges",
      weight: 2,
      satisfied: on(form, HARDENING, "NoNewPrivileges"),
      hint: "Blocks privilege escalation via setuid/capabilities.",
    },
    {
      label: "ProtectSystem",
      weight: 2,
      satisfied: ["yes", "full", "strict"].includes(protectSystem),
      hint: "Mounts system paths read-only (strict locks the whole FS).",
    },
    {
      label: "Non-root user",
      weight: 1.5,
      satisfied: on(form, SERVICE, "DynamicUser") || userSet,
      hint: "Run as a dedicated user or DynamicUser=yes, never root.",
    },
    {
      label: "SystemCallFilter",
      weight: 1.5,
      satisfied: set(form, HARDENING, "SystemCallFilter"),
      hint: "Allow-lists syscalls (e.g. @system-service) to shrink the kernel attack surface.",
    },
    {
      label: "RestrictAddressFamilies",
      weight: 1.5,
      satisfied: set(form, HARDENING, "RestrictAddressFamilies"),
      hint: "Limits socket families the service may use.",
    },
    {
      label: "ProtectHome",
      weight: 1,
      satisfied: ["yes", "read-only", "tmpfs"].includes(protectHome),
      hint: "Hides /home, /root, /run/user from the service.",
    },
    {
      label: "PrivateTmp",
      weight: 1,
      satisfied: on(form, HARDENING, "PrivateTmp"),
      hint: "Gives the service a private /tmp, isolated from other units.",
    },
    {
      label: "ProtectKernelTunables",
      weight: 1,
      satisfied: on(form, HARDENING, "ProtectKernelTunables"),
      hint: "Makes /proc/sys and friends read-only.",
    },
    {
      label: "ProtectKernelModules",
      weight: 1,
      satisfied: on(form, HARDENING, "ProtectKernelModules"),
      hint: "Denies (un)loading kernel modules.",
    },
    {
      label: "ProtectControlGroups",
      weight: 1,
      satisfied: on(form, HARDENING, "ProtectControlGroups"),
      hint: "Makes the cgroup hierarchy read-only.",
    },
    {
      label: "CapabilityBoundingSet",
      weight: 1,
      satisfied: set(form, HARDENING, "CapabilityBoundingSet"),
      hint: "Drops Linux capabilities the service doesn't need.",
    },
  ];

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const got = checks.reduce((n, c) => n + (c.satisfied ? c.weight : 0), 0);
  const score = Math.round((got / total) * 100) / 10;

  return {
    score,
    passed: checks.filter((c) => c.satisfied).length,
    total: checks.length,
    checks,
  };
}

// ── Validation / lints ──────────────────────────────────────────────────────

export type LintLevel = "error" | "warning" | "info";

export type Lint = {
  level: LintLevel;
  message: string;
};

const RANK: Record<LintLevel, number> = { error: 0, warning: 1, info: 2 };

/** A lightweight, client-side `systemd-analyze verify`. */
export function validate(form: FormState): Lint[] {
  const lints: Lint[] = [];
  const type = val(form, SERVICE, "Type") || "simple";
  const execStart = val(form, SERVICE, "ExecStart");
  const restart = val(form, SERVICE, "Restart");

  // ExecStart is required for every type except oneshot (which may run none or
  // several commands).
  if (!execStart && type !== "oneshot") {
    lints.push({
      level: "error",
      message: `ExecStart= is required for Type=${type}.`,
    });
  }

  if (type === "forking" && !set(form, SERVICE, "PIDFile")) {
    lints.push({
      level: "warning",
      message:
        "Type=forking without PIDFile= — systemd may track the wrong process. Set PIDFile= to the pid your daemon writes.",
    });
  }

  if (type === "oneshot" && !on(form, SERVICE, "RemainAfterExit")) {
    lints.push({
      level: "info",
      message:
        "Type=oneshot exits immediately. Add RemainAfterExit=yes if the unit should stay 'active' after the command finishes.",
    });
  }

  if (type === "notify") {
    lints.push({
      level: "info",
      message:
        "Type=notify requires the program to call sd_notify(READY=1); otherwise startup hangs until TimeoutStartSec.",
    });
  }

  // Enable-ability: WantedBy/RequiredBy is what `systemctl enable` hooks into.
  if (!set(form, INSTALL, "WantedBy") && !set(form, INSTALL, "RequiredBy")) {
    lints.push({
      level: "warning",
      message:
        "No WantedBy= (or RequiredBy=) in [Install] — `systemctl enable` has nothing to hook into, so the service won't start at boot.",
    });
  }

  // ProtectSystem=strict makes everything read-only.
  if (
    val(form, HARDENING, "ProtectSystem") === "strict" &&
    !set(form, HARDENING, "ReadWritePaths") &&
    !set(form, HARDENING, "StateDirectory")
  ) {
    lints.push({
      level: "warning",
      message:
        "ProtectSystem=strict makes the whole filesystem read-only. Add ReadWritePaths= or StateDirectory= for paths the service must write to.",
    });
  }

  // Restart without a delay can spin in a tight loop.
  if ((restart === "always" || restart === "on-failure") && !set(form, SERVICE, "RestartSec")) {
    lints.push({
      level: "info",
      message:
        "Restart= is set but RestartSec= is not — the default 100ms can cause a tight restart loop. Try RestartSec=5s.",
    });
  }

  // network-online.target must be pulled in, not just ordered after.
  const after = val(form, UNIT, "After");
  const wants = val(form, UNIT, "Wants");
  const requires = val(form, UNIT, "Requires");
  if (
    after.includes("network-online.target") &&
    !wants.includes("network-online.target") &&
    !requires.includes("network-online.target")
  ) {
    lints.push({
      level: "info",
      message:
        "After=network-online.target only orders — it won't pull the target in. Add Wants=network-online.target so it's actually reached.",
    });
  }

  if (val(form, SERVICE, "User").toLowerCase() === "root") {
    lints.push({
      level: "info",
      message: "Running as User=root. Prefer a dedicated user or DynamicUser=yes to limit blast radius.",
    });
  }

  if (!set(form, UNIT, "Description")) {
    lints.push({
      level: "info",
      message: "No Description= — it's shown by `systemctl status` and in the journal. Add a short one.",
    });
  }

  return lints.sort((a, b) => RANK[a.level] - RANK[b.level]);
}
