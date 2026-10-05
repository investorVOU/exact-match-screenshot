import { createServerFn } from "@tanstack/react-start";
import { publicDb } from "./cars.server";

/** Public site settings, readable by anyone (tracking IDs are not sensitive). */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicDb()
      .from("site_settings")
      .select("pixel_id, adsense_client_id")
      .eq("id", 1)
      .maybeSingle();
    return {
      pixelId: data?.pixel_id ?? "",
      adsenseClientId: data?.adsense_client_id ?? "",
    };
  } catch {
    return { pixelId: "", adsenseClientId: "" };
  }
});
