import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type MapSearchResultPlaceholder = {
  id: string;
  title: string;
  subtitle?: string;
};

/** Заглушки — замінити на реальні результати пошуку. */
export const MAP_SEARCH_PLACEHOLDER_RESULTS: MapSearchResultPlaceholder[] = [
  {
    id: "placeholder-1",
    title: "вул. Довженка 9а",
    subtitle: "3 об'єкти",
  },
  {
    id: "placeholder-2",
    title: "вул. Преображенська 24",
    subtitle: "Деканат, укриття",
  },
  {
    id: "placeholder-3",
    title: "бульв. Французький 123",
    subtitle: "1 об'єкт",
  },
];

type Props = {
  onClose: () => void;
};

/** Плашка результатів пошуку (поки без логіки). */
export default function MapSearchResultsPanel({ onClose }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Результати</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрити результати пошуку"
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && styles.closeBtnPressed,
          ]}
        >
          <Ionicons name="close" size={20} color={globalColors.icon} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {MAP_SEARCH_PLACEHOLDER_RESULTS.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityHint="Поки без дії"
            onPress={() => {}}
            style={({ pressed }) => [
              styles.row,
              index === 0 && styles.rowFirst,
              pressed && styles.rowPressed,
            ]}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={globalColors.icon}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={globalColors.icon}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 10,
    maxHeight: 280,
    backgroundColor: globalColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: globalColors.border,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: globalColors.border,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
  scroll: {
    maxHeight: 220,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowPressed: {
    opacity: 0.88,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
});
