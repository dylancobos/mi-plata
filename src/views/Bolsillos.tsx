import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, TrendingUp } from "lucide-react";
import { useStore } from "../lib/store";
import { pocketCOPValue, pocketUSD, pocketGainCOP, totalSavings } from "../lib/finance";
import { formatCOP, formatUSD, formatPct } from "../lib/format";
import {
  Card,
  ProgressBar,
  Button,
  Sheet,
  Field,
  MoneyInput,
  NumberInput,
  IconBadge,
  Pill,
  Alert,
} from "../components/ui";
import { Pocket } from "../lib/types";

export function Bolsillos() {
  const { state, dispatch } = useStore();
  const trm = state.settings.trm;
  const total = totalSavings(state.pockets, trm);

  const [move, setMove] = useState<{ pocket: Pocket; dir: "aporte" | "retiro" } | null>(null);
  const [amount, setAmount] = useState(0);
  const [trmOpen, setTrmOpen] = useState(false);
  const [trmDraft, setTrmDraft] = useState(trm);

  const confirmMove = () => {
    if (!move || amount <= 0) return;
    dispatch({ t: "POCKET_MOVE", pocketId: move.pocket.id, amount, dir: move.dir });
    setMove(null);
    setAmount(0);
  };

  return (
    <div className="space-y-5 animate-pop">
      <div>
        <h1 className="text-2xl font-bold">Mis bolsillos 🐷</h1>
        <p className="text-sm text-white/50">Ahorro e inversión, separados por meta</p>
      </div>

      {/* Total */}
      <Card className="bg-gradient-to-br from-money-600/20 to-ink-800">
        <p className="text-sm text-white/60">Total ahorrado e invertido</p>
        <p className="text-3xl font-bold text-money-400">{formatCOP(total)}</p>
      </Card>

      {/* Bolsillos */}
      <div className="space-y-3">
        {state.pockets.map((p) => {
          const cop = pocketCOPValue(p, trm);
          const goalPct = p.goal ? cop / p.goal : null;
          const isUSD = p.kind === "usd";
          const gain = pocketGainCOP(p, trm);
          return (
            <Card key={p.id}>
              <div className="flex items-center gap-3">
                <IconBadge emoji={p.icon} tone={isUSD ? "calm" : "money"} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  {p.apyEA ? (
                    <Pill tone="money">{formatPct(p.apyEA, p.apyEA % 1 === 0 ? 0 : 2)} E.A.</Pill>
                  ) : p.kind === "liquidity" ? (
                    <Pill tone="calm">Líquido</Pill>
                  ) : (
                    <Pill tone="neutral">Ahorro</Pill>
                  )}
                </div>
                <p className="font-bold text-lg tabular-nums">{formatCOP(cop)}</p>
              </div>

              {/* Detalle de dólares */}
              {isUSD && (
                <div className="mt-3 rounded-xl bg-ink-900/60 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/50">Tienes</span>
                    <span className="font-semibold">{formatUSD(pocketUSD(p))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Invertido</span>
                    <span>{formatCOP(p.copInvested || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Ganancia por TRM</span>
                    <span className={gain >= 0 ? "text-money-400" : "text-rose-300"}>
                      {gain >= 0 ? "+" : ""}{formatCOP(gain)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setTrmDraft(trm);
                      setTrmOpen(true);
                    }}
                    className="flex items-center gap-1 text-calm-400 text-xs font-semibold pt-1"
                  >
                    <Pencil size={12} /> TRM: {formatCOP(trm)} (editar)
                  </button>
                </div>
              )}

              {/* Meta */}
              {goalPct !== null && (
                <div className="mt-3">
                  <ProgressBar value={goalPct} tone="calm" height="h-2" />
                  <div className="flex justify-between mt-1.5 text-xs text-white/50">
                    <span>Meta {formatCOP(p.goal!)}</span>
                    <span>{Math.round(goalPct * 100)}%</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button variant="soft" onClick={() => { setMove({ pocket: p, dir: "aporte" }); setAmount(0); }}>
                  <ArrowDownLeft size={15} className="inline -mt-0.5" /> Aportar
                </Button>
                <Button variant="ghost" onClick={() => { setMove({ pocket: p, dir: "retiro" }); setAmount(0); }}>
                  <ArrowUpRight size={15} className="inline -mt-0.5" /> Retirar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Movimientos recientes */}
      {state.movements.filter((m) => m.kind !== "abono").length > 0 && (
        <div>
          <h2 className="font-bold mb-2">Movimientos recientes</h2>
          <Card className="divide-y divide-white/5 p-0">
            {state.movements
              .filter((m) => m.kind !== "abono")
              .slice(0, 10)
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{m.targetName}</p>
                    <p className="text-xs text-white/40 capitalize">{m.kind} · {new Date(m.date).toLocaleDateString("es-CO")}</p>
                  </div>
                  <p className={`font-semibold ${m.kind === "aporte" ? "text-money-400" : "text-rose-300"}`}>
                    {m.kind === "aporte" ? "+" : "−"}{formatCOP(m.amount)}
                  </p>
                </div>
              ))}
          </Card>
        </div>
      )}

      {/* Sheet aporte/retiro */}
      <Sheet
        open={!!move}
        onClose={() => setMove(null)}
        title={`${move?.dir === "aporte" ? "Aportar a" : "Retirar de"} ${move?.pocket.name ?? ""}`}
      >
        {move && (
          <>
            {move.pocket.kind === "usd" && (
              <Alert level="info">
                Se convierte a la TRM de hoy ({formatCOP(trm)}). {amount > 0 && (
                  <> Son <b>{formatUSD(amount / trm)}</b>.</>
                )}
              </Alert>
            )}
            <div className="mt-4">
              <Field label={`¿Cuánto vas a ${move.dir === "aporte" ? "aportar" : "retirar"}? (COP)`}>
                <MoneyInput value={amount} onChange={setAmount} autoFocus />
              </Field>
            </div>
            <Button full disabled={amount <= 0} onClick={confirmMove}>
              {move.dir === "aporte" ? "Aportar" : "Retirar"}
            </Button>
          </>
        )}
      </Sheet>

      {/* Sheet editar TRM */}
      <Sheet open={trmOpen} onClose={() => setTrmOpen(false)} title="Editar la TRM">
        <Field label="TRM (pesos por 1 dólar)" hint="Actualízala cuando cambie. Afecta el valor en COP de tus dólares.">
          <NumberInput value={trmDraft} onChange={setTrmDraft} suffix="COP" />
        </Field>
        <Button
          full
          onClick={() => {
            dispatch({ t: "UPDATE_SETTINGS", patch: { trm: trmDraft } });
            setTrmOpen(false);
          }}
        >
          Guardar TRM
        </Button>
      </Sheet>

      <div className="flex items-center justify-center gap-1.5 text-xs text-white/30 pt-1">
        <TrendingUp size={13} /> Con Littio (USDC) tu plata gana en dólares
      </div>
    </div>
  );
}
