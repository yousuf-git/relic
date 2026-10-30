import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet, type TextInputInstance } from "react-native";
import { haptic } from "@/design/haptics";
import { color, minTarget, space } from "@/design/tokens";
import { signInEmail } from "@/lib/auth";
import { Button } from "@/ui/Button";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { GoogleButton } from "./GoogleButton";
import { Field, Notice, OrDivider, RegisterPage, ShowHide, SwitchLink } from "./Register";
import { googleSignInEnabled } from "./flags";
import { PASSWORD_MAX, checkEmail, checkPassword, describeAuthError, type Failure } from "./validation";
import "./strings";

type Column = "email" | "password";

export function SignInScreen() {
  const { t } = useTranslation("welcome");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Column, boolean>>>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const touch = (column: Column) => setTouched((s) => ({ ...s, [column]: true }));
  const problems = { email: checkEmail(email), password: checkPassword(password, { choosing: false }) };
  const errorFor = (column: Column) =>
    failure?.field === column ? t(failure.key) : touched[column] && problems[column] ? t(`validation.${problems[column]}`) : null;

  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setFailure(null);
  };

  const submit = async () => {
    if (busy) return;
    setTouched({ email: true, password: true });
    const firstInvalid = problems.email ? emailRef : problems.password ? passwordRef : null;
    if (firstInvalid) {
      haptic.warn();
      firstInvalid.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    setFailure(null);
    try {
      await signInEmail(email.trim(), password);
    } catch (e) {
      haptic.warn();
      setFailure(describeAuthError(e));
      setBusy(false);
    }
  };

  const forgot = () => {
    const typed = email.trim();
    router.push(typed ? { pathname: "/reset", params: { email: typed } } : "/reset");
  };

  return (
    <RegisterPage
      title={t("signIn.title")}
      body={t("signIn.body")}
      footer={<SwitchLink prompt={t("signIn.switchPrompt")} action={t("signIn.switchAction")} onPress={() => router.replace("/sign-up")} />}
    >
      <Field
        ref={emailRef}
        numeral="I"
        label={t("fields.email.label")}
        placeholder={t("fields.email.placeholder")}
        value={email}
        onChangeText={edit(setEmail)}
        onBlur={() => touch("email")}
        error={errorFor("email")}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!busy}
      />
      <Field
        ref={passwordRef}
        numeral="II"
        label={t("fields.password.label")}
        placeholder={t("fields.password.placeholder")}
        value={password}
        onChangeText={edit(setPassword)}
        onBlur={() => touch("password")}
        error={errorFor("password")}
        trailing={<ShowHide shown={shown} onToggle={() => setShown((s) => !s)} />}
        secureTextEntry={!shown}
        autoComplete="current-password"
        textContentType="password"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        maxLength={PASSWORD_MAX}
        returnKeyType="go"
        onSubmitEditing={submit}
        editable={!busy}
      />
      <Pressable accessibilityLabel={t("signIn.forgot")} onPress={forgot} style={styles.forgot}>
        <Text variant="bodySmall" style={{ color: color.lamp }}>
          {t("signIn.forgot")}
        </Text>
      </Pressable>
      {failure && !failure.field ? <Notice message={t(failure.key)} /> : null}
      <Button label={t("signIn.submit")} loading={busy} onPress={submit} />
      {googleSignInEnabled ? (
        <>
          <OrDivider />
          <GoogleButton onFailure={setFailure} />
        </>
      ) : null}
    </RegisterPage>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: "flex-start", minHeight: minTarget, justifyContent: "center", marginTop: -space.md },
});
