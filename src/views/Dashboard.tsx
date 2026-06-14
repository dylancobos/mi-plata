import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Plus, ChevronRight, Settings, ShoppingBag, Wallet, ShieldCheck } from "lucide-react";
import { useStore } from "../lib/store";
import { useNavigate } from "../lib/nav";
import {
  totalDebt,
  debtProgress,
  netWorth,
  totalSavings,
  spendingStatus,
  motivationalMessage,
  focusDebt,
  pocketCOPValue,
  pocketUSD,
} from "../lib/finance";
import { formatCOP, formatUSD, monthLabel, monthKey } from "../lib/format";
import { Card, ProgressBar, SectionLabel, Fab, Sheet } from "../components/ui";

export function Dashboard() {
  const { state } = useStore();
  const navigate = useNavigate();
  const trm = state.settings.trm;

  const debt = totalDebt(state.debts);
  const progress = debtProgress(state.debts);
  const nw = netWorth(state);
  const savings = totalSavings(state.pockets, trm);
  const spend = spendingStatus(state);
  const motiv = motivationalMessage(state);
  const focus = focusDebt(state.debts);

  const [actions, setActions] = useState(false);
  const trend = state.snapshots.map((s) => ({ month: s.month, nw: s.netWorth }));

  const spendTone = spend.level === "over" ? "danger" : spend.level === "warn" ? "warn" : "money";
  const spendLine =
    spend.level === "over"
      ? `Te pasaste por ${formatCOP(-spend.remaining)}`
      : `Te quedan ${formatCOP(spend.remaining)}`;

  const go = (s: Parameters<typeof navigate>[0]) => {
    setActions(false);
    navigate(s);
  };

  return (
    <div className="space-y-5 animate-pop">
      {/* Encabezado */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-white/40 text-sm capitalize">{monthLabel(monthKey())}</p>
          <h1 className="text-2xl font-bold">Hola, {state.settings.ownerName}</h1>
        </div>
        <button
          onClick={() => navigate("ajustes")}
          className="w-10 h-10 rounded-full bg-white/[0.06] grid place-items-center text-white/60"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Hero: patrimonio neto */}
      <Card className="!p-6">
        <p className="text-sm text-white/50">Patrimonio neto</p>
        <p className={`text-[2.6rem] leading-tight font-bold tracking-tight ${nw >= 0 ? "text-money-400" : "text-white"}`}>
          {formatCOP(nw)}
        </p>
        {trend.length >= 2 ? (
          <div className="h-14 mt-1 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area type="monotone" dataKey="nw" stroke="#34d399" strokeWidth={2} fill="url(#nwGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-px bg-white/5 my-4" />
        )}
        <div className="flex items-center gap-5 text-sm">
          <div>
            <span className="text-white/40">Ahorros</span>{" "}
            <span className="text-money-400 font-semibold">{formatCOP(savings)}</span>
          </div>
          <div>
            <span className="text-white/40">Deuda</span>{" "}
            <span className="text-rose-300 font-semibold">{formatCOP(debt)}</span>
          </div>
        </div>
        <p className="text-sm text-white/45 mt-3">{motiv.sub}</p>
      </Card>

      {/* Camino sin deudas */}
      <Card onClick={() => navigate("deudas")} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">Camino sin deudas</p>
          <ChevronRight size={18} className="text-white/25" />
        </div>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{formatCOP(debt)}</p>
          <p className="text-sm text-money-400 font-semibold mb-0.5">{Math.round(progress * 100)}% libre</p>
        </div>
        <ProgressBar value={progress} tone="money" height="h-2" />
        {focus && (
          <p className="text-sm text-white/45">
            Atacas primero <span className="text-white/80 font-medium">{focus.name}</span>
          </p>
        )}
      </Card>

      {/* Gasto de gusto */}
      <Card onClick={() => navigate("gasto")} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">Gasto de gusto este mes</p>
          <ChevronRight size={18} className="text-white/25" />
        </div>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{formatCOP(spend.spent)}</p>
          <p className="text-sm text-white/40 mb-0.5">de {formatCOP(spend.cap)}</p>
        </div>
        <ProgressBar value={spend.ratio} tone={spendTone} height="h-2" />
        <p
          className={`text-sm font-medium ${
            spend.level === "over" ? "text-rose-300" : spend.level === "warn" ? "text-amber-300" : "text-white/45"
          }`}
        >
          {spendLine}
        </p>
      </Card>

      {/* Bolsillos */}
      <div>
        <SectionLabel
          action={
            <button onClick={() => navigate("bolsillos")} className="text-xs text-calm-400 font-semibold">
              Ver todos
            </button>
          }
        >
          Bolsillos
        </SectionLabel>
        <Card onClick={() => navigate("bolsillos")} className="divide-y divide-white/5 !p-0">
          {state.pockets.map((p) => {
            const cop = pocketCOPValue(p, trm);
            const goalPct = p.goal ? Math.round((cop / p.goal) * 100) : null;
            return (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-9 h-9 rounded-xl bg-white/[0.05] grid place-items-center text-base">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-white/40">
                    {p.kind === "usd"
                      ? formatUSD(pocketUSD(p))
                      : goalPct !== null
                      ? `${goalPct}% de la meta`
                      : p.kind === "liquidity"
                      ? "Líquido"
                      : "Ahorro"}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatCOP(cop)}</p>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Botón flotante de acciones */}
      <Fab onClick={() => setActions(true)} icon={<Plus size={26} className="text-white" />} />

      <Sheet open={actions} onClose={() => setActions(false)} title="¿Qué quieres hacer?">
        <div className="space-y-2">
          <ActionRow
            emoji={<ShoppingBag className="text-amber-300" size={20} />}
            title="¿Voy a comprar algo?"
            sub="Regla de 24 horas antes de gastar"
            onClick={() => go("antiimpulso")}
          />
          <ActionRow
            emoji={<Wallet className="text-calm-400" size={20} />}
            title="Registrar un gasto"
            sub="Anota lo que acabas de comprar"
            onClick={() => go("gasto")}
          />
          <ActionRow
            emoji={<ShieldCheck className="text-money-400" size={20} />}
            title="Registrar quincena"
            sub="Me llegó plata y la reparto"
            onClick={() => go("registro")}
          />
        </div>
      </Sheet>
    </div>
  );
}

function ActionRow({
  emoji,
  title,
  sub,
  onClick,
}: {
  emoji: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full rounded-2xl bg-white/[0.04] px-4 py-3.5 text-left active:scale-[0.98] transition"
    >
      <span className="w-10 h-10 rounded-xl bg-white/[0.05] grid place-items-center">{emoji}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-white/45">{sub}</p>
      </div>
      <ChevronRight size={18} className="text-white/25" />
    </button>
  );
}
