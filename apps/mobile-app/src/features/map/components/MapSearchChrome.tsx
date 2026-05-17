import LayoutButton from "@/src/features/map/components/LayoutButton";
import MapSearchBar from "@/src/features/map/components/MapSearchBar";
import MapSearchResultsPanel from "@/src/features/map/components/MapSearchResultsPanel";
import { MAP_SEARCH_UI_ENABLED } from "@/src/features/map/mapSearchConfig";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  top: number;
  horizontalInset: number;
  unreadNewsCount: number;
  onOpenLocations: () => void;
  onOpenNews: () => void;
};

/**
 * Верхня смуга пошуку + плашка результатів.
 * Не рендериться на карті, поки MAP_SEARCH_UI_ENABLED === false.
 */
export default function MapSearchChrome({
  top,
  horizontalInset,
  unreadNewsCount,
  onOpenLocations,
  onOpenNews,
}: Props) {
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);

  const openSearchResults = useCallback(() => {
    setSearchResultsOpen(true);
  }, []);

  const closeSearchResults = useCallback(() => {
    setSearchResultsOpen(false);
  }, []);

  if (!MAP_SEARCH_UI_ENABLED) {
    return null;
  }

  return (
    <>
      {searchResultsOpen ? (
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Закрити пошук"
          onPress={closeSearchResults}
        />
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          styles.overlay,
          { top, left: horizontalInset, right: horizontalInset },
        ]}
      >
        <View style={styles.topRow} pointerEvents="auto">
          <LayoutButton
            style={styles.topRowButton}
            icon={
              <Ionicons
                size={26}
                name="business-outline"
                color={globalColors.navigationFabIcon}
              />
            }
            accessibilityLabel="Усі відділення"
            onPress={() => {
              closeSearchResults();
              onOpenLocations();
            }}
          />

          <MapSearchBar onActivate={openSearchResults} />

          <LayoutButton
            style={styles.topRowButton}
            icon={
              <Ionicons
                size={26}
                name="newspaper-outline"
                color={globalColors.navigationFabIcon}
              />
            }
            badgeCount={unreadNewsCount > 0 ? unreadNewsCount : undefined}
            accessibilityLabel={
              unreadNewsCount > 0
                ? `Новини університету, ${unreadNewsCount} непрочитаних`
                : "Новини університету"
            }
            onPress={() => {
              closeSearchResults();
              onOpenNews();
            }}
          />
        </View>

        {searchResultsOpen ? (
          <MapSearchResultsPanel onClose={closeSearchResults} />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    backgroundColor: "rgba(33, 32, 30, 0.18)",
  },
  overlay: {
    position: "absolute",
    zIndex: 9999,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topRowButton: {
    position: "relative",
  },
});
