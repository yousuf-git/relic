// expo-speech-recognition is loaded defensively: a development build that predates
// the package must still open the ritual, just without dictation.
import type * as SpeechRecognition from "expo-speech-recognition";

type SpeechModule = typeof SpeechRecognition;

function load(): SpeechModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-speech-recognition") as SpeechModule;
  } catch {
    return null;
  }
}

export const speech = load();
