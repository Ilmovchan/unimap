import type { LocationUniversityObjectDto } from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
type Props = {
  object: LocationUniversityObjectDto | null;
  locationTitle?: string | null;
  onClose: () => void;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function UniversityObjectDetailModal({
  object,
  locationTitle,
  onClose,
}: Props) {
  const visible = object != null;
  const title = object?.name?.trim() || "Об’єкт";
  const typeLabel = object?.typeName?.trim();
  const description = object?.description?.trim();
  const locTitle = locationTitle?.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Закрити"
          onPress={onClose}
        />
        <View style={styles.dialog} accessibilityViewIsModal>
          {object ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>{title}</Text>
                  {typeLabel ? (
                    <Text style={styles.typeName}>{typeLabel}</Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Закрити"
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && styles.closeBtnPressed,
                  ]}
                  onPress={onClose}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color={globalColors.icon}
                  />
                </Pressable>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                {locTitle ? (
                  <DetailRow label="Локація" value={locTitle} />
                ) : null}
                {object.floor != null && Number.isFinite(object.floor) ? (
                  <DetailRow
                    label="Поверх"
                    value={String(object.floor)}
                  />
                ) : null}
                {object.roomNumber ? (
                  <DetailRow label="Аудиторія" value={object.roomNumber} />
                ) : null}
                {description ? (
                  <DetailRow label="Опис" value={description} />
                ) : null}
                {!locTitle &&
                (object.floor == null || !Number.isFinite(object.floor)) &&
                !object.roomNumber &&
                !description ? (
                  <Text style={styles.emptyHint}>
                    Додаткової інформації немає.
                  </Text>
                ) : null}
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(33, 32, 30, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "72%",
    backgroundColor: globalColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: globalColors.border,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.18,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: globalColors.border,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
    color: globalColors.title,
  },
  typeName: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 22,
    color: globalColors.title,
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
    textAlign: "center",
    paddingVertical: 8,
  },
});
