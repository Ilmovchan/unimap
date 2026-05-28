/** Параметри карти після deep link / QR (див. index.tsx). */
export type LocationDeepLinkParams = {
  focusLocation: string;
  highlightObjectId?: string;
};

export function locationDeepLinkHref(
  locationId: string,
  objectId?: string,
): { pathname: "/"; params: LocationDeepLinkParams } {
  const id = locationId.trim();
  const obj = objectId?.trim();
  return {
    pathname: "/",
    params: {
      focusLocation: id,
      ...(obj ? { highlightObjectId: obj } : {}),
    },
  };
}
