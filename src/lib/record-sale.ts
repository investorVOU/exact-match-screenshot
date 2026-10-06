import { toast } from "sonner";
import { recordVehicleSale } from "@/lib/purchase.functions";

export type SaleDetails = { salePrice: number; buyerPhone: string };

/** Asks the admin for the real sale price and buyer phone. Returns null if cancelled/invalid. */
export function askSaleDetails(vehicleName: string, listPrice: number): SaleDetails | null {
  const priceInput = window.prompt(
    `Final sale price for ${vehicleName} (₦). Sent to Meta as the Purchase value.`,
    String(Math.round(listPrice)),
  );
  if (priceInput === null) return null;
  const salePrice = Number(priceInput.replace(/[,\s₦]/g, ""));
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    toast.error("Enter a valid sale price.");
    return null;
  }
  const phoneInput = window.prompt(
    "Buyer's phone / WhatsApp number. Meta needs it to match the sale to the ad. Leave blank to skip the Meta Purchase.",
    "",
  );
  if (phoneInput === null) return null;
  return { salePrice, buyerPhone: phoneInput.trim() };
}

/** Call only AFTER the car has been saved as Sold. */
export async function reportVehicleSale(carId: string, sale: SaleDetails) {
  try {
    const { result } = await recordVehicleSale({
      data: {
        carId,
        salePrice: sale.salePrice,
        ...(sale.buyerPhone ? { buyerPhone: sale.buyerPhone } : {}),
      },
    });
    if (result === "sent") toast.success("Marked sold. Purchase sent to Meta.");
    else if (result === "no_match_data")
      toast.info("Marked sold. No Meta Purchase sent: a valid buyer phone is required.");
    else if (result === "skipped")
      toast.info("Marked sold. Meta Purchase skipped (CAPI not configured).");
    else toast.error("Marked sold, but the Meta Purchase failed to send.");
  } catch {
    toast.error("Marked sold, but the Meta Purchase could not be recorded.");
  }
}
