import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicDb } from "./cars.server";
import { BUSINESS } from "@/config/business";

export type CarCardDTO = {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  body_type: string;
  condition: string;
  color: string | null;
  engine_size: string | null;
  location: string;
  description: string | null;
  status: string;
  original_customs_duty: boolean;
  images: string[];
};

const SELECT =
  "id,slug,make,model,year,price,mileage,transmission,fuel,body_type,condition,color,engine_size,location,description,status,original_customs_duty,car_images(url,position)";

type Row = Omit<CarCardDTO, "images"> & { car_images: { url: string; position: number }[] | null };
const toDTO = (r: Row): CarCardDTO => {
  const { car_images, ...rest } = r;
  return {
    ...rest,
    price: Number(rest.price),
    images: (car_images ?? []).sort((a, b) => a.position - b.position).map((i) => i.url),
  };
};

export const listFiltersSchema = z.object({
  tab: z.enum(["all", "foreign", "nigerian"]).default("all"),
  q: z.string().max(60).default(""),
  brand: z.string().max(40).default(""),
  body: z.string().max(20).default(""),
  max: z.number().int().nonnegative().default(0),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.number().int().min(1).default(1),
});
export type ListFilters = z.infer<typeof listFiltersSchema>;

export const normalizeCarSearchTerms = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9-]+/g, " ").trim().split(/\s+/).filter(Boolean);

export const listCars = createServerFn({ method: "GET" })
  .inputValidator((d) => listFiltersSchema.parse(d))
  .handler(async ({ data }) => {
    const db = publicDb();
    const per = BUSINESS.carsPerPage;
    let query = db.from("cars").select(SELECT, { count: "exact" });
    if (data.tab === "foreign") query = query.eq("condition", "Foreign Used");
    if (data.tab === "nigerian") query = query.eq("condition", "Nigerian Used");
    if (data.brand) query = query.eq("make", data.brand);
    if (data.body) query = query.eq("body_type", data.body);
    if (data.max) query = query.lte("price", data.max);
    for (const term of normalizeCarSearchTerms(data.q)) {
      const matches = [`make.ilike.%${term}%`, `model.ilike.%${term}%`];
      if (/^\d{4}$/.test(term)) matches.push(`year.eq.${Number(term)}`);
      query = query.or(matches.join(","));
    }
    // Sold cars go to the bottom ("Available" sorts before "Sold")
    query = query.order("status", { ascending: true });
    if (data.sort === "price_asc") query = query.order("price", { ascending: true });
    else if (data.sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    const from = (data.page - 1) * per;
    const { data: rows, count, error } = await query.range(from, from + per - 1);
    if (error) throw new Error(error.message);
    return { cars: (rows as unknown as Row[]).map(toDTO), total: count ?? 0 };
  });

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicDb().from("cars").select("make");
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((r) => r.make))).sort();
});

export const getCar = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const db = publicDb();
    const { data: row, error } = await db.from("cars").select(SELECT).eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { car: null, similar: [] as CarCardDTO[] };
    const car = toDTO(row as unknown as Row);
    const { data: sim } = await db
      .from("cars")
      .select(SELECT)
      .neq("id", car.id)
      .eq("status", "Available")
      .or(`make.eq.${car.make.replace(/[,()]/g, "")},and(price.gte.${Math.round(car.price * 0.7)},price.lte.${Math.round(car.price * 1.3)})`)
      .limit(4);
    return { car, similar: ((sim ?? []) as unknown as Row[]).map(toDTO) };
  });

export const listSlugs = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicDb().from("cars").select("slug,created_at").eq("status", "Available");
  return data ?? [];
});
