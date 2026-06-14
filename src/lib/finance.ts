import {
  AppState,
  Debt,
  Expense,
  Income,
  Pocket,
} from "./types";
import { isSameMonth, monthKey } from "./format";

// ----- Ingresos -----

export function monthlyIncome(incomes: Income[]): number {
  return incomes.reduce(
    (sum, i) => sum + (i.cadence === "quincenal" ? i.amount * 2 : i.amount),
    0
  );
}

// ----- Bolsillos -----

// Valor en COP de un bolsillo (los USD se reconvierten con la TRM actual)
export function pocketCOPValue(p: Pocket, trm: number): number {
  if (p.kind === "usd") return Math.round((p.usdBalance || 0) * trm);
  return p.balance;
}

export function pocketUSD(p: Pocket): number {
  return p.usdBalance || 0;
}

export function pocketGainCOP(p: Pocket, trm: number): number {
  if (p.kind !== "usd") return 0;
  return pocketCOPValue(p, trm) - (p.copInvested || 0);
}

export function totalSavings(pockets: Pocket[], trm: number): number {
  return pockets.reduce((sum, p) => sum + pocketCOPValue(p, trm), 0);
}

// ----- Deudas -----

export function totalDebt(debts: Debt[]): number {
  return debts.reduce((s, d) => s + Math.max(0, d.balance), 0);
}

export function totalOriginalDebt(debts: Debt[]): number {
  return debts.reduce((s, d) => s + d.originalBalance, 0);
}

export function debtPaid(debts: Debt[]): number {
  return Math.max(0, totalOriginalDebt(debts) - totalDebt(debts));
}

export function debtProgress(debts: Debt[]): number {
  const orig = totalOriginalDebt(debts);
  if (orig <= 0) return 1;
  return Math.min(1, debtPaid(debts) / orig);
}

// Deudas ordenadas por avalancha (mayor interés primero, respetando "order")
export function avalancheOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => {
    if (b.interestEA !== a.interestEA) return b.interestEA - a.interestEA;
    return a.order - b.order;
  });
}

// La deuda que toca atacar ahora (la primera con saldo > 0)
export function focusDebt(debts: Debt[]): Debt | null {
  const active = avalancheOrder(debts).filter((d) => d.balance > 0);
  return active[0] || null;
}

// ----- Patrimonio neto -----

export function netWorth(state: AppState): number {
  return totalSavings(state.pockets, state.settings.trm) - totalDebt(state.debts);
}

// ----- Gasto personal del periodo (el tope) -----

export interface SpendingStatus {
  cap: number;
  spent: number;
  remaining: number;
  ratio: number; // 0..1+
  level: "ok" | "warn" | "over";
}

export function spendingThisMonth(expenses: Expense[]): number {
  return expenses
    .filter((e) => isSameMonth(e.date) && !e.excludeFromCap)
    .reduce((s, e) => s + e.amount, 0);
}

export function spendingStatus(state: AppState): SpendingStatus {
  const capCat = state.budget.find((b) => b.isSpendingCap);
  const cap = capCat?.target ?? 0;
  const spent = spendingThisMonth(state.expenses);
  const remaining = cap - spent;
  const ratio = cap > 0 ? spent / cap : 0;
  let level: SpendingStatus["level"] = "ok";
  if (ratio >= 1) level = "over";
  else if (ratio >= state.settings.warnThreshold) level = "warn";
  return { cap, spent, remaining, ratio, level };
}

// ----- Anti-impulso -----

export function avoidedTotal(state: AppState): number {
  return state.impulses
    .filter((i) => i.decision === "avoided")
    .reduce((s, i) => s + i.price, 0);
}

export function avoidedCount(state: AppState): number {
  return state.impulses.filter((i) => i.decision === "avoided").length;
}

// ----- Proyección (simulación mes a mes con método avalancha) -----

export interface ProjectionPoint {
  monthIndex: number;
  label: string;
  totalDebt: number;
  savings: number;
  dollars: number; // valor COP del bolsillo de dólares
}

export interface ProjectionResult {
  points: ProjectionPoint[];
  monthsToDebtFree: number | null;
  fundFreeMonthIndex: number | null; // cuándo se libera la deuda del fondo
  monthlyDebtPayment: number;
  debtFreeLabel: string | null;
}

function addMonthsLabel(start: Date, add: number): string {
  const d = new Date(start.getFullYear(), start.getMonth() + add, 1);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${meses[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

// Aporte mensual a deudas = suma de categorías de presupuesto de tipo "deuda"
export function monthlyDebtBudget(state: AppState): number {
  return state.budget
    .filter((b) => b.kind === "deuda")
    .reduce((s, b) => s + b.target, 0);
}

export function buildProjection(
  state: AppState,
  fundDebtId = "debt-fondo",
  maxMonths = 600
): ProjectionResult {
  const trm = state.settings.trm;
  const monthlyPay = monthlyDebtBudget(state);

  // Copias de saldos para simular
  const debts = avalancheOrder(state.debts).map((d) => ({ ...d }));
  const pockets = state.pockets.map((p) => ({ ...p }));

  const points: ProjectionPoint[] = [];
  const start = new Date();

  const snap = (i: number): ProjectionPoint => {
    const dollarsPkt = pockets.find((p) => p.kind === "usd");
    return {
      monthIndex: i,
      label: addMonthsLabel(start, i),
      totalDebt: debts.reduce((s, d) => s + Math.max(0, d.balance), 0),
      savings: pockets
        .filter((p) => p.kind !== "usd")
        .reduce((s, p) => s + p.balance, 0),
      dollars: dollarsPkt ? Math.round((dollarsPkt.usdBalance || 0) * trm) : 0,
    };
  };

  points.push(snap(0));

  let monthsToDebtFree: number | null = null;
  let fundFreeMonthIndex: number | null = null;

  for (let m = 1; m <= maxMonths; m++) {
    // 1) Pagar deudas con avalancha
    let pay = monthlyPay;
    for (const d of debts) {
      if (pay <= 0) break;
      if (d.balance <= 0) continue;
      const applied = Math.min(pay, d.balance);
      d.balance -= applied;
      pay -= applied;
    }

    // 2) Crecer ahorros e inversión (aporte mensual + rendimiento)
    for (const p of pockets) {
      const monthly = p.monthlyTarget || 0;
      if (p.kind === "usd") {
        if (monthly > 0) p.usdBalance = (p.usdBalance || 0) + monthly / trm;
        if (p.apyEA) p.usdBalance = (p.usdBalance || 0) * (1 + p.apyEA / 100 / 12);
      } else {
        p.balance += monthly;
        if (p.apyEA) p.balance = p.balance * (1 + p.apyEA / 100 / 12);
      }
    }

    const fund = debts.find((d) => d.id === fundDebtId);
    if (fundFreeMonthIndex === null && fund && fund.balance <= 0) {
      fundFreeMonthIndex = m;
    }

    const allClear = debts.every((d) => d.balance <= 0);
    points.push(snap(m));

    if (allClear && monthsToDebtFree === null) {
      monthsToDebtFree = m;
      // Seguimos unos meses más para ver crecer el ahorro
      const extra = Math.min(6, maxMonths - m);
      for (let k = 1; k <= extra; k++) {
        for (const p of pockets) {
          const monthly = p.monthlyTarget || 0;
          if (p.kind === "usd") {
            if (monthly > 0) p.usdBalance = (p.usdBalance || 0) + monthly / trm;
            if (p.apyEA) p.usdBalance = (p.usdBalance || 0) * (1 + p.apyEA / 100 / 12);
          } else {
            p.balance += monthly;
            if (p.apyEA) p.balance = p.balance * (1 + p.apyEA / 100 / 12);
          }
        }
        points.push(snap(m + k));
      }
      break;
    }
  }

  return {
    points,
    monthsToDebtFree,
    fundFreeMonthIndex,
    monthlyDebtPayment: monthlyPay,
    debtFreeLabel: monthsToDebtFree !== null ? addMonthsLabel(start, monthsToDebtFree) : null,
  };
}

// ----- Mensaje motivacional segun progreso -----

export function motivationalMessage(state: AppState): { title: string; sub: string } {
  const name = state.settings.ownerName || "crack";
  const progress = debtProgress(state.debts);
  const spend = spendingStatus(state);
  const avoided = avoidedTotal(state);

  if (spend.level === "over") {
    return {
      title: `Ojo, ${name} 🚦`,
      sub: `Te pasaste del tope de gusto por ${Math.round((spend.ratio - 1) * 100)}%. Respira, mañana retomas el control.`,
    };
  }
  if (totalDebt(state.debts) === 0) {
    return {
      title: `¡Eres libre de deudas, ${name}! 🎉`,
      sub: "Ahora toda tu energía es para construir patrimonio. Lo lograste.",
    };
  }
  if (avoided > 100000) {
    return {
      title: `Vas con disciplina, ${name} 💪`,
      sub: `Ya llevas ${Math.round(avoided / 1000)}k ahorrados solo por no caer en compras impulsivas.`,
    };
  }
  if (progress >= 0.5) {
    return {
      title: `¡Más de la mitad, ${name}! 🚀`,
      sub: "Ya pagaste más de la mitad de tu deuda total. El envión es tuyo.",
    };
  }
  if (progress > 0) {
    return {
      title: `Buen comienzo, ${name} 🌱`,
      sub: "Cada abono cuenta. Vas saliendo del hueco, paso a paso.",
    };
  }
  return {
    title: `Empecemos, ${name} ✨`,
    sub: "Registra tu primera quincena y mira cómo tu plan toma forma.",
  };
}

// ----- Snapshot del patrimonio (tendencia mensual) -----

export function withUpdatedSnapshot(state: AppState): AppState {
  const key = monthKey();
  const nw = netWorth(state);
  const others = state.snapshots.filter((s) => s.month !== key);
  return {
    ...state,
    snapshots: [...others, { month: key, netWorth: nw }].sort((a, b) =>
      a.month.localeCompare(b.month)
    ),
  };
}
