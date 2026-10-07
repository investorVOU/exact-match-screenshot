import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  images: z.array(z.string().startsWith("data:image/").max(1_500_000)).min(1).max(4),
  hints: z.string().max(400).default(""),
});

const outputSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  body_type: z.enum(["Sedan", "SUV", "Pickup", "Bus", "Coupe", "Hatchback"]),
  transmission: z.enum(["Automatic", "Manual"]),
  fuel: z.enum(["Petrol", "Diesel", "Hybrid", "Electric", "CNG"]),
  color: z.string(),
  engine_size: z.string(),
  description: z.string(),
}).strict();

export type AiCarDetails = z.infer<typeof outputSchema>;

const outputShape = `{"make":"string","model":"string","year":2020,"body_type":"Sedan|SUV|Pickup|Bus|Coupe|Hatchback","transmission":"Automatic|Manual","fuel":"Petrol|Diesel|Hybrid|Electric|CNG","color":"string","engine_size":"string","description":"string"}`;

const INSTRUCTIONS = `You help Rush Autos, a used-car dealer in Abuja, Nigeria, list cars.
Look at the photos and identify the car. Fill every field with your best guess; use "" for color or engine_size only if impossible to tell.
Write "description" as 3-5 short, honest, selling sentences for Nigerian buyers (mention visible condition, features and why it suits Nigerian roads). Do not invent mileage, price or accident history. No emojis.
Admin hints override what you see. Return only a JSON object matching this shape: ${outputShape}`;

export const generateCarDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }): Promise<AiCarDetails> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only the admin can use AI.");
    const groqKey = process.env["GROQ_API_KEY"];
    if (!groqKey) throw new Error("AI is not configured: add GROQ_API_KEY to your hosting environment variables.");
    const model = process.env["GROQ_MODEL"] || "meta-llama/llama-4-scout-17b-16e-instruct";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: INSTRUCTIONS },
          {
            role: "user",
            content: [
              { type: "text", text: `Hints from admin: ${data.hints || "none"}` },
              ...data.images.map((url) => ({ type: "image_url", image_url: { url } })),
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let msg = "AI request failed.";
      try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? msg; } catch { /* keep default */ }
      if (res.status === 429) msg = "AI is busy, try again in a minute.";
      throw new Error(msg);
    }

    const result = await res.json();
    const text = result.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text) throw new Error("AI returned nothing. Try clearer photos.");
    const out = outputSchema.parse(JSON.parse(text));
    out.year = Math.min(new Date().getFullYear() + 1, Math.max(1980, Math.round(out.year)));
    return out;
  });
