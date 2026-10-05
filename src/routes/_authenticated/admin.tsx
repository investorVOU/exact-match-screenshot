import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Rush Autos" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    return { isAdmin: data === true };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, user } = Route.useRouteContext();
  const navigate = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-bold">No admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email} is not an approved admin.</p>
          <button onClick={signOut} className="mt-4 h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground">Sign out</button>
        </div>
      </div>
    );
  }

  const tab = "rounded-full px-3 py-1.5 text-sm font-semibold";
  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 bg-brand text-brand-foreground">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Link to="/" className="font-display text-lg font-extrabold">Rush <span className="text-highlight">Admin</span></Link>
          <nav className="flex items-center gap-1">
            <Link to="/admin" activeOptions={{ exact: true }} className={tab} activeProps={{ className: "bg-highlight text-highlight-foreground" }}>Cars</Link>
            <Link to="/admin/requests" className={tab} activeProps={{ className: "bg-highlight text-highlight-foreground" }}>Requests</Link>
            <Link to="/admin/settings" className={tab} activeProps={{ className: "bg-highlight text-highlight-foreground" }}>Settings</Link>
            <button aria-label="Sign out" onClick={signOut} className="grid h-9 w-9 place-items-center rounded-full"><LogOut className="h-4 w-4" /></button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 pt-4"><Outlet /></div>
    </div>
  );
}
