import { redirect } from "next/navigation";
import { encerrarSessao } from "@/lib/session";

// Logout por link (GET). Encerra a sessão e volta ao login.
export async function GET() {
  await encerrarSessao();
  redirect("/login");
}
