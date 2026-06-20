import { describe, expect, it } from "vitest";
import {
  defaultState,
  emptyState,
  fieldId,
  generateUnitFile,
} from "./systemd-generate";

describe("fieldId", () => {
  it("combines section index and directive key", () => {
    expect(fieldId(1, "ExecStart")).toBe("1.ExecStart");
  });
});

describe("emptyState", () => {
  it("includes only options that define a default", () => {
    const state = emptyState();
    const keys = Object.keys(state);

    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => /^\d+\./.test(k))).toBe(true);
    expect(state[fieldId(1, "Type")]).toBe("simple");
  });
});

describe("defaultState", () => {
  it("extends emptyState with starter example values", () => {
    const state = defaultState();

    expect(state[fieldId(0, "Description")]).toBe("My example service");
    expect(state[fieldId(1, "ExecStart")]).toBe(
      "/usr/local/bin/myapp --port 8080"
    );
    expect(state[fieldId(1, "User")]).toBe("myapp");
  });
});

describe("generateUnitFile", () => {
  it("returns a placeholder when no directives are emitted", () => {
    const result = generateUnitFile({});

    expect(result.count).toBe(0);
    expect(result.content).toContain("Your unit file will appear here");
  });

  it("emits sections in Unit → Service → Install order", () => {
    const state = {
      [fieldId(3, "WantedBy")]: "multi-user.target",
      [fieldId(0, "Description")]: "Test service",
      [fieldId(1, "ExecStart")]: "/bin/true",
    };

    const { content } = generateUnitFile(state);
    const unitPos = content.indexOf("[Unit]");
    const servicePos = content.indexOf("[Service]");
    const installPos = content.indexOf("[Install]");

    expect(unitPos).toBeLessThan(servicePos);
    expect(servicePos).toBeLessThan(installPos);
    expect(content).toContain("Description=Test service");
    expect(content).toContain("ExecStart=/bin/true");
    expect(content).toContain("WantedBy=multi-user.target");
  });

  it("skips boolean directives that match their default", () => {
    const state = {
      [fieldId(2, "NoNewPrivileges")]: "no",
      [fieldId(1, "ExecStart")]: "/bin/true",
    };

    const { content } = generateUnitFile(state);

    expect(content).not.toContain("NoNewPrivileges=");
    expect(content).toContain("ExecStart=/bin/true");
  });

  it("emits boolean directives when changed from default", () => {
    const state = {
      [fieldId(2, "NoNewPrivileges")]: "yes",
      [fieldId(1, "ExecStart")]: "/bin/true",
    };

    const { content } = generateUnitFile(state);

    expect(content).toContain("NoNewPrivileges=yes");
  });

  it("emits one line per non-empty textarea row", () => {
    const state = {
      [fieldId(1, "Environment")]: "FOO=bar\nBAZ=qux\n",
      [fieldId(1, "ExecStart")]: "/bin/true",
    };

    const { content, count } = generateUnitFile(state);

    expect(content).toContain("Environment=FOO=bar");
    expect(content).toContain("Environment=BAZ=qux");
    expect(count).toBe(3);
  });

  it("skips select values that match the default", () => {
    const state = {
      [fieldId(1, "Type")]: "simple",
      [fieldId(1, "ExecStart")]: "/bin/true",
    };

    const { content } = generateUnitFile(state);

    expect(content).not.toContain("Type=");
  });

  it("generates output from the default starter state", () => {
    const { content, count } = generateUnitFile(defaultState());

    expect(count).toBeGreaterThan(0);
    expect(content).toContain("[Unit]");
    expect(content).toContain("[Service]");
    expect(content).toContain("Description=My example service");
    expect(content).toContain("ExecStart=/usr/local/bin/myapp --port 8080");
  });
});
