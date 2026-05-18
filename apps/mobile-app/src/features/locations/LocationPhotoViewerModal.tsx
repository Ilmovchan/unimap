import type { LocationPhotoDto } from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  photos: LocationPhotoDto[];
  initialIndex: number;
  title: string;
  visible: boolean;
  onClose: () => void;
};

export default function LocationPhotoViewerModal({
  photos,
  initialIndex,
  title,
  visible,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<LocationPhotoDto>>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    const safe = Math.min(Math.max(initialIndex, 0), Math.max(photos.length - 1, 0));
    setIndex(safe);
    requestAnimationFrame(() => {
      if (photos.length > 0) {
        listRef.current?.scrollToIndex({ index: safe, animated: false });
      }
    });
  }, [visible, initialIndex, photos.length]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next >= 0 && next < photos.length) setIndex(next);
    },
    [photos.length, width],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LocationPhotoDto>) => (
      <View style={[styles.slide, { width, height: height - insets.top - insets.bottom - 88 }]}>
        <Image
          source={{ uri: item.url }}
          style={styles.fullImage}
          contentFit="contain"
          accessibilityLabel={item.altUk?.trim() || title}
        />
      </View>
    ),
    [height, insets.bottom, insets.top, title, width],
  );

  if (!visible || photos.length === 0) return null;

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрити"
            hitSlop={12}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#F5F4F1" />
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={styles.topTitle} numberOfLines={1}>
              {title}
            </Text>
            {photos.length > 1 ? (
              <Text style={styles.counter}>
                {index + 1} / {photos.length}
              </Text>
            ) : null}
          </View>
          <View style={styles.closeBtnPlaceholder} />
        </View>

        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(initialIndex, photos.length - 1)}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={renderItem}
          onScrollToIndexFailed={() => {
            listRef.current?.scrollToOffset({
              offset: width * Math.min(index, photos.length - 1),
              animated: false,
            });
          }}
        />

        {photos[index]?.altUk?.trim() ? (
          <Text style={styles.caption} numberOfLines={3}>
            {photos[index].altUk!.trim()}
          </Text>
        ) : null}

        {photos.length > 1 ? (
          <View style={styles.dots}>
            {photos.map((p, i) => (
              <View
                key={p.id}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#121211",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 48,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
  closeBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F5F4F1",
    letterSpacing: -0.2,
  },
  counter: {
    marginTop: 2,
    fontSize: 13,
    color: "rgba(245, 244, 241, 0.65)",
    fontVariant: ["tabular-nums"],
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  caption: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(245, 244, 241, 0.85)",
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(245, 244, 241, 0.28)",
  },
  dotActive: {
    width: 18,
    backgroundColor: globalColors.surface,
  },
});
