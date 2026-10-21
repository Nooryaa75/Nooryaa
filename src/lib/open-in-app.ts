export type AppBrowser = "android" | "ios" | null;

export function appBrowser(userAgent: string, native: boolean, platform?: string, touchPoints = 0): AppBrowser {
  if (native || platform === "android" || platform === "ios") return null;
  if (/android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && touchPoints > 1)) return "ios";
  return null;
}

export const IOS_APP_OPEN_URL = "nooryaa://open";