import { describe, expect, it } from "vitest";
import { defaultState, defaultTimerState, fieldId } from "./systemd-generate";
import { decodeShare, encodeShare } from "./share";

describe("encodeShare / decodeShare", () => {
  it("round-trips form state and unit name", () => {
    const form = defaultState();
    form[fieldId(0, "Description")] = "Shared service";
    form[fieldId(1, "ExecStart")] = "/usr/bin/app";

    const token = encodeShare(form, "shared.service");
    const decoded = decodeShare(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.unitName).toBe("shared.service");
    expect(decoded!.form[fieldId(0, "Description")]).toBe("Shared service");
    expect(decoded!.form[fieldId(1, "ExecStart")]).toBe("/usr/bin/app");
    expect(decoded!.form[fieldId(1, "User")]).toBe("myapp");
  });

  it("only stores fields that differ from defaultState", () => {
    const form = defaultState();
    form[fieldId(0, "Description")] = "Only this changed";

    const token = encodeShare(form, "myapp.service");
    const payload = JSON.parse(
      atob(token.replace(/-/g, "+").replace(/_/g, "/"))
    );

    expect(Object.keys(payload.f)).toEqual([fieldId(0, "Description")]);
    expect(payload.f[fieldId(0, "Description")]).toBe("Only this changed");
  });

  it("returns null for malformed tokens", () => {
    expect(decodeShare("not-valid-base64!!!")).toBeNull();
    expect(decodeShare("")).toBeNull();
  });

  it("falls back to default unit name when payload omits u", () => {
    const payload = btoa(JSON.stringify({ f: {} }));
    const decoded = decodeShare(payload);

    expect(decoded).not.toBeNull();
    expect(decoded!.unitName).toBe("myapp.service");
  });

  it("round-trips timer mode", () => {
    const form = defaultTimerState();
    form[fieldId(1, "OnCalendar")] = "weekly";

    const decoded = decodeShare(encodeShare(form, "backup.timer", "timer"));

    expect(decoded!.mode).toBe("timer");
    expect(decoded!.unitName).toBe("backup.timer");
    expect(decoded!.form[fieldId(1, "OnCalendar")]).toBe("weekly");
    expect(decoded!.form[fieldId(1, "Persistent")]).toBe("yes");
  });

  it("treats links without a mode as service links", () => {
    const decoded = decodeShare(encodeShare(defaultState(), "a.service"));

    expect(decoded!.mode).toBe("service");
  });
});
