import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  images: z.array(z.string().startsWith("data:image/").max(1_500_000)).min(1).max(4),
  hints: z.string().max(400).default(""),
});

const str = { type: "string" } as const;
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["make", "model", "year", "body_type", "transmission", "fuel", "color", "engine_size", "description"],
  properties: {
    make: str, model: str, year: { type: "integer" },
    body_type: { type: "string", enum: ["Sedan", "SUV", "Pickup", "Bus", "Coupe", "Hatchback"] },
    transmission: { type: "string", enum: ["Automatic", "Manual"] },
    fuel: { type: "string", enum: ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"] },
    color: str, engine_size: str, description: str,
  },
};

export type AiCarDetails = {
  make: string; model: string; year: number; body_type: string; transmission: string;
  fuel: string; color: string; engine_size: string; description: string;
};

const INSTRUCTIONS = `You help Rush Autos, a used-car dealer in Abuja, Nigeria, list cars.
Look at the photos and identify the car. Fill every field with your best guess; use "" for color or engine_size only if impossible to tell.
Write "description" as 3-5 short, honest, selling sentences for Nigerian buyers (mention visible condition, features and why it suits Nigerian roads). Do not invent mileage, price or accident history. No emojis.
Admin hints override what you see.`;

export const generateCarDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }): Promise<AiCarDetails> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only the admin can use AI.");
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: INSTRUCTIONS,
        text: { format: { type: "json_schema", name: "car", strict: true, schema } },
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: `Hints from admin: ${data.hints || "none"}` },
            ...data.images.map((url) => ({ type: "input_image", image_url: url })),
          ],
        }],
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      let msg = "AI request failed.";
      try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? msg; } catch { /* keep default */ }
      if (res.status === 429) msg = "AI is busy, try again in a minute.";
      if (res.status === 402) msg = "AI credits have run out. Add credits in your workspace to keep using AI.";
      throw new Error(msg);
    }

    // Consume the SSE stream and collect the text output.
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", refusal = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const frames = buf.split("\n\n");
      buf = frames.pop() ?? "";
      for (const frame of frames) {
        const line = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const raw = line.slice(5).trim();
        if (raw === "[DONE]") continue;
        try {
          const ev = JSON.parse(raw);
          if (ev.type === "response.output_text.delta") text += ev.delta;
          else if (ev.type === "response.refusal.delta") refusal += ev.delta;
          else if (ev.type === "error" || ev.type === "response.failed") throw new Error(ev.error?.message ?? ev.response?.error?.message ?? "AI failed.");
        } catch (e) { if (e instanceof Error && !(e instanceof SyntaxError)) throw e; }
      }
    }
    if (refusal || !text) throw new Error(refusal || "AI returned nothing. Try clearer photos.");
    const out = JSON.parse(text) as AiCarDetails;
    out.year = Math.min(new Date().getFullYear() + 1, Math.max(1980, Math.round(out.year)));
    return out;
  });
