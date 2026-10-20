import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
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
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-paz.png" alt="PAZ" className="h-5 w-auto" />
            <span className="text-sm text-white/70">App do Gerente</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="text-xs text-white/60 hover:text-white" />
            <form action={logout}>
              <button className="text-xs text-white/60 hover:text-white">
                Sair
              </button>
            </form>
          </div>
        </div>
        <p className="mt-1 text-sm font-medium">{posto?.nome ?? "Seu posto"}</p>
      </header>

      <main className="flex-1">{children}</main>

      <TabBar />
    </div>
  );
}
