import { locationDeepLinkHref } from "@/src/features/qr/locationDeepLinkHref";
import { Redirect, useLocalSearchParams } from "expo-router";

/** app://location/{id} — відкриття з системної камери / посилання. */
export default function LocationDeepLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const locationId = typeof id === "string" ? id : id?.[0];
  if (!locationId) {
    return <Redirect href="/+not-found" />;
  }
  return <Redirect href={locationDeepLinkHref(locationId)} />;
}
