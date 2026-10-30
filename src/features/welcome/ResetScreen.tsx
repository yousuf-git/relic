import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet, View, type TextInputInstance } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { art } from "@/design/art";
import { haptic } from "@/design/haptics";
import { distance, duration, ease, spring, timing, useReducedMotion } from "@/design/motion";
import { color, moodLight, space } from "@/design/tokens";
import { requestPasswordReset } from "@/lib/auth";
import { Button } from "@/ui/Button";
import { Glow } from "@/ui/Glow";
import { Field, Notice, RegisterPage } from "./Register";
import { Vignette } from "./Scene";
import { checkEmail, describeAuthError, type Failure } from "./validation";
import "./strings";

const LETTER = 168;
const GLOW = LETTER * 1.7;

export function ResetScreen() {
  const { t } = useTranslation("welcome");
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [touched, setTouched] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const emailRef = useRef<TextInputInstance>(null);

  const problem = checkEmail(email);
  const error = failure?.field === "email" ? t(failure.key) : touched && problem ? t(`validation.${problem}`) : null;

  const submit = async () => {
    if (busy) return;
    setTouched(true);
    if (problem) {
      haptic.warn();
      emailRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    setFailure(null);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (e) {
      haptic.warn();
      setFailure(describeAuthError(e));
    }
    setBusy(false);
  };

  const backToSignIn = () => (router.canGoBack() ? router.back() : router.replace("/sign-in"));

  return (
    <RegisterPage
      title={sentTo ? t("reset.sentTitle") : t("reset.title")}
      body={sentTo ? t("reset.sentBody", { email: sentTo }) : t("reset.body")}
    >
      {sentTo ? (
        <>
          <LetterOnItsWay />
          <Button label={t("reset.backToSignIn")} onPress={backToSignIn} />
          <Button
            tone="quiet"
            label={t("reset.anotherEmail")}
            onPress={() => {
              setSentTo(null);
              setEmail("");
              setTouched(false);
            }}
          />
        </>
      ) : (
        <>
          <Field
            ref={emailRef}
            numeral="I"
            label={t("fields.email.label")}
            placeholder={t("fields.email.placeholder")}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setFailure(null);
            }}
            onBlur={() => setTouched(true)}
            error={error}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="send"
            onSubmitEditing={submit}
            editable={!busy}
          />
          {failure && !failure.field ? <Notice message={t(failure.key)} /> : null}
          <Button label={t("reset.submit")} loading={busy} onPress={submit} />
        </>
      )}
    </RegisterPage>
  );
}

/** The folded letter drops in and settles, the one sanctioned overshoot. */
function LetterOnItsWay() {
  const { t } = useTranslation("welcome");
  const reduced = useReducedMotion();
  const arrive = useSharedValue(0);
  useEffect(() => {
    arrive.set(reduced ? withTiming(1, timing(duration.medium, ease.develop)) : withSpring(1, spring.drop));
    haptic.sealed();
  }, [reduced, arrive]);
  const style = useAnimatedStyle(() => {
    const a = arrive.get();
    return reduced
      ? { opacity: a }
      : { opacity: interpolate(a, [0, 0.4, 1], [0, 1, 1], "clamp"), transform: [{ translateY: interpolate(a, [0, 1], [-distance.page, 0]) }] };
  });
  return (
    <Animated.View style={[styles.letter, style]} accessible accessibilityRole="image" accessibilityLabel={t("reset.sentArt")}>
      <Glow size={GLOW} tint={moodLight.honey} intensity={0.3} style={styles.glow} />
      <View style={styles.art}>
        <Image source={art.vessel.letter} contentFit="cover" style={StyleSheet.absoluteFill} />
        <Vignette size={LETTER} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  letter: { alignSelf: "center", width: LETTER, height: LETTER, marginVertical: space.sm },
  glow: { position: "absolute", left: (LETTER - GLOW) / 2, top: (LETTER - GLOW) / 2 },
  art: { width: LETTER, height: LETTER, backgroundColor: color.shaft },
});
