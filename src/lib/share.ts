import {
  DEFAULT_UNIT_NAME,
  defaultStateFor,
  type FormState,
  type UnitMode,
} from "./systemd-generate";

type SharePayload = {
  /** unit file name */
  u: string;
  /** unit kind; absent in links created before timer support (= service) */
  m?: UnitMode;
  /** only the fields that differ from the default starting state */
  f: Record<string, string>;
};

function base64urlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Encode the current form into a compact, URL-safe token. Only fields that
 * differ from defaultState() are stored, keeping links short.
 */
export function encodeShare(
  form: FormState,
  unitName: string,
  mode: UnitMode = "service"
): string {
  const base = defaultStateFor(mode);
  const changed: Record<string, string> = {};
  for (const [k, v] of Object.entries(form)) {
    if ((base[k] ?? "") !== v) changed[k] = v;
  }
  const payload: SharePayload = { u: unitName, f: changed };
  if (mode !== "service") payload.m = mode;
  return base64urlEncode(JSON.stringify(payload));
}

/** Decode a share token back into form state. Returns null on malformed input. */
export function decodeShare(
  token: string
): { form: FormState; unitName: string; mode: UnitMode } | null {
  try {
    const payload = JSON.parse(base64urlDecode(token)) as SharePayload;
    if (!payload || typeof payload !== "object" || typeof payload.f !== "object")
      return null;
    const mode: UnitMode = payload.m === "timer" ? "timer" : "service";
    return {
      form: { ...defaultStateFor(mode), ...payload.f },
      unitName:
        typeof payload.u === "string" ? payload.u : DEFAULT_UNIT_NAME[mode],
      mode,
    };
  } catch {
    return null;
  }
}
