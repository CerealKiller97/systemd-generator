import { defaultState, type FormState } from "./systemd-generate";

interface SharePayload {
  /** unit file name */
  u: string;
  /** only the fields that differ from the default starting state */
  f: Record<string, string>;
}

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
export function encodeShare(form: FormState, unitName: string): string {
  const base = defaultState();
  const changed: Record<string, string> = {};
  for (const [k, v] of Object.entries(form)) {
    if ((base[k] ?? "") !== v) changed[k] = v;
  }
  const payload: SharePayload = { u: unitName, f: changed };
  return base64urlEncode(JSON.stringify(payload));
}

/** Decode a share token back into form state. Returns null on malformed input. */
export function decodeShare(
  token: string
): { form: FormState; unitName: string } | null {
  try {
    const payload = JSON.parse(base64urlDecode(token)) as SharePayload;
    if (!payload || typeof payload !== "object" || typeof payload.f !== "object")
      return null;
    return {
      form: { ...defaultState(), ...payload.f },
      unitName: typeof payload.u === "string" ? payload.u : "myapp.service",
    };
  } catch {
    return null;
  }
}
