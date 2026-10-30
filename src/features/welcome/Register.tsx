// The register's furniture: a leaf of ruled stone, numbered columns, entries written on a line.
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { art } from "@/design/art";
import { duration, timing } from "@/design/motion";
import { color, font, minTarget, space } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { strengthKeys, type Strength } from "./validation";
import "./strings";

const GLOW = 360;
const TEXTURE_OPACITY = 0.35;

export function RegisterPage({ title, body, children, footer }: { title: string; body: string; children: ReactNode; footer?: ReactNode }) {
  const { t } = useTranslation("welcome");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Screen edges={["top"]}>
      <Image source={art.texture.stone} contentFit="cover" style={[StyleSheet.absoluteFill, { opacity: TEXTURE_OPACITY }]} />
      <Glow size={GLOW} tint={color.lamp} intensity={0.16} style={styles.lampPool} />
      <View style={styles.marginOuter} pointerEvents="none" />
      <View style={styles.marginInner} pointerEvents="none" />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
        >
          <Pressable
            accessibilityLabel={t("register.back")}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={styles.back}
          >
            <Icon name="back" />
          </Pressable>
          <View style={styles.eyebrow}>
            <Icon name="nut" size={16} color={color.lamp} />
            <Text variant="label">{t("register.eyebrow")}</Text>
          </View>
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text variant="body" style={styles.body}>
            {body}
          </Text>
          <View style={styles.form}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

type FieldProps = Omit<TextInputProps, "style"> & {
  ref?: Ref<TextInputInstance>;
  numeral: string;
  label: string;
  error?: string | null;
  below?: ReactNode;
  trailing?: ReactNode;
};

/** One register column: numeral and label above, the entry written on a rule that lights when you write. */
export function Field({ ref, numeral, label, error, below, trailing, onFocus, onBlur, ...input }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const ink = useSharedValue(0);
  useEffect(() => {
    ink.set(withTiming(focused ? 1 : 0, timing(duration.short)));
  }, [focused, ink]);
  const inkStyle = useAnimatedStyle(() => ({ opacity: ink.get() }));

  return (
    <View style={styles.field}>
      <View style={styles.labelRow} accessible={false} importantForAccessibility="no-hide-descendants">
        <Text variant="label" style={{ color: color.lampDeep }}>
          {numeral}
        </Text>
        <Text variant="label" style={{ color: focused ? color.paper : color.ash }}>
          {label}
        </Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={color.faint}
          cursorColor={color.lamp}
          selectionColor={color.lamp}
          maxFontSizeMultiplier={1.6}
          {...input}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {trailing}
      </View>
      <View style={[styles.rule, error ? { backgroundColor: color.danger } : null]}>
        <Animated.View style={[styles.ink, inkStyle, error ? { opacity: 0 } : null]} />
      </View>
      {error ? (
        <Animated.View entering={FadeIn.duration(duration.short)} accessibilityLiveRegion="polite">
          <Text variant="bodySmall" style={{ color: color.danger }}>
            {error}
          </Text>
        </Animated.View>
      ) : (
        below
      )}
    </View>
  );
}

export function ShowHide({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const { t } = useTranslation("welcome");
  return (
    <Pressable
      accessibilityLabel={shown ? t("fields.password.hideLabel") : t("fields.password.showLabel")}
      onPress={onToggle}
      style={styles.toggle}
    >
      <Text variant="label" style={{ color: color.lamp }}>
        {shown ? t("fields.password.hide") : t("fields.password.show")}
      </Text>
    </Pressable>
  );
}

const strengthTone = [color.iron, color.danger, color.lampDeep, color.lamp, color.lamp] as const;

/** Four lamp-oil ticks and a line of copy. Lives under the password column. */
export function StrengthMeter({ level }: { level: Strength }) {
  const { t } = useTranslation("welcome");
  return (
    <View style={styles.strength}>
      <View style={styles.ticks} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {[1, 2, 3, 4].map((n) => (
          <View key={n} style={[styles.tick, n <= level ? { backgroundColor: strengthTone[level] } : null]} />
        ))}
      </View>
      <Text variant="bodySmall" accessibilityLiveRegion="polite">
        {t(`strength.${strengthKeys[level]}`)}
      </Text>
    </View>
  );
}

/** A form-level message: a marginal note in the register. */
export function Notice({ message }: { message: string }) {
  return (
    <Animated.View entering={FadeIn.duration(duration.short)} style={styles.notice} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.noticeBar} />
      <Text variant="bodySmall" style={styles.noticeText}>
        {message}
      </Text>
    </Animated.View>
  );
}

export function OrDivider() {
  const { t } = useTranslation("welcome");
  return (
    <View style={styles.or} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={styles.orLine} />
      <Text variant="label">{t("google.or")}</Text>
      <View style={styles.orLine} />
    </View>
  );
}

export function SwitchLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.switchRow}>
      <Text variant="bodySmall">{prompt}</Text>
      <Pressable accessibilityLabel={action} onPress={onPress} style={styles.switchAction}>
        <Text variant="button" style={{ color: color.lamp }}>
          {action}
        </Text>
      </Pressable>
    </View>
  );
}

const LEFT = space.xxl;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  lampPool: { position: "absolute", top: -GLOW / 2, right: -GLOW / 3 },
  marginOuter: { position: "absolute", top: 0, bottom: 0, left: space.lg + space.xs, width: 1, backgroundColor: color.lampDeep, opacity: 0.5 },
  marginInner: { position: "absolute", top: 0, bottom: 0, left: space.lg + space.xs + 4, width: 1, backgroundColor: color.lampDeep, opacity: 0.25 },
  content: { flexGrow: 1, paddingLeft: LEFT, paddingRight: space.lg, paddingTop: space.xs },
  back: { alignSelf: "flex-start", width: minTarget, height: minTarget, marginLeft: -space.sm, alignItems: "center", justifyContent: "center" },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: space.md },
  title: { marginTop: space.sm },
  body: { color: color.ash, marginTop: space.xs },
  form: { marginTop: space.xl, gap: space.lg },
  footer: { marginTop: space.xl, gap: space.md },
  field: { gap: space.xxs },
  labelRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, minHeight: minTarget + 4, paddingHorizontal: 0, paddingVertical: space.xs, fontFamily: font.body, fontSize: 18, color: color.paper },
  rule: { height: 1, backgroundColor: color.ironHigh },
  ink: { position: "absolute", left: 0, right: 0, bottom: 0, height: 2, backgroundColor: color.lamp },
  toggle: { minWidth: minTarget + space.sm, minHeight: minTarget, alignItems: "flex-end", justifyContent: "center" },
  strength: { gap: space.xs, paddingTop: space.xs },
  ticks: { flexDirection: "row", gap: space.xxs },
  tick: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: color.iron },
  notice: { flexDirection: "row", gap: space.sm },
  noticeBar: { width: 2, backgroundColor: color.danger },
  noticeText: { flex: 1, color: color.paper },
  or: { flexDirection: "row", alignItems: "center", gap: space.sm },
  orLine: { flex: 1, height: 1, backgroundColor: color.iron },
  switchRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.xs },
  switchAction: { minHeight: minTarget, justifyContent: "center", paddingHorizontal: space.xs },
});
