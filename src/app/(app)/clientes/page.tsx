import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/session";
import { podeVerClientes, podeEditarClientes, podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { TIPOS_VEICULO, VEICULO_LABEL } from "@/lib/enums";

type Busca = { q?: string; veiculo?: string; posto?: string; origem?: string; aceite?: string; segmento?: string; pagina?: string };
const porPagina = 25;
const fuso = "America/Sao_Paulo";
const optIn = { finalidade: "MARKETING_WHATSAPP", aceito: true };
const segmentos = [["", "Todos"], ["app", "Motoristas de app"], ["moto", "Motociclistas"], ["paz365", "Clientes PAZ365"], ["sorteio", "Participantes do sorteio"]];
const campo = "mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm";
const botao = "rounded-xl border px-3 py-2.5 text-sm font-semibold";
const fmt = new Intl.NumberFormat("pt-BR");

export default async function ClientesPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const u = await requireUser();
  if (!podeVerClientes(u)) return <SemAcesso />;

  const params = await searchParams;
  const valor = (chave: keyof Busca) => typeof params[chave] === "string" ? params[chave]?.trim() ?? "" : "";
  const q = valor("q");
  const posto = valor("posto");
  const veiculo = valor("veiculo");
  const origem = valor("origem");
  const aceite = valor("aceite");
  const segmento = valor("segmento");
  const solicitado = Number(valor("pagina"));
  const hoje = new Date();
  const hojeLocal = new Intl.DateTimeFormat("en-CA", { timeZone: fuso, dateStyle: "short" }).formatToParts(hoje);
  const parte = (tipo: string) => hojeLocal.find((item) => item.type === tipo)?.value;
  const inicioSemana = new Date(`${parte("year")}-${parte("month")}-${parte("day")}T03:00:00Z`);
  inicioSemana.setUTCDate(inicioSemana.getUTCDate() - (inicioSemana.getUTCDay() + 6) % 7);
  const nomeOuTelefone: Prisma.ClienteWhereInput = q ? { OR: [
    { nome: { contains: q, mode: "insensitive" } },
    ...(q.replace(/\D/g, "") ? [{ whatsapp: { contains: q.replace(/\D/g, "") } }] : []),
  ] } : {};
  const where: Prisma.ClienteWhereInput = { AND: [
    nomeOuTelefone,
    posto ? { postoPreferidoId: posto } : {},
    veiculo ? { tipoVeiculo: veiculo } : {},
    origem ? { origem: { startsWith: origem, mode: "insensitive" } } : {},
    aceite === "sim" ? { consentimentos: { some: optIn } } : aceite === "nao" ? { consentimentos: { none: optIn } } : {},
    segmento === "app" ? { tipoVeiculo: "CARRO_APP" } : {},
    segmento === "moto" ? { tipoVeiculo: "MOTO" } : {},
    segmento === "paz365" ? { tags: { contains: "PAZ365", mode: "insensitive" } } : {},
    segmento === "sorteio" ? { participacoes: { some: { campanha: { tipo: "SORTEIO" } } } } : {},
  ] };
  const [postos, total, filtrados, novos, comAceite] = await Promise.all([
    prisma.posto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.cliente.count(),
    prisma.cliente.count({ where }),
    prisma.cliente.count({ where: { criadoEm: { gte: inicioSemana } } }),
    prisma.cliente.count({ where: { consentimentos: { some: optIn } } }),
  ]);
  const paginas = Math.max(1, Math.ceil(filtrados / porPagina));
  const pagina = Number.isInteger(solicitado) ? Math.min(paginas, Math.max(1, solicitado)) : 1;
  const clientes = await prisma.cliente.findMany({
    where, orderBy: [{ criadoEm: "desc" }, { id: "asc" }], skip: (pagina - 1) * porPagina, take: porPagina,
    select: {
      id: true, nome: true, whatsapp: true, origem: true, tipoVeiculo: true,
      postoPreferido: { select: { nome: true } },
      consentimentos: { where: { finalidade: optIn.finalidade }, select: { aceito: true } },
    },
  });
  const href = (extra: Busca) => {
    const query = new URLSearchParams();
    for (const [chave, item] of Object.entries({ q, posto, veiculo, origem, aceite, segmento, ...extra })) if (item) query.set(chave, item);
    return query.size ? "/clientes?" + query : "/clientes";
  };
  const filtrosDisparo = new URLSearchParams({ q, posto, veiculo });
  const segmentoCompativel = !origem && !aceite && !segmento;

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <header className="border-b border-gray-200 bg-white px-5 py-3 lg:px-8">
        <form action="/clientes" className="flex max-w-3xl flex-wrap gap-2">
          <input name="q" aria-label="Buscar cliente" placeholder="Buscar por nome ou WhatsApp" defaultValue={q} className="min-w-48 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm" />
          <select name="posto" aria-label="Filtrar por posto" defaultValue={posto} className="rounded-xl border border-gray-300 px-3 py-2 text-sm">
            <option value="">Todos os postos</option>{postos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
          {Object.entries({ veiculo, origem, aceite, segmento }).map(([nome, item]) => item && <input key={nome} type="hidden" name={nome} value={item} />)}
          <button className={botao}>Buscar</button>
        </form>
      </header>

      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
          <span aria-hidden="true" className="absolute -right-24 -top-40 -z-10 size-80 rounded-full bg-white/5" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-blue-100">BASE DE CLIENTES</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">Clientes</h1>
              <p className="mt-2 text-sm text-blue-100">Quem passa pelos postos e pela PAZ365, de onde veio e se aceita WhatsApp</p>
            </div>
            {podeEditarClientes(u) && <Link href="/clientes/novo" className={botao + " border-transparent bg-[#be2530] !text-white"}>+ Novo cliente</Link>}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[["Clientes na base", fmt.format(total)], ["Novos nesta semana", fmt.format(novos)], ["Aceitaram WhatsApp", total ? Math.round(comAceite / total * 100) + "%" : "—"], ["Inativos há 30+ dias", "—"]].map(([titulo, v]) => (
              <div key={titulo} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3"><dt className="text-xs text-blue-100">{titulo}</dt><dd className="mt-1 text-3xl font-semibold">{v}</dd></div>
            ))}
          </dl>
        </section>

        <nav aria-label="Segmentos de clientes" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs tracking-widest text-gray-600 uppercase">Segmentos</span>
          {segmentos.map(([id, nome]) => <Link key={id} href={href({ segmento: id })} aria-current={segmento === id ? "true" : undefined}
            className={`rounded-full border px-3 py-2 text-xs font-semibold ${segmento === id ? "border-[#304299] bg-[#304299] !text-white" : "border-gray-200 bg-white"}`}>{nome}</Link>)}
        </nav>

        <form action="/clientes" className="grid items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <input type="hidden" name="q" value={q} /><input type="hidden" name="segmento" value={segmento} />
          <label className="text-xs font-semibold">Posto preferido<select name="posto" defaultValue={posto} className={campo}>
            <option value="">Todos</option>{postos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select></label>
          <label className="text-xs font-semibold">Origem do cadastro<select name="origem" defaultValue={origem} className={campo}>
            <option value="">Todas</option><option value="QR">QR na bomba</option><option value="Instagram">Instagram</option><option value="Landing">Landing page</option><option value="Balcão">Balcão PAZ365</option><option value="MANUAL">Cadastro manual</option>
          </select></label>
          <label className="text-xs font-semibold">Tipo de veículo<select name="veiculo" defaultValue={veiculo} className={campo}>
            <option value="">Todos</option>{TIPOS_VEICULO.map((v) => <option key={v} value={v}>{VEICULO_LABEL[v]}</option>)}<option value="CARRO_APP">Carro de app</option>
          </select></label>
          <label className="text-xs font-semibold">Aceite WhatsApp<select name="aceite" defaultValue={aceite} className={campo}>
            <option value="">Todos</option><option value="sim">Sim</option><option value="nao">Sem aceite</option>
          </select></label>
          <button className={botao + " bg-[#304299] !text-white"}>Filtrar</button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#304299] px-4 py-3 text-white">
          <strong className="text-sm">{fmt.format(filtrados)} {filtrados === 1 ? "cliente encontrado" : "clientes encontrados"}</strong>
          {podeOperarMarketing(u) && segmentoCompativel && <Link href={`/clientes/disparo?${filtrosDisparo}`} className={botao + " border-transparent bg-[#be2530] !text-white"}>Enviar WhatsApp</Link>}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[865px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs tracking-wide text-gray-600 uppercase"><tr>
                {["Nome", "WhatsApp", "Posto preferido", "Origem", "Veículo", "Visitas", "Última visita", "Aceite WhatsApp"].map((titulo) => <th key={titulo} scope="col" className="px-4 py-3 font-semibold">{titulo}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((cliente) => {
                  const tel = cliente.whatsapp.replace(/\D/g, "");
                  const aceitou = cliente.consentimentos.some((item) => item.aceito);
                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <th scope="row" className="px-4 py-3 font-semibold"><Link href={`/clientes/${cliente.id}`} className="underline">{cliente.nome}</Link></th>
                      <td className="whitespace-nowrap px-4 py-3">{tel.length >= 10 ? `(${tel.slice(-11, -9)}) ••••-••${tel.slice(-2)}` : "••••"}</td>
                      <td className="px-4 py-3">{cliente.postoPreferido?.nome ?? "—"}</td>
                      <td className="px-4 py-3">{cliente.origem ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-900">{cliente.origem}</span> : "—"}</td>
                      <td className="px-4 py-3">{cliente.tipoVeiculo ? VEICULO_LABEL[cliente.tipoVeiculo] ?? (cliente.tipoVeiculo === "CARRO_APP" ? "Carro de app" : cliente.tipoVeiculo) : "—"}</td>
                      <td className="px-4 py-3">—</td><td className="px-4 py-3">—</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${aceitou ? "bg-green-50 text-green-800" : cliente.consentimentos.length ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>{aceitou ? "Sim" : cliente.consentimentos.length ? "Não" : "Pendente"}</span></td>
                    </tr>
                  );
                })}
                {!clientes.length && <tr><td colSpan={8} className="p-8 text-center text-gray-600">Nenhum cliente encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
            <span>Mostrando {filtrados ? (pagina - 1) * porPagina + 1 : 0}–{Math.min(pagina * porPagina, filtrados)} de {fmt.format(filtrados)}</span>
            <nav aria-label="Paginação de clientes" className="flex items-center gap-2">
              {pagina > 1 && <Link href={href({ pagina: String(pagina - 1) })} className="rounded-lg border px-3 py-2">Anterior</Link>}
              <span aria-current="page" className="rounded-lg bg-[#304299] px-3 py-2 text-white">{pagina}</span>
              {pagina < paginas && <Link href={href({ pagina: String(pagina + 1) })} className="rounded-lg border px-3 py-2">Próxima</Link>}
            </nav>
          </footer>
        </div>
        <p className="text-xs text-gray-600">O WhatsApp aparece mascarado na lista. Consulte o número completo na ficha do cliente.</p>
      </div>
    </div>
  );
}
