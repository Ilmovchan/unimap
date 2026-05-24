import { Image, type ImageProps } from "expo-image";
import { useEffect, useState } from "react";
import { InteractionManager, View, type StyleProp, type ViewStyle } from "react-native";

type Props = ImageProps & {
  /** Затримка після idle, мс (0 — лише після InteractionManager). */
  deferMs?: number;
  placeholderStyle?: StyleProp<ViewStyle>;
};

/**
 * Не завантажує зображення, поки UI не встиг відмалювати карту / список.
 */
export default function DeferredExpoImage({
  deferMs = 0,
  placeholderStyle,
  style,
  ...imageProps
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      if (deferMs <= 0) {
        setReady(true);
        return;
      }
      timeout = setTimeout(() => {
        if (!cancelled) setReady(true);
      }, deferMs);
    });

    return () => {
      cancelled = true;
      task.cancel();
      if (timeout) clearTimeout(timeout);
    };
  }, [deferMs]);

  if (!ready) {
    return <View style={[style, placeholderStyle]} />;
  }

  return <Image {...imageProps} style={style} />;
}
