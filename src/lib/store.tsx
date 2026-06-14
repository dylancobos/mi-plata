import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  AppState,
  Allocation,
  BudgetCategory,
  Debt,
  Expense,
  Impulse,
  ImpulseDecision,
  Income,
  Movement,
  Paycheck,
  Pocket,
  Recurring,
  Settings,
} from "./types";
import { createSeedState, SCHEMA_VERSION } from "./seed";
import { withUpdatedSnapshot } from "./finance";
import { nowISO, monthKey } from "./format";

// Crea un gasto a partir de una regla recurrente
function expenseFromRecurring(r: Recurring): Expense {
  return {
    id: uid("exp"),
    date: nowISO(),
    amount: r.amount,
    note: r.name,
    source: "recurrente",
    excludeFromCap: !r.countsToCap,
    tags: r.tags,
  };
}

const STORAGE_KEY = "mi-plata-state";

export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}

// ----- Acciones -----

type Action =
  | { t: "UPDATE_SETTINGS"; patch: Partial<Settings> }
  | { t: "ADD_PAYCHECK"; paycheck: Paycheck }
  | { t: "DELETE_PAYCHECK"; id: string }
  | { t: "PAY_DEBT"; debtId: string; amount: number; note?: string }
  | { t: "POCKET_MOVE"; pocketId: string; amount: number; dir: "aporte" | "retiro"; note?: string }
  | { t: "ADD_EXPENSE"; expense: Expense }
  | { t: "UPDATE_EXPENSE"; id: string; patch: Partial<Expense> }
  | { t: "DELETE_EXPENSE"; id: string }
  | { t: "ADD_IMPULSE"; impulse: Impulse }
  | { t: "DECIDE_IMPULSE"; id: string; decision: ImpulseDecision }
  | { t: "DELETE_IMPULSE"; id: string }
  | { t: "UPSERT_BUDGET"; cat: BudgetCategory }
  | { t: "DELETE_BUDGET"; id: string }
  | { t: "UPSERT_DEBT"; debt: Debt }
  | { t: "DELETE_DEBT"; id: string }
  | { t: "UPSERT_POCKET"; pocket: Pocket }
  | { t: "DELETE_POCKET"; id: string }
  | { t: "UPSERT_INCOME"; income: Income }
  | { t: "DELETE_INCOME"; id: string }
  | { t: "UPSERT_RECURRING"; rec: Recurring }
  | { t: "DELETE_RECURRING"; id: string }
  | { t: "POST_RECURRING"; id: string }
  | { t: "APPLY_DUE_RECURRING" }
  | { t: "IMPORT_STATE"; state: AppState }
  | { t: "RESET" };

// Aplica (sign=+1) o revierte (sign=-1) un reparto a deudas y bolsillos
function applyAlloc(state: AppState, alloc: Allocation, sign: number): AppState {
  const trm = state.settings.trm;
  const debts = state.debts.map((d) => {
    const hit = alloc.toDebts.find((x) => x.debtId === d.id);
    if (!hit) return d;
    const next = Math.max(0, d.balance - sign * hit.amount);
    return { ...d, balance: next };
  });
  const pockets = state.pockets.map((p) => {
    const hit = alloc.toPockets.find((x) => x.pocketId === p.id);
    if (!hit) return p;
    return movePocket(p, sign * hit.amount, trm);
  });
  return { ...state, debts, pockets };
}

// Mueve un bolsillo por `deltaCOP` (puede ser negativo). Maneja USD con la TRM.
function movePocket(p: Pocket, deltaCOP: number, trm: number): Pocket {
  if (p.kind === "usd") {
    const usdNow = p.usdBalance || 0;
    const copInv = p.copInvested || 0;
    if (deltaCOP >= 0) {
      return {
        ...p,
        usdBalance: usdNow + deltaCOP / trm,
        copInvested: copInv + deltaCOP,
      };
    }
    // retiro: quita proporcional
    const usdRemove = Math.min(usdNow, -deltaCOP / trm);
    const frac = usdNow > 0 ? usdRemove / usdNow : 0;
    return {
      ...p,
      usdBalance: usdNow - usdRemove,
      copInvested: Math.max(0, copInv - copInv * frac),
    };
  }
  return { ...p, balance: Math.max(0, p.balance + deltaCOP) };
}

function reducer(state: AppState, action: Action): AppState {
  let next: AppState = state;
  switch (action.t) {
    case "UPDATE_SETTINGS":
      next = { ...state, settings: { ...state.settings, ...action.patch } };
      break;

    case "ADD_PAYCHECK": {
      const applied = applyAlloc(state, action.paycheck.alloc, +1);
      next = { ...applied, paychecks: [action.paycheck, ...applied.paychecks] };
      break;
    }
    case "DELETE_PAYCHECK": {
      const pc = state.paychecks.find((p) => p.id === action.id);
      if (!pc) return state;
      const reverted = applyAlloc(state, pc.alloc, -1);
      next = { ...reverted, paychecks: reverted.paychecks.filter((p) => p.id !== action.id) };
      break;
    }

    case "PAY_DEBT": {
      const debt = state.debts.find((d) => d.id === action.debtId);
      if (!debt) return state;
      const applied = Math.min(action.amount, debt.balance);
      const debts = state.debts.map((d) => {
        if (d.id !== action.debtId) return d;
        const newBalance = Math.max(0, d.balance - applied);
        return { ...d, balance: newBalance, archived: newBalance <= 0 ? true : d.archived };
      });
      const mov: Movement = {
        id: uid("mov"),
        date: nowISO(),
        kind: "abono",
        targetId: debt.id,
        targetName: debt.name,
        amount: applied,
        note: action.note,
      };
      next = { ...state, debts, movements: [mov, ...state.movements] };
      break;
    }

    case "POCKET_MOVE": {
      const pocket = state.pockets.find((p) => p.id === action.pocketId);
      if (!pocket) return state;
      const delta = action.dir === "aporte" ? action.amount : -action.amount;
      const pockets = state.pockets.map((p) =>
        p.id === action.pocketId ? movePocket(p, delta, state.settings.trm) : p
      );
      const mov: Movement = {
        id: uid("mov"),
        date: nowISO(),
        kind: action.dir,
        targetId: pocket.id,
        targetName: pocket.name,
        amount: action.amount,
        note: action.note,
      };
      next = { ...state, pockets, movements: [mov, ...state.movements] };
      break;
    }

    case "ADD_EXPENSE":
      next = { ...state, expenses: [action.expense, ...state.expenses] };
      break;
    case "UPDATE_EXPENSE":
      next = {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e
        ),
      };
      break;
    case "DELETE_EXPENSE":
      next = { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };
      break;

    case "ADD_IMPULSE":
      next = { ...state, impulses: [action.impulse, ...state.impulses] };
      break;
    case "DECIDE_IMPULSE":
      next = {
        ...state,
        impulses: state.impulses.map((i) =>
          i.id === action.id ? { ...i, decision: action.decision, decidedAt: nowISO() } : i
        ),
      };
      break;
    case "DELETE_IMPULSE":
      next = { ...state, impulses: state.impulses.filter((i) => i.id !== action.id) };
      break;

    case "UPSERT_BUDGET": {
      const exists = state.budget.some((b) => b.id === action.cat.id);
      next = {
        ...state,
        budget: exists
          ? state.budget.map((b) => (b.id === action.cat.id ? action.cat : b))
          : [...state.budget, action.cat],
      };
      break;
    }
    case "DELETE_BUDGET":
      next = { ...state, budget: state.budget.filter((b) => b.id !== action.id) };
      break;

    case "UPSERT_DEBT": {
      const exists = state.debts.some((d) => d.id === action.debt.id);
      // Archiva si quedó en cero; reactiva si vuelve a tener saldo
      const debt: Debt = {
        ...action.debt,
        archived: action.debt.balance <= 0 && action.debt.originalBalance > 0,
      };
      next = {
        ...state,
        debts: exists
          ? state.debts.map((d) => (d.id === debt.id ? debt : d))
          : [...state.debts, debt],
      };
      break;
    }
    case "DELETE_DEBT":
      next = { ...state, debts: state.debts.filter((d) => d.id !== action.id) };
      break;

    case "UPSERT_POCKET": {
      const exists = state.pockets.some((p) => p.id === action.pocket.id);
      next = {
        ...state,
        pockets: exists
          ? state.pockets.map((p) => (p.id === action.pocket.id ? action.pocket : p))
          : [...state.pockets, action.pocket],
      };
      break;
    }
    case "DELETE_POCKET":
      next = { ...state, pockets: state.pockets.filter((p) => p.id !== action.id) };
      break;

    case "UPSERT_INCOME": {
      const exists = state.incomes.some((i) => i.id === action.income.id);
      next = {
        ...state,
        incomes: exists
          ? state.incomes.map((i) => (i.id === action.income.id ? action.income : i))
          : [...state.incomes, action.income],
      };
      break;
    }
    case "DELETE_INCOME":
      next = { ...state, incomes: state.incomes.filter((i) => i.id !== action.id) };
      break;

    case "UPSERT_RECURRING": {
      const exists = state.recurring.some((r) => r.id === action.rec.id);
      next = {
        ...state,
        recurring: exists
          ? state.recurring.map((r) => (r.id === action.rec.id ? action.rec : r))
          : [...state.recurring, action.rec],
      };
      break;
    }
    case "DELETE_RECURRING":
      next = { ...state, recurring: state.recurring.filter((r) => r.id !== action.id) };
      break;
    case "POST_RECURRING": {
      const r = state.recurring.find((x) => x.id === action.id);
      if (!r) return state;
      next = {
        ...state,
        recurring: state.recurring.map((x) =>
          x.id === r.id ? { ...x, lastPostedMonth: monthKey() } : x
        ),
        expenses: [expenseFromRecurring(r), ...state.expenses],
      };
      break;
    }
    case "APPLY_DUE_RECURRING": {
      const month = monthKey();
      const day = new Date().getDate();
      const newExpenses: Expense[] = [];
      const recurring = state.recurring.map((r) => {
        if (r.active && r.lastPostedMonth !== month && day >= r.dayOfMonth) {
          newExpenses.push(expenseFromRecurring(r));
          return { ...r, lastPostedMonth: month };
        }
        return r;
      });
      if (newExpenses.length === 0) return state;
      next = { ...state, recurring, expenses: [...newExpenses, ...state.expenses] };
      break;
    }

    case "IMPORT_STATE":
      next = action.state;
      break;
    case "RESET":
      next = createSeedState();
      break;
  }

  return withUpdatedSnapshot(next);
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || typeof parsed !== "object" || !parsed.settings) {
      return createSeedState();
    }
    // Migración mínima: completa campos nuevos si faltan
    return { ...createSeedState(), ...parsed, version: SCHEMA_VERSION };
  } catch {
    return createSeedState();
  }
}

// ----- Contexto -----

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  exportJSON: () => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const firstRender = useRef(true);

  useEffect(() => {
    // Evita reescribir en el primer render (ya está cargado)
    if (firstRender.current) {
      firstRender.current = false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado: la app sigue funcionando en memoria */
    }
  }, [state]);

  const exportJSON = () => JSON.stringify(state, null, 2);

  return (
    <StoreContext.Provider value={{ state, dispatch, exportJSON }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
