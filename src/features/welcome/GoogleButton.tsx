import { useState } from "react";
import { useTranslation } from "react-i18next";
import { haptic } from "@/design/haptics";
import { AuthError, signInGoogleIdToken } from "@/lib/auth";
import { Button } from "@/ui/Button";
import { getGoogleIdToken } from "./google";
import { describeAuthError, type Failure } from "./validation";
import "./strings";

/** Render only behind `googleSignInEnabled`. Success flips useAuth, which swaps the stack to the vault. */
export function GoogleButton({ onFailure }: { onFailure: (failure: Failure) => void }) {
  const { t } = useTranslation("welcome");
  const [busy, setBusy] = useState(false);

  const press = async () => {
    setBusy(true);
    try {
      await signInGoogleIdToken(await getGoogleIdToken());
    } catch (e) {
      setBusy(false);
      if (e instanceof AuthError && e.code === "GOOGLE_CANCELLED") return;
      haptic.warn();
      onFailure(describeAuthError(e));
    }
  };

  return <Button tone="ghost" label={t("google.continue")} loading={busy} onPress={press} />;
}
