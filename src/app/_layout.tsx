import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { IMFellDWPica_400Regular, IMFellDWPica_400Regular_Italic } from "@expo-google-fonts/im-fell-dw-pica";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
} from "@expo-google-fonts/newsreader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { color } from "@/design/tokens";
import "@/i18n";
import { restoreSession, useAuth } from "@/lib/auth";
import { Grain } from "@/ui/Grain";
import { ToastHost } from "@/ui/Toast";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IMFellDWPica_400Regular,
    IMFellDWPica_400Regular_Italic,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const status = useAuth((s) => s.status);

  useEffect(() => {
    restoreSession();
  }, []);

  const ready = fontsLoaded && status !== "loading";
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  const signedIn = status === "signedIn";
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.shaft }, animation: "fade" }}>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(welcome)" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(vault)" />
              <Stack.Screen name="preserve" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
              <Stack.Screen name="relic/[id]" options={{ animation: "fade" }} />
              <Stack.Screen name="share/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
              <Stack.Screen name="lock" options={{ animation: "fade", gestureEnabled: false }} />
            </Stack.Protected>
          </Stack>
          <ToastHost />
          <Grain />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: color.shaft } });
