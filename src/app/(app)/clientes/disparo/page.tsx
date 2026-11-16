import { PainelDisparo } from "./PainelDisparo";

export default async function DisparoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; veiculo?: string; posto?: string }>;
}) {
  return <PainelDisparo searchParams={searchParams} />;
}
