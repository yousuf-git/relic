import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, type TextInputInstance } from "react-native";
import { haptic } from "@/design/haptics";
import { signUpEmail } from "@/lib/auth";
import { Button } from "@/ui/Button";
import { GoogleButton } from "./GoogleButton";
import { Field, Notice, OrDivider, RegisterPage, ShowHide, StrengthMeter, SwitchLink } from "./Register";
import { googleSignInEnabled } from "./flags";
import { PASSWORD_MAX, checkEmail, checkName, checkPassword, describeAuthError, passwordStrength, type Failure } from "./validation";
import "./strings";

type Column = "name" | "email" | "password";

export function SignUpScreen() {
  const { t } = useTranslation("welcome");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Column, boolean>>>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const touch = (column: Column) => setTouched((s) => ({ ...s, [column]: true }));
  const problems = {
    name: checkName(name),
    email: checkEmail(email),
    password: checkPassword(password, { choosing: true }),
  };
  const errorFor = (column: Column) =>
    failure?.field === column ? t(failure.key) : touched[column] && problems[column] ? t(`validation.${problems[column]}`) : null;

  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setFailure(null);
  };

  const submit = async () => {
    if (busy) return;
    setTouched({ name: true, email: true, password: true });
    const firstInvalid = problems.name ? nameRef : problems.email ? emailRef : problems.password ? passwordRef : null;
    if (firstInvalid) {
      haptic.warn();
      firstInvalid.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    setFailure(null);
    try {
      await signUpEmail(name.trim(), email.trim(), password);
    } catch (e) {
      haptic.warn();
      setFailure(describeAuthError(e));
      setBusy(false);
    }
  };

  return (
    <RegisterPage
      title={t("signUp.title")}
      body={t("signUp.body")}
      footer={<SwitchLink prompt={t("signUp.switchPrompt")} action={t("signUp.switchAction")} onPress={() => router.replace("/sign-in")} />}
    >
      <Field
        ref={nameRef}
        numeral="I"
        label={t("fields.name.label")}
        placeholder={t("fields.name.placeholder")}
        value={name}
        onChangeText={edit(setName)}
        onBlur={() => touch("name")}
        error={errorFor("name")}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
        editable={!busy}
      />
      <Field
        ref={emailRef}
        numeral="II"
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
        numeral="III"
        label={t("fields.password.label")}
        placeholder={t("fields.password.placeholder")}
        value={password}
        onChangeText={edit(setPassword)}
        onBlur={() => touch("password")}
        error={errorFor("password")}
        below={<StrengthMeter level={passwordStrength(password)} />}
        trailing={<ShowHide shown={shown} onToggle={() => setShown((s) => !s)} />}
        secureTextEntry={!shown}
        autoComplete="new-password"
        textContentType="newPassword"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        maxLength={PASSWORD_MAX}
        returnKeyType="go"
        onSubmitEditing={submit}
        editable={!busy}
      />
      {failure && !failure.field ? <Notice message={t(failure.key)} /> : null}
      <Button label={t("signUp.submit")} loading={busy} onPress={submit} />
      {googleSignInEnabled ? (
        <>
          <OrDivider />
          <GoogleButton onFailure={setFailure} />
        </>
      ) : null}
    </RegisterPage>
  );
}
