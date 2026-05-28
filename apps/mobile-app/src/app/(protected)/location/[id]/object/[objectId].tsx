import { locationDeepLinkHref } from "@/src/features/qr/locationDeepLinkHref";
import { Redirect, useLocalSearchParams } from "expo-router";

/** app://location/{id}/object/{objectId} */
export default function LocationObjectDeepLinkScreen() {
  const { id, objectId } = useLocalSearchParams<{
    id: string | string[];
    objectId: string | string[];
  }>();
  const locationId = typeof id === "string" ? id : id?.[0];
  const object = typeof objectId === "string" ? objectId : objectId?.[0];
  if (!locationId) {
    return <Redirect href="/+not-found" />;
  }
  return (
    <Redirect href={locationDeepLinkHref(locationId, object)} />
  );
}
