import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, Truck } from "lucide-react";
import { BUSINESS, waLink } from "@/config/business";
import { trackWhatsAppLead } from "@/lib/pixel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const NOTICE_KEY = "rush-autos-visitor-notice-v1";

export function VisitorNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(NOTICE_KEY)) return;
    } catch { /* The notice still works when storage is unavailable. */ }
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { sessionStorage.setItem(NOTICE_KEY, "dismissed"); } catch { /* Optional persistence. */ }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-y-auto rounded-2xl border-0 bg-card p-0 text-card-foreground shadow-card max-h-[calc(100dvh-2rem)] motion-reduce:animate-none [&>button]:right-3 [&>button]:top-3 [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:text-brand-foreground [&>button]:opacity-100 [&>button]:data-[state=open]:bg-transparent [&>button]:data-[state=open]:text-brand-foreground">
        <div className="bg-brand px-6 pb-6 pt-7 text-brand-foreground sm:px-8">
          <p className="mb-6 pr-10 font-display text-xl font-extrabold tracking-normal">Rush <span className="text-highlight">Autos</span></p>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-highlight">
            <Truck className="h-5 w-5 shrink-0" aria-hidden="true" /> Nationwide delivery
          </div>
          <DialogTitle className="font-display text-3xl font-extrabold leading-tight tracking-normal">Your next car.<br />Anywhere in Nigeria.</DialogTitle>
        </div>
        <div className="px-6 pb-6 pt-5 sm:px-8">
          <p className="text-lg font-bold">Don’t see the car you want?</p>
          <DialogDescription className="mt-2 text-base leading-relaxed text-muted-foreground">
            Contact {BUSINESS.name} for any car—even if it’s not listed here. Tell us your preferred car and budget, and we’ll help you find it. We deliver nationwide.
          </DialogDescription>
          <Button asChild className="mt-6 h-12 w-full bg-highlight text-highlight-foreground shadow-none hover:bg-highlight/90 font-bold">
            <a href={waLink("Hello Rush Autos, I'm looking for a car. Can you help me find it and arrange delivery to my location?")} target="_blank" rel="noopener noreferrer" onClick={() => { trackWhatsAppLead(); dismiss(); }}>
              <MessageCircle aria-hidden="true" /> Tell us the car you want <ArrowRight aria-hidden="true" />
            </a>
          </Button>
          <Button variant="ghost" className="mt-2 h-11 w-full text-muted-foreground" onClick={dismiss}>Continue browsing cars</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}