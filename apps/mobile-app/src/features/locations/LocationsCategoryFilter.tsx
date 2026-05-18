import {
  ALL_LOCATION_LIST_CATEGORY_KEYS,
  LOCATION_LIST_CATEGORIES,
} from "@/src/features/locations/groupLocationsByType";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_BAR_HEIGHT = 44;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledKeys: ReadonlySet<string>;
  onToggleKey: (key: string) => void;
};

export function createDefaultEnabledCategories(): Set<string> {
  return new Set(ALL_LOCATION_LIST_CATEGORY_KEYS);
}

export function isCategoryFilterActive(enabledKeys: ReadonlySet<string>): boolean {
  return enabledKeys.size < ALL_LOCATION_LIST_CATEGORY_KEYS.length;
}

export default function LocationsCategoryFilter({
  open,
  onOpenChange,
  enabledKeys,
  onToggleKey,
}: Props) {
  const insets = useSafeAreaInsets();
  const menuTop = insets.top + HEADER_BAR_HEIGHT + 4;
  const filterActive = isCategoryFilterActive(enabledKeys);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Фільтр категорій"
        accessibilityState={{ expanded: open }}
        hitSlop={10}
        onPress={() => onOpenChange(!open)}
        style={({ pressed }) => [
          styles.filterButton,
          pressed && styles.filterButtonPressed,
        ]}
      >
        <Ionicons
          name={open ? "filter" : "filter-outline"}
          size={22}
          color={filterActive ? globalColors.accent : globalColors.title}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Закрити фільтр"
            onPress={close}
          />
          <View
            style={[styles.menu, { top: menuTop }]}
            accessibilityViewIsModal
          >
            <Text style={styles.menuTitle}>Категорії</Text>
            {LOCATION_LIST_CATEGORIES.map((category, index) => {
              const checked = enabledKeys.has(category.key);
              return (
                <Pressable
                  key={category.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={category.title}
                  onPress={() => onToggleKey(category.key)}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={globalColors.accent}
                  />
                  <Text style={styles.rowLabel}>{category.title}</Text>
                  <Ionicons
                    name={checked ? "checkbox" : "square-outline"}
                    size={22}
                    color={checked ? globalColors.accent : globalColors.icon}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  filterButtonPressed: {
    opacity: 0.7,
  },
  modalRoot: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    right: 12,
    minWidth: 268,
    maxWidth: 320,
    backgroundColor: globalColors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: globalColors.border,
    paddingVertical: 8,
    shadowColor: "#2E2D2B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: globalColors.subtitle,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: globalColors.border,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: globalColors.title,
    letterSpacing: -0.2,
  },
});
