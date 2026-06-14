import { AppState } from "./types";
import {
  netWorth,
  totalDebt,
  debtProgress,
  spendingStatus,
  totalSavings,
  avalancheOrder,
  monthlyIncome,
  pocketCOPValue,
  avoidedTotal,
} from "./finance";
import { formatCOP, nowISO } from "./format";
import { AI_ENDPOINT } from "./config";
import { getAccessToken } from "./cloud";

// Arma un resumen compacto de la situación financiera para mandárselo a la IA.
export function buildContext(state: AppState): string {
  const trm = state.settings.trm;
  const debts = avalancheOrder(state.debts)
    .filter((d) => !d.archived)
    .map((d) => `- ${d.name}: ${formatCOP(d.balance)} (${d.interestEA}% E.A.)`)
    .join("\n");
  const pockets = state.pockets
    .map((p) => `- ${p.name}: ${formatCOP(pocketCOPValue(p, trm))}`)
    .join("\n");
  const spend = spendingStatus(state);

  return [
    `Nombre: ${state.settings.ownerName}`,
    `Ingreso mensual: ${formatCOP(monthlyIncome(state.incomes))}`,
    `Patrimonio neto: ${formatCOP(netWorth(state))}`,
    `Ahorros totales: ${formatCOP(totalSavings(state.pockets, trm))}`,
    `Deuda total: ${formatCOP(totalDebt(state.debts))} (${Math.round(debtProgress(state.debts) * 100)}% pagada)`,
    `Deudas activas (nombre exacto):\n${debts || "ninguna"}`,
    `Bolsillos (nombre exacto):\n${pockets || "ninguno"}`,
    `Tope de gusto del mes: gastado ${formatCOP(spend.spent)} de ${formatCOP(spend.cap)} (quedan ${formatCOP(spend.remaining)})`,
    `Gastos impulsivos evitados (acumulado): ${formatCOP(avoidedTotal(state))}`,
    `TRM actual: ${formatCOP(trm)}`,
  ].join("\n");
}

// ----- Acciones que la IA puede proponer -----

export interface AIAction {
  name: "add_expense" | "pay_debt" | "set_trm" | "pocket_move";
  input: any;
}

export interface ResolvedAction {
  ok: boolean;
  emoji: string;
  label: string;
  error?: string;
  dispatch?: any; // acción del store lista para despachar (id se completa al confirmar)
}

// Traduce lo que propone la IA a una acción concreta del store (resolviendo nombres).
export function resolveAction(a: AIAction, state: AppState): ResolvedAction {
  const num = (v: any) => Math.round(Number(v) || 0);

  switch (a?.name) {
    case "set_trm": {
      const trm = num(a.input?.trm);
      if (trm <= 0) return { ok: false, emoji: "💵", label: "TRM inválida", error: "No entendí la nueva TRM." };
      return {
        ok: true,
        emoji: "💵",
        label: `Actualizar TRM a ${formatCOP(trm)}`,
        dispatch: { t: "UPDATE_SETTINGS", patch: { trm } },
      };
    }
    case "add_expense": {
      const amount = num(a.input?.amount);
      const note = String(a.input?.note || "Gasto").slice(0, 60);
      if (amount <= 0) return { ok: false, emoji: "🛍️", label: "Gasto inválido", error: "No entendí el monto." };
      return {
        ok: true,
        emoji: "🛍️",
        label: `Registrar gasto: ${formatCOP(amount)} — ${note}`,
        dispatch: { t: "ADD_EXPENSE", expense: { id: "", date: nowISO(), amount, note, source: "manual" } },
      };
    }
    case "pay_debt": {
      const amount = num(a.input?.amount);
      const name = String(a.input?.debt || "").toLowerCase().trim();
      const debt = state.debts.find((d) => !d.archived && d.name.toLowerCase().includes(name));
      if (!debt) return { ok: false, emoji: "🎯", label: "Deuda no encontrada", error: `No encontré la deuda "${a.input?.debt}".` };
      if (amount <= 0) return { ok: false, emoji: "🎯", label: "Monto inválido", error: "No entendí el monto del abono." };
      return {
        ok: true,
        emoji: "🎯",
        label: `Abonar ${formatCOP(amount)} a ${debt.name}`,
        dispatch: { t: "PAY_DEBT", debtId: debt.id, amount },
      };
    }
    case "pocket_move": {
      const amount = num(a.input?.amount);
      const name = String(a.input?.pocket || "").toLowerCase().trim();
      const dir = a.input?.direction === "retiro" ? "retiro" : "aporte";
      const pocket = state.pockets.find((p) => p.name.toLowerCase().includes(name));
      if (!pocket) return { ok: false, emoji: "🐷", label: "Bolsillo no encontrado", error: `No encontré el bolsillo "${a.input?.pocket}".` };
      if (amount <= 0) return { ok: false, emoji: "🐷", label: "Monto inválido", error: "No entendí el monto." };
      return {
        ok: true,
        emoji: "🐷",
        label: `${dir === "aporte" ? "Aportar" : "Retirar"} ${formatCOP(amount)} ${dir === "aporte" ? "a" : "de"} ${pocket.name}`,
        dispatch: { t: "POCKET_MOVE", pocketId: pocket.id, amount, dir },
      };
    }
    default:
      return { ok: false, emoji: "❓", label: "Acción desconocida", error: "No pude procesar esa acción." };
  }
}

export type ActionStatus = "pending" | "done" | "dismissed";

export interface AIMessage {
  role: "user" | "assistant";
  text: string;
  actions?: ResolvedAction[];
  status?: ActionStatus[];
}

export interface AIResult {
  reply: string;
  actions: AIAction[];
}

// Llama al proxy de IA (Cloudflare Worker), autenticando con la sesión del usuario.
export async function askAI(message: string, context: string): Promise<AIResult> {
  const token = await getAccessToken();
  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, context }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`El asistente respondió ${res.status}. ${detail.slice(0, 120)}`);
  }
  const data = await res.json();
  return {
    reply: (data.reply || "").toString().trim(),
    actions: Array.isArray(data.actions) ? data.actions : [],
  };
}

export const AI_SUGGESTIONS = [
  "Cambió la TRM a 4.100, ajústala",
  "Gasté 30 mil en domicilio",
  "Aboné 100 mil a la tarjeta Rappi",
  "¿Voy bien con mi plan este mes?",
];
