import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import Sidebar from "./Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await requireUser();
  // Gerente não entra no CRM; vai para o app do gerente.
  if (u.role === "GERENTE") redirect("/gerente");

  return (
    <div className="flex min-h-screen">
      <Sidebar nome={u.nome} role={u.role} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
