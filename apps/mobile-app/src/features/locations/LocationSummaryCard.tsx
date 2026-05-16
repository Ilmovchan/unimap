import type { LocationMapDto } from "@/src/features/api/locationsClient";
import { Image } from "expo-image";
import { Pressable, Text } from "react-native";
import {
  locationAddressText,
  locationCardTitle,
} from "./LocationDetailContent";
import { locationCardStyles as styles } from "./locationCardStyles";

type Props = {
  location: LocationMapDto;
  onPress: () => void;
};

export default function LocationSummaryCard({ location, onPress }: Props) {
  const title = locationCardTitle(location);
  const address = locationAddressText(location);
  const imageUrl = location.imageUrl?.trim() || null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.listThumb}
          contentFit="cover"
          accessibilityLabel={title}
        />
      ) : null}
      <Text style={styles.cardTitle}>{title}</Text>
      {address ? <Text style={styles.bodyText}>{address}</Text> : null}
    </Pressable>
  );
}
