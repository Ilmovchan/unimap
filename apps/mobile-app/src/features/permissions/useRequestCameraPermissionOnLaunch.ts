import { useCameraPermissions } from "expo-camera";
import { useEffect, useRef } from "react";
import { InteractionManager } from "react-native";

/** Запитує доступ до камери після першого кадру UI (не блокує карту). */
export function useRequestCameraPermissionOnLaunch() {
  const [permission, requestPermission] = useCameraPermissions();
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current || !permission) return;
    if (permission.granted) return;

    const task = InteractionManager.runAfterInteractions(() => {
      if (requestedRef.current || !permission || permission.granted) return;
      requestedRef.current = true;
      void requestPermission();
    });

    return () => task.cancel();
  }, [permission, requestPermission]);
}
