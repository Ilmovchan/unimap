import { formatAddressJsonUkrLine } from "@/src/features/api/addressJsonDisplay";
import type { DepartmentDetailDto } from "@/src/features/api/departmentsClient";
import { globalColors } from "@/src/styles/styles";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export function formatIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type DepartmentDetailSectionsProps = {
  department: DepartmentDetailDto;
  /** Якщо false — заголовок не рендериться (наприклад, уже в шапці form sheet). */
  showHeadline?: boolean;
};

export function DepartmentDetailSections({
  department,
  showHeadline = true,
}: DepartmentDetailSectionsProps) {
  const addressText = useMemo(
    () => formatAddressJsonUkrLine(department.addressJson),
    [department.addressJson],
  );

  return (
    <>
      {showHeadline ? (
        <Text style={styles.headline}>{department.title}</Text>
      ) : null}

      {department.iconUrl ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Зображення</Text>
          <Image
            source={{ uri: department.iconUrl }}
            style={styles.iconImage}
            contentFit="contain"
            transition={200}
          />
        </View>
      ) : null}

      {addressText ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Адреса</Text>
          <Text style={styles.bodyText}>{addressText}</Text>
        </View>
      ) : department.addressJson?.trim() ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Адреса</Text>
          <Text style={styles.bodyText}>{department.addressJson.trim()}</Text>
        </View>
      ) : null}

      {department.description ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Опис</Text>
          <Text style={styles.bodyText}>{department.description}</Text>
        </View>
      ) : null}

      {(department.createdAt || department.updatedAt) && (
        <View style={styles.cardMuted}>
          {department.createdAt ? (
            <Text style={styles.metaLine}>
              Створено: {formatIsoDate(department.createdAt) ?? "—"}
            </Text>
          ) : null}
          {department.updatedAt ? (
            <Text style={styles.metaLine}>
              Оновлено: {formatIsoDate(department.updatedAt) ?? "—"}
            </Text>
          ) : null}
        </View>
      )}
    </>
  );
}

export const departmentDetailStyles = StyleSheet.create({
  headline: {
    fontSize: 22,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  card: {
    backgroundColor: globalColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: globalColors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardMuted: {
    backgroundColor: globalColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: globalColors.border,
    padding: 14,
    marginBottom: 8,
    opacity: 0.95,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: globalColors.title,
  },
  metaLine: {
    fontSize: 13,
    lineHeight: 20,
    color: globalColors.subtitle,
    marginBottom: 4,
  },
  iconImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: globalColors.background,
  },
});

const styles = departmentDetailStyles;
