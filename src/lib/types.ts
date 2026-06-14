// Modelo de datos de "Mi Plata". Todo es editable desde la app.

export type ID = string;

export type BudgetKind = "ahorro" | "fijo" | "gusto" | "inversion" | "deuda";
export type PocketKind = "savings" | "usd" | "liquidity";
export type ImpulseDecision = "pending" | "bought" | "avoided";
export type MovementKind = "abono" | "aporte" | "retiro";

export interface Settings {
  appName: string;
  ownerName: string; // para los mensajes ("¡Vas bien!")
  trm: number; // COP por 1 USD (editable)
  warnThreshold: number; // 0..1 -> a partir de qué % del tope avisar (ej 0.8)
  aiEndpoint?: string; // URL del proxy de IA (Cloudflare Worker / Supabase). Opcional.
}

export interface Income {
  id: ID;
  label: string;
  amount: number;
  cadence: "quincenal" | "mensual";
}

export interface BudgetCategory {
  id: ID;
  name: string;
  target: number; // monto/tope objetivo mensual
  kind: BudgetKind;
  icon: string;
  isSpendingCap?: boolean; // el tope de "gasto personal" con alertas
}

export interface Debt {
  id: ID;
  name: string;
  balance: number; // saldo actual
  originalBalance: number; // para calcular % pagado
  interestEA: number; // % efectivo anual (editable)
  order: number; // orden de ataque (avalancha)
  icon: string;
  archived?: boolean; // se archiva sola cuando se liquida
}

export interface Pocket {
  id: ID;
  name: string;
  kind: PocketKind;
  balance: number; // COP (para savings/liquidity)
  goal?: number; // meta en COP
  apyEA?: number; // rendimiento informativo (E.A.)
  monthlyTarget?: number; // aporte mensual sugerido (para proyección)
  icon: string;
  // Solo para kind === "usd":
  usdBalance?: number; // USD acumulados
  copInvested?: number; // COP realmente invertidos (para ver ganancia)
}

export interface Allocation {
  toDebts: { debtId: ID; amount: number }[];
  toPockets: { pocketId: ID; amount: number }[];
  toPersonal: number; // separado para gasto/gusto
}

export interface Paycheck {
  id: ID;
  date: string; // ISO
  amount: number;
  note?: string;
  alloc: Allocation;
}

export interface Expense {
  id: ID;
  date: string; // ISO
  amount: number;
  note: string;
  source: "manual" | "atajo" | "voz" | "recurrente";
  pending?: boolean; // gastos que entran por Atajo/Apple Pay y faltan confirmar
  tags?: string[];
  excludeFromCap?: boolean; // los gastos fijos no cuentan contra el tope de gusto
}

export interface Recurring {
  id: ID;
  name: string;
  amount: number;
  dayOfMonth: number; // día del mes en que se cobra (1-28)
  icon: string;
  countsToCap: boolean; // ¿cuenta contra el tope de gusto?
  tags?: string[];
  lastPostedMonth?: string; // "2026-06" del último registro automático
  active: boolean;
}

export interface Impulse {
  id: ID;
  createdAt: string; // ISO
  description: string;
  price: number;
  decision: ImpulseDecision;
  decidedAt?: string;
}

export interface Movement {
  id: ID;
  date: string; // ISO
  kind: MovementKind;
  targetId: ID; // debtId o pocketId
  targetName: string;
  amount: number;
  note?: string;
}

export interface NetWorthSnapshot {
  month: string; // "2026-06"
  netWorth: number;
}

export interface AppState {
  version: number;
  settings: Settings;
  incomes: Income[];
  budget: BudgetCategory[];
  debts: Debt[];
  pockets: Pocket[];
  paychecks: Paycheck[];
  expenses: Expense[];
  impulses: Impulse[];
  movements: Movement[];
  snapshots: NetWorthSnapshot[];
  recurring: Recurring[];
}
