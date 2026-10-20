import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/actions/auth";
import TabBar from "./TabBar";
import RegisterSW from "./RegisterSW";

export default async function GerenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getSession();
  if (!u) redirect("/login");
  // Área exclusiva do gerente.
  if (u.role !== "GERENTE") redirect("/postos");

  const posto = u.postoId
    ? await prisma.posto.findUnique({
        where: { id: u.postoId },
        select: { nome: true },
      })
    : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50">
      <RegisterSW />
      <header className="bg-[var(--paz-navy)] px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-black tracking-wide">PAZ</span>
            <span className="ml-2 text-sm text-white/70">App do Gerente</span>
          </div>
          <form action={logout}>
            <button className="text-xs text-white/60 hover:text-white">
              Sair
            </button>
          </form>
        </div>
        <p className="mt-1 text-sm font-medium">{posto?.nome ?? "Seu posto"}</p>
      </header>

      <main className="flex-1">{children}</main>

      <TabBar />
    </div>
  );
}
