import { AuthError } from "@/lib/auth";

/**
 * Seam for native Google sign-in. Once @react-native-google-signin/google-signin is installed and the
 * Web + Android OAuth clients exist, return the ID token from the Credential Manager flow here;
 * GoogleButton hands it to signInGoogleIdToken. Throw GOOGLE_CANCELLED when the user backs out.
 */
export async function getGoogleIdToken(): Promise<string> {
  throw new AuthError("GOOGLE_UNAVAILABLE", "Google sign-in is not configured", 0);
}
