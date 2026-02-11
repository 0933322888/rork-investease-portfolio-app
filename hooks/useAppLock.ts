import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";

let LocalAuthentication: any = null;
if (Platform.OS !== "web") {
  try {
    LocalAuthentication = require("expo-local-authentication");
  } catch {}
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const backgroundTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || !LocalAuthentication) return;

    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(compatible && enrolled);
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || !LocalAuthentication || !isEnabled) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundTimestamp.current = Date.now();
      } else if (nextState === "active") {
        if (backgroundTimestamp.current) {
          const elapsed = Date.now() - backgroundTimestamp.current;
          if (elapsed > LOCK_TIMEOUT_MS) {
            setIsLocked(true);
          }
          backgroundTimestamp.current = null;
        }
      }
    });

    return () => subscription.remove();
  }, [isEnabled]);

  const authenticate = useCallback(async () => {
    if (Platform.OS === "web" || !LocalAuthentication) {
      setIsLocked(false);
      return true;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Assetra",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const enable = useCallback(() => setIsEnabled(true), []);
  const disable = useCallback(() => {
    setIsEnabled(false);
    setIsLocked(false);
  }, []);

  return {
    isLocked,
    isSupported,
    isEnabled,
    authenticate,
    enable,
    disable,
  };
}
