// One voice per relic, 60 seconds at most. expo-audio stops the take at the limit
// on its own; this hook turns either kind of stop into a single finished take.
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { duration } from "@/design/motion";
import { withLockPaused } from "@/features/lock/useAppLock";
import { LIMITS } from "@/lib/media";
import { fadeTiming, linearTiming } from "./motion";

export type VoiceTake = { uri: string; durationMs: number };
export type RecorderPhase = "idle" | "preparing" | "recording";
export type RecorderProblem = "denied" | "blocked" | "failed" | "tooShort";

const MIN_TAKE_MS = 600;
const TICK_MS = 250;
// Speech does not need studio quality; mono at 64 kbps keeps a minute under 500 KB.
const VOICE_PRESET = { ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, bitRate: 64_000 };

export function useVoiceRecorder(onTake: (take: VoiceTake) => void) {
  const finishRef = useRef<(uri: string | null) => void>(() => undefined);
  const recorder = useAudioRecorder(VOICE_PRESET, (status) => {
    if (status.isFinished) finishRef.current(status.hasError ? null : status.url);
  });
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [problem, setProblem] = useState<RecorderProblem | null>(null);
  /** Time left in the take, 1 down to 0, for the countdown ring. */
  const remaining = useSharedValue(0);
  const startedAt = useRef(0);
  const recording = useRef(false);
  const onTakeRef = useRef(onTake);

  useEffect(() => {
    onTakeRef.current = onTake;
  });

  const finish = useCallback(
    (uri: string | null) => {
      if (!recording.current) return;
      recording.current = false;
      const durationMs = Math.min(Date.now() - startedAt.current, LIMITS.voiceMaxMs);
      remaining.set(withTiming(0, fadeTiming(duration.short)));
      setPhase("idle");
      setElapsedMs(0);
      if (!uri) setProblem("failed");
      else if (durationMs < MIN_TAKE_MS) setProblem("tooShort");
      else onTakeRef.current({ uri, durationMs });
    },
    [remaining],
  );

  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    if (phase !== "recording") return;
    const timer = setInterval(() => setElapsedMs(Math.min(Date.now() - startedAt.current, LIMITS.voiceMaxMs)), TICK_MS);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(
    () => () => {
      if (recording.current) recorder.stop().catch(() => undefined);
    },
    [recorder],
  );

  const start = useCallback(async () => {
    setProblem(null);
    setPhase("preparing");
    try {
      const permission = await withLockPaused(() => requestRecordingPermissionsAsync());
      if (!permission.granted) {
        setPhase("idle");
        setProblem(permission.canAskAgain ? "denied" : "blocked");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: LIMITS.voiceMaxMs / 1000 });
      startedAt.current = Date.now();
      recording.current = true;
      remaining.set(1);
      remaining.set(withTiming(0, linearTiming(LIMITS.voiceMaxMs)));
      setPhase("recording");
    } catch {
      setPhase("idle");
      setProblem("failed");
    }
  }, [recorder, remaining]);

  const stop = useCallback(async () => {
    if (!recording.current) return;
    try {
      await recorder.stop();
    } catch {
      finish(null);
      return;
    }
    finish(recorder.uri);
  }, [recorder, finish]);

  const clearProblem = useCallback(() => setProblem(null), []);

  return { phase, elapsedMs, problem, remaining, start, stop, clearProblem };
}
