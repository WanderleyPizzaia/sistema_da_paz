import { FAROL_INFO, type Farol } from "@/lib/enums";

export default function FarolBadge({
  farol,
  texto,
}: {
  farol: Farol | null;
  texto?: boolean;
}) {
  if (!farol) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        Sem registro
      </span>
    );
  }
  const info = FAROL_INFO[farol];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: info.cor, color: info.corTexto }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: info.corTexto, opacity: 0.85 }}
      />
      {texto ? info.descricao : info.label}
    </span>
  );
}
