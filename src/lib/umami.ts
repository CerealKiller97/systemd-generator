export const UMAMI_ORIGIN = "https://analytics.stefanbogdanovic.dev";
export const UMAMI_SCRIPT_URL = `${UMAMI_ORIGIN}/script.js`;

type UmamiTracker = {
  track: (
    event: string | ((props: Record<string, unknown>) => Record<string, unknown>),
    data?: Record<string, string | number | boolean>
  ) => void;
};

export function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  const umami = (window as Window & { umami?: UmamiTracker }).umami;
  if (!umami?.track) return;

  if (data) {
    umami.track(name, data);
  } else {
    umami.track(name);
  }
}
