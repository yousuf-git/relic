// Hold-to-speak dictation on the device's own recognizer (no AI). Interim words
// stream in live; each final segment is handed to `onText`. While the keeper is
// still holding, a recognizer that stops by itself is quietly restarted.
import { getLocales } from "expo-localization";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { duration, timing } from "@/design/motion";
import { withLockPaused } from "@/features/lock/useAppLock";
import { speech } from "./speechModule";

export type SpeechState = "idle" | "starting" | "listening";
export type SpeechProblem = "denied" | "blocked" | "unavailable" | "network" | "noSpeech" | "failed";

const MAX_RESTARTS = 12;
const VOLUME_MAX = 10;

const recognitionLocale = () => getLocales()[0]?.languageTag ?? "en-US";
const sameLocale = (a: string, b: string) => a.replace("_", "-").toLowerCase() === b.replace("_", "-").toLowerCase();

function recognitionAvailable(): boolean {
  try {
    return !!speech?.ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export function useSpeechToText(onText: (text: string) => void) {
  const mod = speech?.ExpoSpeechRecognitionModule ?? null;
  const [state, setState] = useState<SpeechState>("idle");
  const [interim, setInterim] = useState("");
  const [problem, setProblem] = useState<SpeechProblem | null>(null);
  const [supported] = useState(recognitionAvailable);
  const level = useSharedValue(0);

  const want = useRef(false);
  const live = useRef(false);
  const interimRef = useRef("");
  const gotText = useRef(false);
  const restarts = useRef(0);
  const fatal = useRef(false);
  const usedOnDevice = useRef(false);
  const forceNetwork = useRef(false);
  const modelInstalled = useRef(false);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => {
    if (!mod || !supported || !mod.supportsOnDeviceRecognition()) return;
    let cancelled = false;
    mod
      .getSupportedLocales({})
      .then(({ installedLocales }) => {
        if (!cancelled) modelInstalled.current = installedLocales.some((l) => sameLocale(l, recognitionLocale()));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mod, supported]);

  const commit = useCallback((text: string) => {
    const spoken = text.trim();
    if (!spoken) return;
    gotText.current = true;
    onTextRef.current(spoken);
  }, []);

  const startSession = useCallback(() => {
    if (!mod) return;
    const onDevice = modelInstalled.current && !forceNetwork.current;
    usedOnDevice.current = onDevice;
    fatal.current = false;
    live.current = true;
    mod.start({
      lang: recognitionLocale(),
      interimResults: true,
      // Continuous mode also silences the system beep, but needs Android 13+.
      continuous: Platform.OS !== "android" || Number(Platform.Version) >= 33,
      requiresOnDeviceRecognition: onDevice,
      addsPunctuation: onDevice,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 120 },
    });
  }, [mod]);

  useEffect(() => {
    if (!mod) return;
    const subs = [
      mod.addListener("start", () => setState("listening")),
      mod.addListener("result", (e) => {
        const text = e.results[0]?.transcript ?? "";
        if (e.isFinal) {
          interimRef.current = "";
          setInterim("");
          commit(text);
        } else {
          interimRef.current = text;
          setInterim(text);
        }
      }),
      mod.addListener("volumechange", (e) => {
        level.set(withTiming(Math.min(Math.max(e.value, 0), VOLUME_MAX) / VOLUME_MAX, timing(duration.quick)));
      }),
      mod.addListener("error", (e) => {
        switch (e.error) {
          case "aborted":
          case "no-speech":
          case "speech-timeout":
            return;
          case "service-not-allowed":
          case "language-not-supported":
            if (usedOnDevice.current) {
              forceNetwork.current = true;
              return;
            }
            fatal.current = true;
            setProblem("unavailable");
            return;
          case "not-allowed":
            fatal.current = true;
            setProblem("blocked");
            return;
          case "network":
            fatal.current = true;
            setProblem("network");
            return;
          default:
            fatal.current = true;
            setProblem("failed");
        }
      }),
      mod.addListener("end", () => {
        live.current = false;
        const leftover = interimRef.current;
        interimRef.current = "";
        setInterim("");
        commit(leftover);
        level.set(withTiming(0, timing(duration.short)));
        if (want.current && !fatal.current && restarts.current < MAX_RESTARTS) {
          restarts.current += 1;
          startSession();
          return;
        }
        want.current = false;
        setState("idle");
        if (!gotText.current && !fatal.current) setProblem("noSpeech");
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [mod, commit, level, startSession]);

  useEffect(
    () => () => {
      want.current = false;
      if (live.current) mod?.abort();
    },
    [mod],
  );

  const begin = useCallback(async () => {
    if (!mod || !supported) {
      setProblem("unavailable");
      return;
    }
    if (want.current) return;
    want.current = true;
    restarts.current = 0;
    gotText.current = false;
    forceNetwork.current = false;
    setProblem(null);
    setState("starting");
    try {
      const permission = await withLockPaused(() => mod.requestPermissionsAsync());
      if (!permission.granted) {
        want.current = false;
        setState("idle");
        setProblem(permission.canAskAgain ? "denied" : "blocked");
        return;
      }
    } catch {
      want.current = false;
      setState("idle");
      setProblem("failed");
      return;
    }
    if (!want.current) {
      setState("idle");
      return;
    }
    startSession();
  }, [mod, supported, startSession]);

  const stop = useCallback(() => {
    want.current = false;
    if (live.current) mod?.stop();
    else setState("idle");
  }, [mod]);

  const clearProblem = useCallback(() => setProblem(null), []);

  return { supported, state, interim, problem, level, begin, stop, clearProblem };
}
