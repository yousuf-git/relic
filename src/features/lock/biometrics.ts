// The only file that talks to expo-local-authentication. On Android, authenticateAsync
// accepts biometrics or the device PIN/pattern, so a phone with only a PIN still works.
import {
  SecurityLevel,
  authenticateAsync,
  getEnrolledLevelAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  type LocalAuthenticationError,
} from "expo-local-authentication";
import i18n from "@/i18n";
import "./strings";

/** "biometric": fingerprint/face enrolled. "device": PIN, pattern or password only. "none": nothing to authenticate with. */
export type LockCapability = "biometric" | "device" | "none";

export type AuthFailure = "cancelled" | "unavailable" | "lockout" | "failed";
export type AuthResult = { ok: true } | { ok: false; reason: AuthFailure };

export async function getLockCapability(): Promise<LockCapability> {
  try {
    const [hasHardware, enrolled, level] = await Promise.all([hasHardwareAsync(), isEnrolledAsync(), getEnrolledLevelAsync()]);
    if (level === SecurityLevel.NONE) return "none";
    return hasHardware && enrolled ? "biometric" : "device";
  } catch {
    return "none";
  }
}

let inFlight = false;

/** True while a system prompt is up; Android may report the app as backgrounded behind it. */
export const isAuthenticating = () => inFlight;

function failureFor(error: LocalAuthenticationError): AuthFailure {
  switch (error) {
    case "user_cancel":
    case "system_cancel":
    case "app_cancel":
    case "user_fallback":
      return "cancelled";
    case "not_enrolled":
    case "not_available":
    case "passcode_not_set":
      return "unavailable";
    case "lockout":
      return "lockout";
    default:
      return "failed";
  }
}

export async function authenticate(reason: "unlock" | "enable" | "disable"): Promise<AuthResult> {
  if (inFlight) return { ok: false, reason: "cancelled" };
  inFlight = true;
  try {
    if ((await getLockCapability()) === "none") return { ok: false, reason: "unavailable" };
    const result = await authenticateAsync({
      promptMessage: i18n.t(`lock:prompt.${reason}.title`),
      promptSubtitle: i18n.t(`lock:prompt.${reason}.subtitle`),
    });
    return result.success ? { ok: true } : { ok: false, reason: failureFor(result.error) };
  } catch {
    return { ok: false, reason: "failed" };
  } finally {
    inFlight = false;
  }
}
