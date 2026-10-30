import { AuthError } from "@/lib/auth";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Problem = "nameRequired" | "emailRequired" | "emailInvalid" | "passwordRequired" | "passwordShort" | "passwordLong";

export const checkName = (name: string): Problem | null => (name.trim() ? null : "nameRequired");

export function checkEmail(email: string): Problem | null {
  const value = email.trim();
  if (!value) return "emailRequired";
  return EMAIL.test(value) ? null : "emailInvalid";
}

/** The minimum only applies when choosing a password; sign-in must accept whatever the account already has. */
export function checkPassword(password: string, { choosing }: { choosing: boolean }): Problem | null {
  if (!password) return "passwordRequired";
  if (password.length > PASSWORD_MAX) return "passwordLong";
  if (choosing && password.length < PASSWORD_MIN) return "passwordShort";
  return null;
}

export type Strength = 0 | 1 | 2 | 3 | 4;
export const strengthKeys = ["empty", "short", "fair", "good", "strong"] as const;

/** A hint, not a gate: length and variety only. The one enforced rule is PASSWORD_MIN. */
export function passwordStrength(password: string): Strength {
  if (!password) return 0;
  if (password.length < PASSWORD_MIN) return 1;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const level = 2 + Number(password.length >= 12) + Number(classes >= 3);
  return (new Set(password).size < 4 ? Math.min(level, 2) : level) as Strength;
}

export type Failure = { field?: "email" | "password"; key: string };

/** Maps a thrown sign-in/up/reset error to a translation key (welcome namespace unless prefixed). */
export function describeAuthError(error: unknown): Failure {
  if (error instanceof AuthError) {
    switch (error.code) {
      case "USER_ALREADY_EXISTS":
      case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
        return { field: "email", key: "errors.exists" };
      case "INVALID_EMAIL_OR_PASSWORD":
      case "INVALID_PASSWORD":
      case "USER_NOT_FOUND":
        return { key: "errors.mismatch" };
      case "INVALID_EMAIL":
        return { field: "email", key: "validation.emailInvalid" };
      case "PASSWORD_TOO_SHORT":
        return { field: "password", key: "validation.passwordShort" };
      case "PASSWORD_TOO_LONG":
        return { field: "password", key: "validation.passwordLong" };
      case "EMAIL_NOT_VERIFIED":
        return { key: "errors.unverified" };
      case "SESSION_EXPIRED":
        return { key: "common:errors.sessionEnded" };
    }
    if (error.status === 429) return { key: "errors.tooMany" };
  }
  // fetch rejects with a TypeError when there is no connection.
  if (error instanceof TypeError) return { key: "common:errors.offline" };
  return { key: "common:errors.generic" };
}
