import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import AppShell from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await requireUser();
  // Gerente não entra no CRM; vai para o app do gerente.
  if (u.role === "GERENTE") redirect("/gerente");

  return (
    <AppShell nome={u.nome} role={u.role}>
      {children}
    </AppShell>
  );
}
