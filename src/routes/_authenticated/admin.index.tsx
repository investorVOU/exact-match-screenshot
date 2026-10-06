import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/config/business";
import { askSaleDetails, reportVehicleSale } from "@/lib/record-sale";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminCars });

function AdminCars() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("id,slug,make,model,year,price,status,car_images(url,position)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-cars"] }); qc.invalidateQueries({ queryKey: ["cars"] }); };

  const toggleSold = async (c: (typeof cars)[number]) => {
    const markingSold = c.status !== "Sold";
    const sale = markingSold ? askSaleDetails(`${c.year} ${c.make} ${c.model}`, Number(c.price)) : null;
    if (markingSold && !sale) return;
    const { error } = await supabase.from("cars").update({ status: markingSold ? "Sold" : "Available" }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    refresh();
    if (sale) await reportVehicleSale(c.id, sale);
  };
  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This can't be undone.`)) return;
    const { data: imgs } = await supabase.from("car_images").select("path").eq("car_id", id);
    const paths = (imgs ?? []).map((i) => i.path).filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("car-images").remove(paths);
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refresh(); }
  };

  const term = q.toLowerCase();
  const list = cars.filter((c) => `${c.year} ${c.make} ${c.model}`.toLowerCase().includes(term));
  const btn = "h-9 rounded-lg px-3 text-xs font-semibold";

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cars" className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm" />
        </label>
        <Link to="/admin/cars/$id" params={{ id: "new" }} className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-highlight px-4 text-sm font-bold text-highlight-foreground">
          <Plus className="h-4 w-4" />Add car
        </Link>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{list.length} cars</p>
      {isLoading && <p className="mt-4 text-sm">Loading…</p>}
      <ul className="mt-2 space-y-2">
        {list.map((c) => {
          const name = `${c.year} ${c.make} ${c.model}`;
          const cover = [...(c.car_images ?? [])].sort((a, b) => a.position - b.position)[0]?.url;
          return (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-card p-2.5 shadow-card">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">{cover && <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="font-price text-sm font-bold text-primary">{formatNaira(Number(c.price))}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Link to="/admin/cars/$id" params={{ id: c.id }} className={`${btn} inline-flex items-center bg-secondary`}>Edit</Link>
                  <button onClick={() => toggleSold(c)} className={`${btn} ${c.status === "Sold" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                    {c.status === "Sold" ? "Mark available" : "Mark as Sold"}
                  </button>
                  <button onClick={() => remove(c.id, name)} className={`${btn} bg-destructive text-destructive-foreground`}>Delete</button>
                </div>
              </div>
              {c.status === "Sold" && <span className="self-start rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">Sold</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
