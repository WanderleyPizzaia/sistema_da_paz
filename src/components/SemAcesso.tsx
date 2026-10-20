export default function SemAcesso({
  mensagem = "Você não tem permissão para acessar esta página.",
}: {
  mensagem?: string;
}) {
  return (
    <div className="p-6 lg:p-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="mb-1 font-semibold">Sem acesso</h2>
        <p className="text-sm">{mensagem}</p>
      </div>
    </div>
  );
}
