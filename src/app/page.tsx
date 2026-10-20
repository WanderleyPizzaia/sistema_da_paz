import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const u = await getSession();
  if (!u) redirect("/login");
  redirect(u.role === "GERENTE" ? "/gerente" : "/visao-geral");
}
