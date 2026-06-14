import { useMemo, useState } from "react";
import { Sparkles, Trash2, ArrowLeft } from "lucide-react";
import { useStore, uid } from "../lib/store";
import { useNavigate } from "../lib/nav";
import { focusDebt, monthlyIncome } from "../lib/finance";
import { formatCOP, nowISO, formatDate } from "../lib/format";
import {
  Card,
  Button,
  Field,
  MoneyInput,
  IconBadge,
  EmptyState,
  Pill,
} from "../components/ui";
import { Allocation } from "../lib/types";

export function Registro() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const focus = focusDebt(state.debts);
  const income = monthlyIncome(state.incomes);

  const [amount, setAmount] = useState(1000000); // una quincena típica
  const [toDebt, setToDebt] = useState(0);
  const [pocketAlloc, setPocketAlloc] = useState<Record<string, number>>({});
  const [personal, setPersonal] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const assigned = toDebt + personal + Object.values(pocketAlloc).reduce((a, b) => a + b, 0);
  const unassigned = amount - assigned;

  const setPocket = (id: string, v: number) =>
    setPocketAlloc((prev) => ({ ...prev, [id]: v }));

  // Reparte el monto según las proporciones del plan mensual
  const applyPlan = () => {
    const total = state.budget.reduce((s, b) => s + b.target, 0) || income || 1;
    const deudaBudget = state.budget.filter((b) => b.kind === "deuda").reduce((s, b) => s + b.target, 0);
    const personalBudget = state.budget
      .filter((b) => b.kind === "gusto" || b.kind === "fijo")
      .reduce((s, b) => s + b.target, 0);

    setToDebt(Math.round((amount * deudaBudget) / total));
    setPersonal(Math.round((amount * personalBudget) / total));
    const pk: Record<string, number> = {};
    state.pockets.forEach((p) => {
      if (p.monthlyTarget) pk[p.id] = Math.round((amount * p.monthlyTarget) / total);
    });
    setPocketAlloc(pk);
    setResetKey((k) => k + 1);
  };

  const clear = () => {
    setToDebt(0);
    setPersonal(0);
    setPocketAlloc({});
    setResetKey((k) => k + 1);
  };

  const save = () => {
    if (amount <= 0) return;
    const alloc: Allocation = {
      toDebts: focus && toDebt > 0 ? [{ debtId: focus.id, amount: toDebt }] : [],
      toPockets: Object.entries(pocketAlloc)
        .filter(([, v]) => v > 0)
        .map(([pocketId, v]) => ({ pocketId, amount: v })),
      toPersonal: personal,
    };
    dispatch({
      t: "ADD_PAYCHECK",
      paycheck: { id: uid("pc"), date: nowISO(), amount, alloc },
    });
    clear();
    setAmount(1000000);
    navigate("inicio");
  };

  const pocketName = useMemo(
    () => Object.fromEntries(state.pockets.map((p) => [p.id, p])),
    [state.pockets]
  );

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("inicio")} className="p-1 -ml-1 text-white/50">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Me llegó plata 💰</h1>
          <p className="text-sm text-white/50">Registra y reparte tu quincena</p>
        </div>
      </div>

      <Card>
        <Field label="¿Cuánto recibiste?">
          <MoneyInput key={`amt-${resetKey}`} value={amount} onChange={setAmount} />
        </Field>
        <div className="flex gap-2">
          {[500000, 1000000, 2000000].map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              className="flex-1 text-xs font-semibold py-2 rounded-lg bg-white/8 text-white/70 active:scale-95"
            >
              {formatCOP(q)}
            </button>
          ))}
        </div>
      </Card>

      <Button variant="soft" full onClick={applyPlan}>
        <Sparkles size={16} className="inline -mt-0.5 mr-1" /> Repartir según mi plan
      </Button>

      {/* Reparto */}
      <Card className="space-y-1">
        <p className="text-sm font-semibold text-white/70 mb-2">¿Cómo lo repartes?</p>

        {/* A deudas */}
        {focus && (
          <Field label={`Abono a deuda (${focus.name})`}>
            <MoneyInput key={`debt-${resetKey}`} value={toDebt} onChange={setToDebt} />
          </Field>
        )}

        {/* A bolsillos */}
        {state.pockets.map((p) => (
          <Field key={p.id} label={`${p.icon} ${p.name}`}>
            <MoneyInput
              key={`${p.id}-${resetKey}`}
              value={pocketAlloc[p.id] || 0}
              onChange={(v) => setPocket(p.id, v)}
            />
          </Field>
        ))}

        {/* Personal */}
        <Field label="🛍️ Gasto personal / gusto">
          <MoneyInput key={`pers-${resetKey}`} value={personal} onChange={setPersonal} />
        </Field>
      </Card>

      {/* Balance */}
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Sin asignar</p>
          <p className={`text-xl font-bold ${unassigned === 0 ? "text-money-400" : unassigned < 0 ? "text-danger" : "text-warn"}`}>
            {formatCOP(unassigned)}
          </p>
        </div>
        <button onClick={clear} className="text-xs text-white/40 font-semibold">
          Limpiar
        </button>
      </Card>

      <Button full disabled={amount <= 0} onClick={save}>
        Guardar quincena
      </Button>

      {/* Historial */}
      <div>
        <h2 className="font-bold mb-2 mt-2">Historial de quincenas</h2>
        {state.paychecks.length === 0 ? (
          <Card>
            <EmptyState emoji="📥" title="Aún no registras ninguna quincena" />
          </Card>
        ) : (
          <div className="space-y-3">
            {state.paychecks.map((pc) => (
              <Card key={pc.id}>
                <div className="flex items-center gap-3">
                  <IconBadge emoji="💵" tone="money" />
                  <div className="flex-1">
                    <p className="font-bold">{formatCOP(pc.amount)}</p>
                    <p className="text-xs text-white/40">{formatDate(pc.date)}</p>
                  </div>
                  <button
                    onClick={() => dispatch({ t: "DELETE_PAYCHECK", id: pc.id })}
                    className="text-white/30 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {pc.alloc.toDebts.map((d) => (
                    <Pill key={d.debtId} tone="danger">Deuda {formatCOP(d.amount)}</Pill>
                  ))}
                  {pc.alloc.toPockets.map((p) => (
                    <Pill key={p.pocketId} tone="money">
                      {pocketName[p.pocketId]?.icon} {formatCOP(p.amount)}
                    </Pill>
                  ))}
                  {pc.alloc.toPersonal > 0 && <Pill tone="warn">Gusto {formatCOP(pc.alloc.toPersonal)}</Pill>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
