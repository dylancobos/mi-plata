import { useState } from "react";
import { Trash2, Plus, Mic, CheckCircle2, Sparkles } from "lucide-react";
import { useStore, uid } from "../lib/store";
import { spendingStatus, monthlyIncome } from "../lib/finance";
import { formatCOP, formatUSD, isSameMonth, formatDate, nowISO, monthLabel, monthKey } from "../lib/format";
import { parseQuickExpense } from "../lib/quickadd";
import { useVoice } from "../lib/useVoice";
import {
  Card,
  ProgressBar,
  Button,
  Alert,
  Sheet,
  Field,
  MoneyInput,
  NumberInput,
  TextInput,
  IconBadge,
  Pill,
  EmptyState,
} from "../components/ui";

const KIND_LABEL: Record<string, string> = {
  ahorro: "Ahorro",
  fijo: "Fijo",
  gusto: "Gusto",
  inversion: "Inversión",
  deuda: "Deuda",
};
const KIND_TONE: Record<string, "money" | "calm" | "warn" | "danger" | "neutral"> = {
  ahorro: "money",
  fijo: "neutral",
  gusto: "warn",
  inversion: "calm",
  deuda: "danger",
};

export function Gasto() {
  const { state, dispatch } = useStore();
  const spend = spendingStatus(state);
  const income = monthlyIncome(state.incomes);
  const trm = state.settings.trm;
  const budgetTotal = state.budget.reduce((s, b) => s + b.target, 0);

  const monthExpenses = state.expenses.filter((e) => isSameMonth(e.date));
  const pending = monthExpenses.filter((e) => e.pending);
  const confirmed = monthExpenses.filter((e) => !e.pending);

  const [quick, setQuick] = useState("");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [isUSD, setIsUSD] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const shown = term
    ? confirmed.filter(
        (e) =>
          e.note.toLowerCase().includes(term) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(term))
      )
    : confirmed;

  const addExpenseRaw = (amt: number, nota: string, source: "manual" | "voz") => {
    if (amt <= 0) return;
    dispatch({
      t: "ADD_EXPENSE",
      expense: { id: uid("exp"), date: nowISO(), amount: amt, note: nota.trim() || "Gasto", source },
    });
    setFlash(`${formatCOP(amt)} · ${nota.trim() || "Gasto"}`);
    setTimeout(() => setFlash(null), 2500);
  };

  const submitQuick = (text?: string, source: "manual" | "voz" = "manual") => {
    const parsed = parseQuickExpense(text ?? quick);
    if (parsed.amount > 0) {
      addExpenseRaw(parsed.amount, parsed.note, source);
      setQuick("");
    } else {
      setQuick(text ?? quick);
    }
  };

  const voice = useVoice((text) => submitQuick(text, "voz"));

  const addFromSheet = () => {
    if (amount <= 0) return;
    const cop = isUSD ? Math.round(amount * trm) : amount;
    const finalNote = isUSD ? `${note.trim() || "Gasto"} (US$${amount})` : note.trim() || "Gasto";
    const tags = tagsText
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    dispatch({
      t: "ADD_EXPENSE",
      expense: {
        id: uid("exp"),
        date: nowISO(),
        amount: cop,
        note: finalNote,
        source: "manual",
        tags: tags.length ? tags : undefined,
      },
    });
    setAmount(0);
    setNote("");
    setTagsText("");
    setIsUSD(false);
    setOpen(false);
  };

  const barTone = spend.level === "over" ? "danger" : spend.level === "warn" ? "warn" : "money";

  return (
    <div className="space-y-5 animate-pop">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gasto del mes 🛍️</h1>
          <p className="text-sm text-white/50 capitalize">{monthLabel(monthKey())}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="!px-3 !py-2">
          <Plus size={18} className="inline -mt-0.5" /> Detallado
        </Button>
      </div>

      {/* Registro rápido (estilo MonAi) */}
      <Card>
        <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
          <Sparkles size={12} className="text-calm-400" /> Registro rápido — escribe o dicta
        </p>
        <div className="flex gap-2">
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitQuick()}
            placeholder="Ej: domicilio 25000"
            className="flex-1 rounded-xl bg-ink-900 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-calm-500"
          />
          {voice.supported && (
            <button
              onClick={voice.start}
              className={`w-12 rounded-xl grid place-items-center transition active:scale-95 ${
                voice.listening ? "bg-danger/30 text-rose-300 animate-pulse" : "bg-white/8 text-white/70"
              }`}
              aria-label="Dictar gasto"
            >
              <Mic size={18} />
            </button>
          )}
          <button
            onClick={() => submitQuick()}
            className="w-12 rounded-xl grid place-items-center bg-gradient-to-br from-money-500 to-money-600 text-white active:scale-95"
            aria-label="Agregar"
          >
            <Plus size={20} />
          </button>
        </div>
        {voice.listening && <p className="text-xs text-calm-400 mt-2">Escuchando… dime el gasto 🎙️</p>}
        {flash && (
          <p className="text-xs text-money-400 mt-2 flex items-center gap-1">
            <CheckCircle2 size={13} /> Agregado: {flash}
          </p>
        )}
      </Card>

      {/* Tope de gusto — la tarjeta estrella */}
      <Card className={spend.level === "over" ? "ring-1 ring-danger/50" : spend.level === "warn" ? "ring-1 ring-warn/40" : ""}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/60">Tope de gusto este mes</p>
          <Pill tone={barTone === "money" ? "money" : barTone === "warn" ? "warn" : "danger"}>
            {Math.round(spend.ratio * 100)}%
          </Pill>
        </div>
        <div className="flex items-end justify-between mt-1">
          <p className="text-3xl font-bold tabular-nums">{formatCOP(spend.spent)}</p>
          <p className="text-white/50 mb-1">de {formatCOP(spend.cap)}</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={spend.ratio} tone={barTone} />
        </div>
        <div className="mt-3">
          {spend.level === "ok" && (
            <Alert level="ok" title={`Te quedan ${formatCOP(spend.remaining)} 🟢`}>
              Vas bien. Cada peso que no gastes de aquí, lo puedes mandar a tus metas.
            </Alert>
          )}
          {spend.level === "warn" && (
            <Alert level="warn" title={`¡Ojo! Te queda ${formatCOP(spend.remaining)} 🟡`}>
              Ya casi tocas tu tope de gusto. Piensa bien la próxima compra.
            </Alert>
          )}
          {spend.level === "over" && (
            <Alert level="danger" title={`Te pasaste por ${formatCOP(-spend.remaining)} 🔴`}>
              Pasaste el tope de {formatCOP(spend.cap)}. No pasa nada, respira: el otro mes arrancas en ceros.
            </Alert>
          )}
        </div>
      </Card>

      {/* Por confirmar (entran por Apple Pay / Atajo) */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-bold mb-2 flex items-center gap-2">
            Por confirmar <Pill tone="calm">{pending.length}</Pill>
          </h2>
          <Card className="divide-y divide-white/5 p-0">
            {pending.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <IconBadge emoji="💳" tone="calm" />
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => {
                      const nuevo = prompt("¿En qué fue este gasto?", e.note);
                      if (nuevo !== null) dispatch({ t: "UPDATE_EXPENSE", id: e.id, patch: { note: nuevo } });
                    }}
                    className="text-sm font-medium truncate text-left underline decoration-dotted decoration-white/30"
                  >
                    {e.note}
                  </button>
                  <p className="text-xs text-white/40">{formatDate(e.date)} · Apple Pay</p>
                </div>
                <p className="font-semibold tabular-nums">{formatCOP(e.amount)}</p>
                <button
                  onClick={() => dispatch({ t: "UPDATE_EXPENSE", id: e.id, patch: { pending: false } })}
                  className="text-money-400 p-1"
                  aria-label="Confirmar"
                >
                  <CheckCircle2 size={20} />
                </button>
                <button
                  onClick={() => dispatch({ t: "DELETE_EXPENSE", id: e.id })}
                  className="text-white/30 hover:text-rose-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Gastos del mes */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="font-bold">Gastos de este mes</h2>
          {confirmed.length > 3 && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar o #tag"
              className="text-sm rounded-lg bg-ink-900 border border-white/10 px-3 py-1.5 w-36 focus:outline-none focus:border-calm-500 placeholder-white/30"
            />
          )}
        </div>
        {confirmed.length === 0 ? (
          <Card>
            <EmptyState emoji="🧾" title="Aún no registras gastos" sub="Usa el registro rápido de arriba cada vez que compres algo." />
          </Card>
        ) : shown.length === 0 ? (
          <Card>
            <EmptyState emoji="🔍" title="Nada con esa búsqueda" />
          </Card>
        ) : (
          <Card className="divide-y divide-white/5 p-0">
            {shown.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.note}</p>
                  <p className="text-xs text-white/40">
                    {formatDate(e.date)}
                    {e.source === "voz" && " · 🎙️"}
                    {e.source === "atajo" && " · Apple Pay"}
                    {e.source === "recurrente" && " · 🔄 Fijo"}
                  </p>
                  {e.tags && e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {e.tags.map((t) => (
                        <span key={t} className="text-[10px] text-calm-400 bg-calm-500/10 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="font-semibold tabular-nums">{formatCOP(e.amount)}</p>
                <button
                  onClick={() => dispatch({ t: "DELETE_EXPENSE", id: e.id })}
                  className="text-white/30 hover:text-rose-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Plan de presupuesto del mes */}
      <div>
        <h2 className="font-bold mb-2">Tu plan del mes</h2>
        <Card className="space-y-3">
          {state.budget.map((b) => (
            <div key={b.id} className="flex items-center gap-3">
              <IconBadge emoji={b.icon} tone={KIND_TONE[b.kind]} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{b.name}</p>
                <Pill tone={KIND_TONE[b.kind]}>{KIND_LABEL[b.kind]}</Pill>
              </div>
              <p className="font-semibold tabular-nums">{formatCOP(b.target)}</p>
            </div>
          ))}
          <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm">
            <span className="text-white/60">Total planificado</span>
            <span className={`font-bold ${budgetTotal > income ? "text-warn" : "text-money-400"}`}>
              {formatCOP(budgetTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Ingreso mensual</span>
            <span className="font-bold">{formatCOP(income)}</span>
          </div>
          {budgetTotal > income && (
            <Alert level="warn">Tu plan suma más que tu ingreso. Ajusta las categorías en Ajustes.</Alert>
          )}
        </Card>
        <p className="text-xs text-white/40 mt-2 text-center">Edita montos y topes en Ajustes ⚙️</p>
      </div>

      {/* Sheet registrar gasto detallado */}
      <Sheet open={open} onClose={() => setOpen(false)} title="Registrar un gasto">
        {/* Moneda */}
        <div className="flex gap-2 mb-4 bg-ink-900 rounded-xl p-1">
          {[
            { k: false, label: "Pesos (COP)" },
            { k: true, label: "Dólares (USD)" },
          ].map((opt) => (
            <button
              key={String(opt.k)}
              onClick={() => setIsUSD(opt.k)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                isUSD === opt.k ? "bg-white/12 text-white" : "text-white/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Field label="¿Cuánto gastaste?">
          {isUSD ? (
            <NumberInput value={amount} onChange={setAmount} suffix="USD" step={0.01} />
          ) : (
            <MoneyInput value={amount} onChange={setAmount} autoFocus />
          )}
        </Field>
        {isUSD && amount > 0 && (
          <p className="-mt-2 mb-4 text-sm text-calm-400">≈ {formatCOP(amount * trm)} (TRM {formatCOP(trm)})</p>
        )}

        <Field label="¿En qué?">
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: domicilio, ropa, salida..." />
        </Field>
        <Field label="Etiquetas (opcional)" hint="Sepáralas con comas. Ej: trabajo, antojo">
          <TextInput value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="#tag1, #tag2" />
        </Field>
        <Button full disabled={amount <= 0} onClick={addFromSheet}>
          Guardar gasto
        </Button>
      </Sheet>
    </div>
  );
}
