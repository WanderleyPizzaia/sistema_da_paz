import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const u = await getSession();
  if (u) redirect("/postos");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paz-navy)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="inline-block rounded-xl bg-white/10 px-6 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-paz.png" alt="PAZ" className="h-9 w-auto" />
          </div>
          <p className="mt-3 text-sm text-white/70">
            CRM Rede Paz · PAZ365
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="mb-1 text-lg font-bold text-gray-900">Entrar</h1>
          <p className="mb-5 text-sm text-gray-500">
            Acesse com seu WhatsApp cadastrado.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
