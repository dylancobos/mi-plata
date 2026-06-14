import { useState } from "react";
import { CheckCircle2, Flame } from "lucide-react";
import { useStore } from "../lib/store";
import {
  avalancheOrder,
  totalDebt,
  debtPaid,
  debtProgress,
  focusDebt,
} from "../lib/finance";
import { formatCOP, formatPct } from "../lib/format";
import {
  Card,
  ProgressBar,
  Button,
  Pill,
  Sheet,
  Field,
  MoneyInput,
  IconBadge,
  Confetti,
  EmptyState,
} from "../components/ui";
import { Debt } from "../lib/types";

export function Deudas() {
  const { state, dispatch } = useStore();
  const ordered = avalancheOrder(state.debts);
  const active = ordered.filter((d) => !d.archived);
  const archived = ordered.filter((d) => d.archived);
  const focus = focusDebt(state.debts);

  const [paying, setPaying] = useState<Debt | null>(null);
  const [amount, setAmount] = useState(0);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const debt = totalDebt(state.debts);
  const paid = debtPaid(state.debts);
  const progress = debtProgress(state.debts);

  const openPay = (d: Debt) => {
    setPaying(d);
    setAmount(0);
  };

  const confirmPay = () => {
    if (!paying || amount <= 0) return;
    const willClear = amount >= paying.balance;
    dispatch({ t: "PAY_DEBT", debtId: paying.id, amount });
    if (willClear) {
      setCelebrate(paying.name);
      setTimeout(() => setCelebrate(null), 4500);
    }
    setPaying(null);
  };

  return (
    <div className="space-y-5 animate-pop">
      <Confetti show={!!celebrate} />

      <div>
        <h1 className="text-2xl font-bold">Mis deudas 🎯</h1>
        <p className="text-sm text-white/50">Método avalancha: primero la de mayor interés</p>
      </div>

      {/* Resumen */}
      <Card className="bg-gradient-to-br from-rose-500/10 to-ink-800">
        <p className="text-sm text-white/60">Te falta pagar</p>
        <p className="text-3xl font-bold">{formatCOP(debt)}</p>
        <div className="mt-3">
          <ProgressBar value={progress} tone="money" />
          <div className="flex justify-between mt-1.5 text-xs text-white/50">
            <span>Pagado {formatCOP(paid)}</span>
            <span>{Math.round(progress * 100)}% libre</span>
          </div>
        </div>
      </Card>

      {active.length === 0 && archived.length === 0 && (
        <EmptyState emoji="🎉" title="Sin deudas registradas" sub="Agrega una desde Ajustes." />
      )}

      {active.length === 0 && archived.length > 0 && (
        <Card className="text-center py-6">
          <p className="text-3xl">🏆</p>
          <p className="font-bold mt-1">¡Liquidaste todas tus deudas!</p>
          <p className="text-sm text-white/50 mt-0.5">Eres libre. Ahora todo es para construir patrimonio.</p>
        </Card>
      )}

      {/* Lista de deudas activas */}
      <div className="space-y-3">
        {active.map((d, idx) => {
          const isFocus = focus?.id === d.id;
          const isPaid = d.balance <= 0;
          const prog = d.originalBalance > 0 ? 1 - d.balance / d.originalBalance : 1;
          return (
            <Card key={d.id} className={isFocus ? "ring-1 ring-warn/40" : ""}>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <IconBadge emoji={d.icon} tone={isPaid ? "money" : "neutral"} />
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-ink-700 text-[10px] font-bold grid place-items-center text-white/70">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{d.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/50">
                      {d.interestEA > 0 ? `${formatPct(d.interestEA, 1)} E.A.` : "Sin interés"}
                    </span>
                    {isPaid ? (
                      <Pill tone="money">✓ Pagada</Pill>
                    ) : isFocus ? (
                      <Pill tone="warn"><Flame size={11} className="inline -mt-0.5" /> Atacar</Pill>
                    ) : null}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold tabular-nums">{formatCOP(d.balance)}</p>
                  <p className="text-[11px] text-white/40">de {formatCOP(d.originalBalance)}</p>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar value={prog} tone={isPaid ? "money" : "calm"} height="h-2" />
              </div>
              {!isPaid && (
                <Button variant="soft" full className="mt-3" onClick={() => openPay(d)}>
                  Abonar a esta deuda
                </Button>
              )}
              {isPaid && (
                <div className="mt-3 flex items-center justify-center gap-2 text-money-400 text-sm font-semibold">
                  <CheckCircle2 size={16} /> ¡Liquidada! Bien ahí 🙌
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Deudas liquidadas (archivadas) */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center justify-between w-full px-1 mb-2"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Liquidadas ({archived.length})
            </span>
            <span className="text-xs text-calm-400 font-semibold">
              {showArchived ? "Ocultar" : "Ver"}
            </span>
          </button>
          {showArchived && (
            <Card className="divide-y divide-white/5 p-0">
              {archived.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-9 h-9 rounded-xl bg-money-500/10 grid place-items-center text-base">
                    {d.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-money-400">✓ Liquidada · {formatCOP(d.originalBalance)}</p>
                  </div>
                  <button
                    onClick={() =>
                      dispatch({
                        t: "UPSERT_DEBT",
                        debt: { ...d, balance: d.originalBalance, archived: false },
                      })
                    }
                    className="text-xs text-white/40 font-semibold"
                  >
                    Reactivar
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Historial de abonos */}
      {state.movements.filter((m) => m.kind === "abono").length > 0 && (
        <div>
          <h2 className="font-bold mb-2 mt-2">Historial de abonos</h2>
          <Card className="divide-y divide-white/5 p-0">
            {state.movements
              .filter((m) => m.kind === "abono")
              .slice(0, 12)
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{m.targetName}</p>
                    <p className="text-xs text-white/40">{new Date(m.date).toLocaleDateString("es-CO")}</p>
                  </div>
                  <p className="text-money-400 font-semibold">−{formatCOP(m.amount)}</p>
                </div>
              ))}
          </Card>
        </div>
      )}

      {/* Sheet abonar */}
      <Sheet open={!!paying} onClose={() => setPaying(null)} title={`Abonar a ${paying?.name ?? ""}`}>
        {paying && (
          <>
            <p className="text-sm text-white/50 mb-4">
              Saldo actual: <b className="text-white">{formatCOP(paying.balance)}</b>
            </p>
            <Field label="¿Cuánto vas a abonar?">
              <MoneyInput value={amount} onChange={setAmount} autoFocus />
            </Field>
            <div className="flex gap-2 mb-4">
              {[50000, 100000, paying.balance].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setAmount(q)}
                  className="flex-1 text-xs font-semibold py-2 rounded-lg bg-white/8 text-white/70 active:scale-95"
                >
                  {i === 2 ? "Todo" : formatCOP(q)}
                </button>
              ))}
            </div>
            <Button full disabled={amount <= 0} onClick={confirmPay}>
              {amount >= paying.balance && amount > 0 ? "Liquidar deuda 🎉" : "Registrar abono"}
            </Button>
          </>
        )}
      </Sheet>
    </div>
  );
}
