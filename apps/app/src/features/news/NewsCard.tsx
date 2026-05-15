import type { NewsItemDto } from "@/src/features/news/newsClient";
import { formatNewsDate, newsCardPreview } from "@/src/features/news/newsClient";
import { locationCardStyles as styles } from "@/src/features/locations/locationCardStyles";
import { globalColors } from "@/src/styles/styles";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  item: NewsItemDto;
  unread?: boolean;
  onPress: () => void;
};

export default function NewsCard({ item, unread = false, onPress }: Props) {
  const imageUrl = item.imageUrl?.trim() || null;
  const dateLine = formatNewsDate(item.publishedAt);
  const preview = newsCardPreview(
    item.summary.trim() || item.content.trim(),
    8,
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {dateLine ? (
        <Text style={newsStyles.date}>{dateLine}</Text>
      ) : null}

      {unread ? (
        <View style={newsStyles.unreadRow}>
          <View style={newsStyles.unreadDot} />
          <Text style={newsStyles.unreadLabel}>Непрочитано</Text>
        </View>
      ) : null}

      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.listThumb}
          contentFit="cover"
          accessibilityLabel={item.title}
        />
      ) : null}

      <Text style={[styles.cardTitle, unread && newsStyles.titleUnread]}>
        {item.title}
      </Text>

      {preview ? (
        <Text style={styles.bodyText}>{preview}</Text>
      ) : null}
    </Pressable>
  );
}

const newsStyles = StyleSheet.create({
  unreadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: globalColors.accent,
  },
  unreadLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: globalColors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  titleUnread: {
    color: globalColors.title,
  },
  date: {
    fontSize: 13,
    color: globalColors.subtitle,
    marginBottom: 10,
  },
});
