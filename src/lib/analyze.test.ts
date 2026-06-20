import { describe, expect, it } from "vitest";
import { defaultState, emptyState, fieldId } from "./systemd-generate";
import { hardeningScore, validate } from "./analyze";

const SERVICE = 1;
const HARDENING = 2;
const INSTALL = 3;

describe("hardeningScore", () => {
  it("returns a low score for an unhardened default form", () => {
    const result = hardeningScore(defaultState());

    expect(result.total).toBe(11);
    expect(result.score).toBeLessThan(5);
    expect(result.passed).toBeLessThan(result.total);
  });

  it("increases score when hardening directives are enabled", () => {
    const form = {
      ...defaultState(),
      [fieldId(HARDENING, "NoNewPrivileges")]: "yes",
      [fieldId(HARDENING, "PrivateTmp")]: "yes",
      [fieldId(HARDENING, "ProtectSystem")]: "full",
      [fieldId(HARDENING, "ProtectHome")]: "yes",
      [fieldId(HARDENING, "SystemCallFilter")]: "@system-service",
    };

    const result = hardeningScore(form);

    expect(result.score).toBeGreaterThan(4);
    expect(result.checks.find((c) => c.label === "NoNewPrivileges")?.satisfied).toBe(
      true
    );
    expect(result.checks.find((c) => c.label === "ProtectSystem")?.satisfied).toBe(
      true
    );
  });

  it("counts a non-root User as satisfying the non-root check", () => {
    const form = {
      ...emptyState(),
      [fieldId(SERVICE, "User")]: "myapp",
    };

    const result = hardeningScore(form);

    expect(
      result.checks.find((c) => c.label === "Non-root user")?.satisfied
    ).toBe(true);
  });
});

describe("validate", () => {
  it("reports an error when ExecStart is missing for non-oneshot types", () => {
    const form = {
      ...emptyState(),
      [fieldId(SERVICE, "Type")]: "simple",
    };

    const lints = validate(form);
    const error = lints.find((l) => l.level === "error");

    expect(error?.message).toContain("ExecStart= is required");
  });

  it("warns about forking without PIDFile", () => {
    const form = {
      ...emptyState(),
      [fieldId(SERVICE, "Type")]: "forking",
      [fieldId(SERVICE, "ExecStart")]: "/usr/sbin/daemon",
    };

    const lints = validate(form);

    expect(
      lints.some((l) => l.level === "warning" && l.message.includes("PIDFile="))
    ).toBe(true);
  });

  it("warns when Install has no WantedBy or RequiredBy", () => {
    const form = {
      ...emptyState(),
      [fieldId(SERVICE, "ExecStart")]: "/bin/true",
      [fieldId(INSTALL, "WantedBy")]: "",
    };

    const lints = validate(form);

    expect(
      lints.some(
        (l) => l.level === "warning" && l.message.includes("systemctl enable")
      )
    ).toBe(true);
  });

  it("nudges After=network-online without Wants=", () => {
    const form = {
      ...emptyState(),
      [fieldId(0, "After")]: "network-online.target",
      [fieldId(SERVICE, "ExecStart")]: "/bin/true",
      [fieldId(INSTALL, "WantedBy")]: "multi-user.target",
    };

    const lints = validate(form);

    expect(
      lints.some(
        (l) =>
          l.level === "info" &&
          l.message.includes("Wants=network-online.target")
      )
    ).toBe(true);
  });

  it("sorts lints with errors before warnings and info", () => {
    const form = {
      ...emptyState(),
      [fieldId(0, "After")]: "network-online.target",
      [fieldId(SERVICE, "Type")]: "forking",
      [fieldId(SERVICE, "ExecStart")]: "/usr/sbin/daemon",
    };

    const lints = validate(form);
    const levels = lints.map((l) => l.level);

    expect(levels.indexOf("error")).toBe(-1);
    expect(levels.indexOf("warning")).toBeLessThan(levels.lastIndexOf("info"));
  });
});
