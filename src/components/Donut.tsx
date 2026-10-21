// Gráfico de rosca (pizza) simples em SVG, sem biblioteca externa.
// Usa variáveis de tema para o centro e o trilho, então funciona no dark.

export type Fatia = { label: string; valor: number; cor: string };

export default function Donut({
  fatias,
  centro,
  rotulo,
}: {
  fatias: Fatia[];
  centro?: string | number;
  rotulo?: string;
}) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  let offset = 0;

  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
      <g transform="rotate(-90 70 70)">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="18"
        />
        {total > 0 &&
          fatias.map((f, i) => {
            const dash = (f.valor / total) * circ;
            const el = (
              <circle
                key={i}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={f.cor}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
      </g>
      <text
        x="70"
        y={rotulo ? 64 : 70}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text)"
        fontSize="26"
        fontWeight="700"
      >
        {centro ?? total}
      </text>
      {rotulo && (
        <text
          x="70"
          y="86"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--muted)"
          fontSize="11"
        >
          {rotulo}
        </text>
      )}
    </svg>
  );
}
