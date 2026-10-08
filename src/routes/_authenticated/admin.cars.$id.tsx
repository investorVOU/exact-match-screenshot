import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ImagePlus, Sparkles, Star, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { askSaleDetails, reportVehicleSale } from "@/lib/record-sale";
import { generateCarDetails } from "@/lib/ai-car.functions";

export const Route = createFileRoute("/_authenticated/admin/cars/$id")({ component: CarForm });

type Photo = { key: string; url: string; path?: string | null; file?: Blob };
const MAX_PHOTOS = 12;
const empty = {
  make: "", model: "", year: new Date().getFullYear() - 8, price: 0, mileage: 0, transmission: "Automatic", fuel: "Petrol",
  body_type: "Sedan", condition: "Foreign Used", color: "", engine_size: "", location: "Abuja", description: "", status: "Available",
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Resize to max 1600px and re-encode as JPEG ~80% to keep pages fast. */
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.8));
}

/** Shrink a photo to ~768px JPEG data URL for AI analysis. */
async function toSmallDataUrl(src: string): Promise<string> {
  const blob = await (await fetch(src)).blob();
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, 768 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

function CarForm() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const dragFrom = useRef<number | null>(null);
  const savedStatus = useRef<string | null>(null);
  const [hints, setHints] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("cars").select("*, car_images(id,url,path,position)").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Car not found"); return navigate({ to: "/admin" }); }
      const { car_images, ...car } = data;
      savedStatus.current = car.status;
      setF({ ...empty, ...car, price: Number(car.price), color: car.color ?? "", engine_size: car.engine_size ?? "", description: car.description ?? "" });
      setPhotos([...(car_images ?? [])].sort((a, b) => a.position - b.position).map((i) => ({ key: i.id, url: i.url, path: i.path })));
      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: ["year", "price", "mileage"].includes(k) ? Number(e.target.value) : e.target.value }));

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast.warning(`Max ${MAX_PHOTOS} photos per car.`);
    const added = await Promise.all(list.map(async (file) => {
      const blob = await compress(file);
      return { key: crypto.randomUUID(), url: URL.createObjectURL(blob), file: blob } as Photo;
    }));
    setPhotos((p) => [...p, ...added]);
  };
  const move = (from: number, to: number) => setPhotos((p) => {
    if (to < 0 || to >= p.length) return p;
    const n = [...p]; const [x] = n.splice(from, 1); if (x) n.splice(to, 0, x); return n;
  });
  const removePhoto = (i: number) => setPhotos((p) => {
    const ph = p[i]; if (ph?.path) setRemoved((r) => [...r, ph.path as string]);
    return p.filter((_, k) => k !== i);
  });

  const runAi = async () => {
    setAiBusy(true);
    try {
      const images = await Promise.all(photos.slice(0, 3).map((p) => toSmallDataUrl(p.url)));
      const r = await generateCarDetails({ data: { images, hints } });
      setF((p) => ({ ...p, make: r.make || p.make, model: r.model || p.model, year: r.year || p.year, body_type: r.body_type, transmission: r.transmission, fuel: r.fuel, color: r.color || p.color, engine_size: r.engine_size || p.engine_size, description: r.description || p.description }));
      toast.success("Details filled — please check them.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAiBusy(false);
    }
  };

  const save = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!photos.length) { toast.error("Add at least one photo."); return; }
    // Only an existing car going from not-Sold to Sold is a sale (adding already-sold stock is not).
    const markingSold = !isNew && savedStatus.current !== "Sold" && f.status === "Sold";
    const sale = markingSold ? askSaleDetails(`${f.year} ${f.make} ${f.model}`, f.price) : null;
    if (markingSold && !sale) return;
    setBusy(true);
    try {
      const payload = { ...f, color: f.color || null, engine_size: f.engine_size || null, description: f.description || null };
      let carId = id;
      if (isNew) {
        let slug = slugify(`${f.year} ${f.make} ${f.model}`);
        const { data: clash } = await supabase.from("cars").select("id").eq("slug", slug).maybeSingle();
        if (clash) slug += "-" + Math.random().toString(36).slice(2, 6);
        const { data, error } = await supabase.from("cars").insert({ ...payload, slug }).select("id").single();
        if (error) throw error;
        carId = data.id;
      } else {
        const { error } = await supabase.from("cars").update(payload).eq("id", id);
        if (error) throw error;
        if (sale) {
          savedStatus.current = "Sold";
          await reportVehicleSale(id, sale);
        }
      }

      const final: { url: string; path: string | null }[] = [];
      for (const ph of photos) {
        if (!ph.file) { final.push({ url: ph.url, path: ph.path ?? null }); continue; }
        const path = `${carId}/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from("car-images").upload(path, ph.file, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (up.error) throw up.error;
        const signed = await supabase.storage.from("car-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 20);
        if (signed.error) throw signed.error;
        final.push({ url: signed.data.signedUrl, path });
      }
      await supabase.from("car_images").delete().eq("car_id", carId);
      const { error: imgErr } = await supabase.from("car_images").insert(final.map((p, position) => ({ car_id: carId, url: p.url, path: p.path, position })));
      if (imgErr) throw imgErr;
      if (removed.length) await supabase.storage.from("car-images").remove(removed);

      qc.invalidateQueries();
      toast.success("Saved");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm">Loading…</p>;
  const input = "mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal";
  const lbl = "block text-sm font-semibold";
  const sel = (k: keyof typeof empty, opts: string[]) => (
    <select className={input} value={String(f[k])} onChange={set(k)}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
  );

  return (
    <form onSubmit={save} className="space-y-5">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" />Back</Link>
      <h1 className="text-2xl font-extrabold">{isNew ? "Add car" : "Edit car"}</h1>

      <section className="rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Photos ({photos.length}/{MAX_PHOTOS})</h2>
          <span className="text-xs text-muted-foreground">Drag or use arrows. First = cover.</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <div key={p.key} draggable
              onDragStart={() => { dragFrom.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragFrom.current !== null) move(dragFrom.current, i); dragFrom.current = null; }}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 ${i === 0 ? "border-highlight" : "border-transparent"}`}>
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-highlight px-1.5 text-[10px] font-bold text-highlight-foreground">COVER</span>}
              <button type="button" aria-label="Remove" onClick={() => removePhoto(i)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-overlay text-primary-foreground"><X className="h-4 w-4" /></button>
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" aria-label="Move left" onClick={() => move(i, i - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-overlay text-primary-foreground"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                {i !== 0 && <button type="button" aria-label="Make cover" onClick={() => move(i, 0)} className="grid h-7 w-7 place-items-center rounded-full bg-highlight text-highlight-foreground"><Star className="h-3.5 w-3.5" /></button>}
                <button type="button" aria-label="Move right" onClick={() => move(i, i + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-overlay text-primary-foreground"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-input text-muted-foreground">
              <span className="flex flex-col items-center text-xs font-semibold"><ImagePlus className="mb-1 h-6 w-6" />Add photos</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-card">
        <h2 className="flex items-center gap-1.5 font-bold"><Sparkles className="h-4 w-4 text-primary" />Fill with AI</h2>
        <p className="mt-1 text-xs text-muted-foreground">Uses your first 3 photos to fill make, model, year, body, gearbox, fuel, colour, engine and description. Check the result before saving — price and mileage stay yours.</p>
        <input className={`${input} mt-2`} value={hints} onChange={(e) => setHints(e.target.value)} placeholder="Optional hints, e.g. 2018 Lexus RX350, full option" />
        <button type="button" onClick={runAi} disabled={aiBusy || !photos.length} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-highlight font-bold text-highlight-foreground disabled:opacity-60">
          <Sparkles className="h-4 w-4" />{aiBusy ? "Looking at photos…" : photos.length ? "Generate details from photos" : "Add photos first"}
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 rounded-2xl bg-card p-4 shadow-card">

        <label className={lbl}>Make<input required className={input} value={f.make} onChange={set("make")} placeholder="Toyota" /></label>
        <label className={lbl}>Model<input required className={input} value={f.model} onChange={set("model")} placeholder="Camry XLE" /></label>
        <label className={lbl}>Year<input required type="number" min={1980} max={2030} className={input} value={f.year} onChange={set("year")} /></label>
        <label className={lbl}>Price (₦)<input required type="number" min={0} step={1000} className={input} value={f.price || ""} onChange={set("price")} /></label>
        <label className={lbl}>Mileage (km)<input type="number" min={0} className={input} value={f.mileage || ""} onChange={set("mileage")} /></label>
        <label className={lbl}>Gearbox{sel("transmission", ["Automatic", "Manual"])}</label>
        <label className={lbl}>Fuel{sel("fuel", ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"])}</label>
        <label className={lbl}>Body type{sel("body_type", ["Sedan", "SUV", "Pickup", "Bus", "Coupe", "Hatchback"])}</label>
        <label className={lbl}>Condition{sel("condition", ["Foreign Used", "Nigerian Used"])}</label>
        <label className={lbl}>Status{sel("status", ["Available", "Sold"])}</label>
        <label className={lbl}>Color<input className={input} value={f.color} onChange={set("color")} /></label>
        <label className={lbl}>Engine size<input className={input} value={f.engine_size} onChange={set("engine_size")} placeholder="2.5L" /></label>
        <label className={`${lbl} col-span-2`}>Location<input required className={input} value={f.location} onChange={set("location")} /></label>
        <label className={`${lbl} col-span-2`}>Description
          <textarea rows={5} className={`${input} h-auto py-2`} value={f.description} onChange={set("description")} />
        </label>
      </section>

      <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
        {busy ? "Saving & uploading…" : "Save car"}
      </button>
    </form>
  );
}
