import { createServerFn } from "@tanstack/react-start";
import { publicDb } from "./cars.server";

/** Public site settings, readable by anyone (the Pixel ID is not sensitive). */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicDb()
      .from("site_settings")
      .select("pixel_id")
      .eq("id", 1)
      .maybeSingle();
    return { pixelId: data?.pixel_id ?? "" };
  } catch {
    return { pixelId: "" };
  }
});
