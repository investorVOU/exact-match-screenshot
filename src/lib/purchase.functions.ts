import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendPurchaseEvent } from "./meta-capi.server";

/**
 * Sends the Meta Purchase (Conversions API, server-side only) for a vehicle the admin has
 * just marked Sold. Admin-only, and refuses unless the car is really "Sold" in the database,
 * so it cannot be used to report a sale that was not recorded.
 */
export const recordVehicleSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        carId: z.string().uuid(),
        salePrice: z.number().finite().positive().max(1e12),
        buyerPhone: z.string().max(30).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    const { data: car, error } = await supabase
      .from("cars")
      .select("id,slug,make,model,year,status")
      .eq("id", data.carId)
      .maybeSingle();
    if (error || !car) throw new Error("Car not found");
    if (car.status !== "Sold") throw new Error("Car is not marked as Sold");

    const result = await sendPurchaseEvent({
      carId: car.id,
      carSlug: car.slug,
      vehicleName: `${car.year} ${car.make} ${car.model}`,
      salePrice: data.salePrice,
      buyerPhone: data.buyerPhone,
    });
    return { result };
  });
