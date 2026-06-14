import { useRef, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2, Download, Upload, RotateCcw } from "lucide-react";
import { useStore, uid } from "../lib/store";
import { useNavigate } from "../lib/nav";
import { monthlyIncome } from "../lib/finance";
import { formatCOP } from "../lib/format";
import {
  Card,
  Button,
  Field,
  TextInput,
  MoneyInput,
  NumberInput,
  Sheet,
  Alert,
} from "../components/ui";
import { BudgetCategory, Debt, Income, Pocket, Recurring, AppState } from "../lib/types";
import { suggestEmoji } from "../lib/emoji";

type EditState =
  | { type: "income"; item: Income }
  | { type: "budget"; item: BudgetCategory }
  | { type: "debt"; item: Debt }
  | { type: "pocket"; item: Pocket }
  | { type: "recurring"; item: Recurring }
  | null;

const selectClass =
  "w-full rounded-xl bg-ink-900 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-calm-500";

export function Ajustes() {
  const { state, dispatch, exportJSON } = useStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [edit, setEdit] = useState<EditState>(null);
  const [draft, setDraft] = useState<any>(null);

  const open = (e: EditState) => {
    setEdit(e);
    setDraft(e ? { ...e.item } : null);
  };
  const close = () => {
    setEdit(null);
    setDraft(null);
  };

  const save = () => {
    if (!edit || !draft) return;
    if (edit.type === "income") dispatch({ t: "UPSERT_INCOME", income: draft });
    if (edit.type === "budget") dispatch({ t: "UPSERT_BUDGET", cat: draft });
    if (edit.type === "debt")
      dispatch({ t: "UPSERT_DEBT", debt: { ...draft, originalBalance: draft.originalBalance || draft.balance } });
    if (edit.type === "pocket") dispatch({ t: "UPSERT_POCKET", pocket: draft });
    if (edit.type === "recurring") dispatch({ t: "UPSERT_RECURRING", rec: draft });
    close();
  };

  const exportData = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mi-plata-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState;
        if (!parsed.settings || !Array.isArray(parsed.debts)) throw new Error("inválido");
        if (confirm("Esto reemplazará tus datos actuales por los del respaldo. ¿Seguro?")) {
          dispatch({ t: "IMPORT_STATE", state: parsed });
        }
      } catch {
        alert("Ese archivo no es un respaldo válido de Mi Plata.");
      }
    };
    reader.readAsText(file);
  };

  const upd = (patch: any) => setDraft((d: any) => ({ ...d, ...patch }));

  return (
    <div className="space-y-5 animate-pop pb-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("mas")} className="p-1 -ml-1 text-white/50">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl font-bold">Ajustes ⚙️</h1>
      </div>

      {/* Perfil */}
      <section>
        <h2 className="font-bold mb-2">Tu perfil</h2>
        <Card className="space-y-3">
          <Field label="Tu nombre (para los mensajes)">
            <TextInput
              value={state.settings.ownerName}
              onChange={(e) => dispatch({ t: "UPDATE_SETTINGS", patch: { ownerName: e.target.value } })}
            />
          </Field>
          <Field label="Avísame del tope cuando llegue al…" hint="Porcentaje del tope de gusto para la alerta amarilla.">
            <NumberInput
              value={Math.round(state.settings.warnThreshold * 100)}
              onChange={(n) => dispatch({ t: "UPDATE_SETTINGS", patch: { warnThreshold: Math.min(1, Math.max(0.1, n / 100)) } })}
              suffix="%"
            />
          </Field>
          <Field label="TRM (pesos por dólar)">
            <NumberInput
              value={state.settings.trm}
              onChange={(n) => dispatch({ t: "UPDATE_SETTINGS", patch: { trm: n } })}
              suffix="COP"
            />
          </Field>
        </Card>
      </section>


      {/* Ingresos */}
      <Section
        title="Ingresos"
        total={`${formatCOP(monthlyIncome(state.incomes))}/mes`}
        onAdd={() =>
          open({ type: "income", item: { id: uid("inc"), label: "Nuevo ingreso", amount: 0, cadence: "mensual" } })
        }
      >
        {state.incomes.map((i) => (
          <Row
            key={i.id}
            title={i.label}
            sub={`${formatCOP(i.amount)} · ${i.cadence}`}
            onEdit={() => open({ type: "income", item: i })}
            onDelete={() => dispatch({ t: "DELETE_INCOME", id: i.id })}
          />
        ))}
      </Section>

      {/* Presupuesto */}
      <Section
        title="Presupuesto (categorías)"
        total={`${formatCOP(state.budget.reduce((s, b) => s + b.target, 0))}/mes`}
        onAdd={() =>
          open({ type: "budget", item: { id: uid("bud"), name: "Nueva categoría", target: 0, kind: "gusto", icon: "💸" } })
        }
      >
        {state.budget.map((b) => (
          <Row
            key={b.id}
            title={`${b.icon} ${b.name}${b.isSpendingCap ? " · TOPE" : ""}`}
            sub={`${formatCOP(b.target)} · ${b.kind}`}
            onEdit={() => open({ type: "budget", item: b })}
            onDelete={() => dispatch({ t: "DELETE_BUDGET", id: b.id })}
          />
        ))}
      </Section>

      {/* Deudas */}
      <Section
        title="Deudas"
        onAdd={() =>
          open({
            type: "debt",
            item: { id: uid("debt"), name: "Nueva deuda", balance: 0, originalBalance: 0, interestEA: 0, order: state.debts.length + 1, icon: "💳" },
          })
        }
      >
        {state.debts.map((d) => (
          <Row
            key={d.id}
            title={`${d.icon} ${d.name}`}
            sub={`${formatCOP(d.balance)} · ${d.interestEA}% E.A.`}
            onEdit={() => open({ type: "debt", item: d })}
            onDelete={() => dispatch({ t: "DELETE_DEBT", id: d.id })}
          />
        ))}
      </Section>

      {/* Bolsillos */}
      <Section
        title="Bolsillos"
        onAdd={() =>
          open({ type: "pocket", item: { id: uid("pkt"), name: "Nuevo bolsillo", kind: "savings", balance: 0, icon: "🐷" } })
        }
      >
        {state.pockets.map((p) => (
          <Row
            key={p.id}
            title={`${p.icon} ${p.name}`}
            sub={`${p.kind}${p.goal ? ` · meta ${formatCOP(p.goal)}` : ""}`}
            onEdit={() => open({ type: "pocket", item: p })}
            onDelete={() => dispatch({ t: "DELETE_POCKET", id: p.id })}
          />
        ))}
      </Section>

      {/* Gastos recurrentes */}
      <Section
        title="Gastos recurrentes (fijos)"
        onAdd={() =>
          open({
            type: "recurring",
            item: { id: uid("rec"), name: "Nuevo recurrente", amount: 0, dayOfMonth: 1, icon: "🔄", countsToCap: true, active: true },
          })
        }
      >
        {state.recurring.length === 0 && (
          <div className="px-4 py-3 text-sm text-white/40">
            Agrega tus suscripciones o gastos fijos. Se registran solos cada mes.
          </div>
        )}
        {state.recurring.map((r) => (
          <Row
            key={r.id}
            title={`${r.icon} ${r.name}${r.active ? "" : " · pausado"}`}
            sub={`${formatCOP(r.amount)} · día ${r.dayOfMonth}${r.countsToCap ? "" : " · no cuenta al tope"}`}
            onEdit={() => open({ type: "recurring", item: r })}
            onDelete={() => dispatch({ t: "DELETE_RECURRING", id: r.id })}
          />
        ))}
      </Section>

      {/* Datos */}
      <section>
        <h2 className="font-bold mb-2">Tus datos</h2>
        <Card className="space-y-2">
          <Alert level="info">
            Todo se guarda solo en este dispositivo. Haz respaldos de vez en cuando para no perder nada.
          </Alert>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="soft" onClick={exportData}>
              <Download size={15} className="inline -mt-0.5 mr-1" /> Respaldar
            </Button>
            <Button variant="soft" onClick={() => fileRef.current?.click()}>
              <Upload size={15} className="inline -mt-0.5 mr-1" /> Restaurar
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
          <Button
            variant="danger"
            full
            onClick={() => {
              if (confirm("Esto borra TODO y vuelve al plan inicial. ¿Seguro?")) dispatch({ t: "RESET" });
            }}
          >
            <RotateCcw size={15} className="inline -mt-0.5 mr-1" /> Reiniciar al plan inicial
          </Button>
        </Card>
      </section>

      {/* Editor universal */}
      <Sheet open={!!edit} onClose={close} title="Editar">
        {edit?.type === "income" && draft && (
          <>
            <Field label="Nombre">
              <TextInput value={draft.label} onChange={(e) => upd({ label: e.target.value })} />
            </Field>
            <Field label="Monto">
              <MoneyInput value={draft.amount} onChange={(v) => upd({ amount: v })} />
            </Field>
            <Field label="Frecuencia">
              <select className={selectClass} value={draft.cadence} onChange={(e) => upd({ cadence: e.target.value })}>
                <option value="quincenal">Quincenal (x2 al mes)</option>
                <option value="mensual">Mensual</option>
              </select>
            </Field>
          </>
        )}

        {edit?.type === "budget" && draft && (
          <>
            <Field label="Nombre">
              <TextInput value={draft.name} onChange={(e) => upd({ name: e.target.value })} />
            </Field>
            <Field label="Emoji">
              <div className="flex gap-2">
                <TextInput value={draft.icon} onChange={(e) => upd({ icon: e.target.value })} className="flex-1" />
                <button type="button" onClick={() => upd({ icon: suggestEmoji(draft.name) })} className="px-3 rounded-xl bg-calm-500/15 text-calm-400 text-sm font-semibold whitespace-nowrap">
                  ✨ Auto
                </button>
              </div>
            </Field>
            <Field label="Monto / tope mensual">
              <MoneyInput value={draft.target} onChange={(v) => upd({ target: v })} />
            </Field>
            <Field label="Tipo">
              <select className={selectClass} value={draft.kind} onChange={(e) => upd({ kind: e.target.value })}>
                <option value="ahorro">Ahorro</option>
                <option value="inversion">Inversión</option>
                <option value="deuda">Deuda</option>
                <option value="gusto">Gusto</option>
                <option value="fijo">Fijo</option>
              </select>
            </Field>
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={!!draft.isSpendingCap}
                onChange={(e) => upd({ isSpendingCap: e.target.checked })}
                className="w-5 h-5 accent-money-500"
              />
              <span className="text-sm text-white/70">Es mi tope de gasto (con alertas)</span>
            </label>
          </>
        )}

        {edit?.type === "debt" && draft && (
          <>
            <Field label="Emoji">
              <TextInput value={draft.icon} onChange={(e) => upd({ icon: e.target.value })} />
            </Field>
            <Field label="Nombre">
              <TextInput value={draft.name} onChange={(e) => upd({ name: e.target.value })} />
            </Field>
            <Field label="Saldo actual">
              <MoneyInput value={draft.balance} onChange={(v) => upd({ balance: v })} />
            </Field>
            <Field label="Saldo original" hint="Para calcular el % pagado. Si es nueva, déjalo igual al actual.">
              <MoneyInput value={draft.originalBalance} onChange={(v) => upd({ originalBalance: v })} />
            </Field>
            <Field label="Interés (% efectivo anual)">
              <NumberInput value={draft.interestEA} onChange={(v) => upd({ interestEA: v })} suffix="% E.A." step={0.1} />
            </Field>
          </>
        )}

        {edit?.type === "pocket" && draft && (
          <>
            <Field label="Emoji">
              <TextInput value={draft.icon} onChange={(e) => upd({ icon: e.target.value })} />
            </Field>
            <Field label="Nombre">
              <TextInput value={draft.name} onChange={(e) => upd({ name: e.target.value })} />
            </Field>
            <Field label="Tipo">
              <select className={selectClass} value={draft.kind} onChange={(e) => upd({ kind: e.target.value })}>
                <option value="savings">Ahorro (COP)</option>
                <option value="usd">Dólares (USD)</option>
                <option value="liquidity">Líquido / colchón</option>
              </select>
            </Field>
            {draft.kind !== "usd" && (
              <Field label="Saldo actual">
                <MoneyInput value={draft.balance} onChange={(v) => upd({ balance: v })} />
              </Field>
            )}
            <Field label="Meta (opcional)">
              <MoneyInput value={draft.goal || 0} onChange={(v) => upd({ goal: v || undefined })} />
            </Field>
            <Field label="Aporte mensual sugerido (para proyección)">
              <MoneyInput value={draft.monthlyTarget || 0} onChange={(v) => upd({ monthlyTarget: v || undefined })} />
            </Field>
            <Field label="Rendimiento E.A. (opcional)">
              <NumberInput value={draft.apyEA || 0} onChange={(v) => upd({ apyEA: v || undefined })} suffix="% E.A." step={0.05} />
            </Field>
          </>
        )}

        {edit?.type === "recurring" && draft && (
          <>
            <Field label="Nombre">
              <TextInput value={draft.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Ej: Netflix, plan de datos" />
            </Field>
            <Field label="Emoji">
              <div className="flex gap-2">
                <TextInput value={draft.icon} onChange={(e) => upd({ icon: e.target.value })} className="flex-1" />
                <button type="button" onClick={() => upd({ icon: suggestEmoji(draft.name) })} className="px-3 rounded-xl bg-calm-500/15 text-calm-400 text-sm font-semibold whitespace-nowrap">
                  ✨ Auto
                </button>
              </div>
            </Field>
            <Field label="Monto">
              <MoneyInput value={draft.amount} onChange={(v) => upd({ amount: v })} />
            </Field>
            <Field label="Día del mes en que se cobra" hint="Se registra solo cada mes a partir de ese día.">
              <NumberInput value={draft.dayOfMonth} onChange={(v) => upd({ dayOfMonth: Math.min(28, Math.max(1, Math.round(v))) })} />
            </Field>
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!draft.countsToCap}
                onChange={(e) => upd({ countsToCap: e.target.checked })}
                className="w-5 h-5 accent-money-500"
              />
              <span className="text-sm text-white/70">Cuenta contra mi tope de gusto</span>
            </label>
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={!!draft.active}
                onChange={(e) => upd({ active: e.target.checked })}
                className="w-5 h-5 accent-money-500"
              />
              <span className="text-sm text-white/70">Activo (se registra automáticamente)</span>
            </label>
          </>
        )}

        <Button full onClick={save}>
          Guardar
        </Button>
      </Sheet>
    </div>
  );
}

function Section({
  title,
  total,
  onAdd,
  children,
}: {
  title: string;
  total?: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold">
          {title} {total && <span className="text-xs text-white/40 font-normal">· {total}</span>}
        </h2>
        <button onClick={onAdd} className="text-calm-400 text-sm font-semibold flex items-center gap-1">
          <Plus size={16} /> Agregar
        </button>
      </div>
      <Card className="p-0 divide-y divide-white/5">{children}</Card>
    </section>
  );
}

function Row({
  title,
  sub,
  onEdit,
  onDelete,
}: {
  title: string;
  sub: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-white/40 truncate">{sub}</p>
      </div>
      <button onClick={onEdit} className="p-2 text-white/40 hover:text-calm-400">
        <Pencil size={16} />
      </button>
      <button onClick={onDelete} className="p-2 text-white/30 hover:text-rose-400">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
