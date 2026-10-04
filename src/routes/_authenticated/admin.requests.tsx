import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/requests")({ component: Requests });

const when = (s: string) => new Date(s).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

function Requests() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const [ins, req] = await Promise.all([
        supabase.from("inspection_requests").select("id,name,preferred_date,status,created_at,cars(year,make,model)").order("created_at", { ascending: false }).limit(200),
        supabase.from("car_requests").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (ins.error) throw ins.error;
      if (req.error) throw req.error;
      return { ins: ins.data, req: req.data };
    },
  });

  const mark = async (table: "inspection_requests" | "car_requests", id: string, status: string) => {
    const { error } = await supabase.from(table).update({ status: status === "Contacted" ? "New" : "Contacted" }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-requests"] });
  };
  const btn = (status: string) => `h-9 shrink-0 rounded-lg px-3 text-xs font-semibold ${status === "Contacted" ? "bg-accent text-accent-foreground" : "bg-highlight text-highlight-foreground"}`;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-extrabold">Inspection requests</h2>
        <ul className="mt-2 space-y-2">
          {data?.ins.length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
          {data?.ins.map((r) => (
            <li key={r.id} className={`flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card ${r.status === "Contacted" ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{r.name}</p>
                <p className="truncate">{r.cars ? `${r.cars.year} ${r.cars.make} ${r.cars.model}` : "Car removed"}</p>
                <p className="text-xs text-muted-foreground">Wants: {r.preferred_date ?? "—"} · Sent {when(r.created_at)}</p>
              </div>
              <button onClick={() => mark("inspection_requests", r.id, r.status)} className={btn(r.status)}>{r.status === "Contacted" ? "✓ Contacted" : "Contacted"}</button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-extrabold">Car requests</h2>
        <ul className="mt-2 space-y-2">
          {data?.req.length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
          {data?.req.map((r) => (
            <li key={r.id} className={`flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card ${r.status === "Contacted" ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{r.name} · <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-primary underline"><Phone className="h-3 w-3" />{r.phone}</a></p>
                <p>{r.type} {r.car_wanted} · Budget: {r.budget || "—"}</p>
                <p className="text-xs text-muted-foreground">Sent {when(r.created_at)}</p>
              </div>
              <button onClick={() => mark("car_requests", r.id, r.status)} className={btn(r.status)}>{r.status === "Contacted" ? "✓ Contacted" : "Contacted"}</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
