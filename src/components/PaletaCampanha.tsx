import { CORES_CAMPANHA } from "@/lib/cores-campanha";

export default function PaletaCampanha({ selecionada = "rosa" }: { selecionada?: string }) {
  return (
    <fieldset>
      <legend className="lbl">Cor do destaque</legend>
      <div className="flex flex-wrap gap-2">
        {CORES_CAMPANHA.map((cor) => (
          <label key={cor.id} className="cursor-pointer">
            <input type="radio" name="corDestaque" value={cor.id} defaultChecked={cor.id === selecionada} className="peer sr-only" />
            <span className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm peer-checked:border-blue-700 peer-checked:bg-blue-50 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600">
              <span aria-hidden="true" className="size-4 rounded-full" style={{ background: cor.inicio }} />
              {cor.nome}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
