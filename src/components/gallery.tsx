import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  if (!n) return <div className="aspect-[4/3] rounded-2xl bg-muted" />;

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { touchX.current = e.touches[0]?.clientX ?? null; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current == null) return;
      const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };
  const arrow = "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-overlay text-primary-foreground active:scale-95";

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted sm:rounded-3xl" {...swipe}>
        <img src={images[i]} alt={`${alt} photo ${i + 1}`} className="h-full w-full cursor-zoom-in object-cover" onClick={() => setFull(true)} width={800} height={600} fetchPriority="high" />
        {n > 1 && (
          <>
            <button aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-2`}><ChevronLeft className="h-5 w-5" /></button>
            <button aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-2`}><ChevronRight className="h-5 w-5" /></button>
          </>
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-overlay px-2.5 py-1 text-xs font-semibold text-primary-foreground">{i + 1} / {n}</span>
        <button aria-label="Fullscreen" onClick={() => setFull(true)} className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-overlay text-primary-foreground"><Expand className="h-4 w-4" /></button>
      </div>
      {n > 1 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {images.map((src, k) => (
            <button key={src + k} onClick={() => setI(k)} aria-label={`Photo ${k + 1}`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${k === i ? "border-highlight" : "border-transparent opacity-70"}`}>
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" width={80} height={64} />
            </button>
          ))}
        </div>
      )}
      {full && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" {...swipe} role="dialog" aria-modal="true">
          <img src={images[i]} alt={alt} className="max-h-full max-w-full object-contain" />
          <button aria-label="Close" onClick={() => setFull(false)} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-card text-foreground"><X className="h-5 w-5" /></button>
          {n > 1 && (
            <>
              <button aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-3`}><ChevronLeft className="h-5 w-5" /></button>
              <button aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-3`}><ChevronRight className="h-5 w-5" /></button>
            </>
          )}
          <span className="absolute bottom-6 text-sm font-semibold text-primary-foreground">{i + 1} / {n}</span>
        </div>
      )}
    </div>
  );
}
