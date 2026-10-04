import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin sign in — Rush Autos" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data }) => setSetup(data === false));
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/admin" }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (setup) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (!data.session) return toast.success("Check your email to confirm your account, then sign in here.");
      return navigate({ to: "/admin" });
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/admin" });
  };

  const input = "mt-1 h-12 w-full rounded-xl border border-input bg-background px-3";
  return (
    <div className="grid min-h-screen place-items-center bg-brand px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-6 shadow-card">
        <h1 className="text-2xl font-extrabold">{setup ? "Create admin account" : "Admin sign in"}</h1>
        {setup && <p className="text-sm text-muted-foreground">One-time setup. The first account becomes the only admin.</p>}
        <label className="block text-sm font-semibold">Email<input type="email" required className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Password<input type="password" required minLength={8} className={input} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : setup ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
