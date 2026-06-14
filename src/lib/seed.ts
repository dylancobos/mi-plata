import { AppState } from "./types";

// Plan inicial de ejemplo (datos ficticios de demostración).
// TODO esto es editable desde la app (Ajustes) o puedes empezar de cero.
export const SCHEMA_VERSION = 1;

export function createSeedState(): AppState {
  return {
    version: SCHEMA_VERSION,
    settings: {
      appName: "Mi Plata",
      ownerName: "Usuario demo",
      trm: 4000, // COP por 1 USD (editable)
      warnThreshold: 0.8, // avisa al llegar al 80% del tope
    },
    incomes: [
      { id: "inc-salario", label: "Salario (quincenal)", amount: 1000000, cadence: "quincenal" },
      { id: "inc-extra", label: "Ingreso extra", amount: 500000, cadence: "mensual" },
    ],
    budget: [
      { id: "bud-ahorro", name: "Ahorro mensual", target: 200000, kind: "ahorro", icon: "🏛️" },
      { id: "bud-servicios", name: "Servicios / plan", target: 80000, kind: "fijo", icon: "📱" },
      {
        id: "bud-gusto",
        name: "Gasto personal / gusto",
        target: 400000,
        kind: "gusto",
        icon: "🛍️",
        isSpendingCap: true,
      },
      { id: "bud-emergencia", name: "Fondo de emergencia", target: 300000, kind: "ahorro", icon: "🛟" },
      { id: "bud-dolares", name: "Dólares", target: 200000, kind: "inversion", icon: "💵" },
      { id: "bud-abono", name: "Abono a deudas", target: 600000, kind: "deuda", icon: "🎯" },
    ],
    debts: [
      {
        id: "debt-tarjeta",
        name: "Tarjeta de crédito",
        balance: 1200000,
        originalBalance: 1200000,
        interestEA: 28, // placeholder editable
        order: 1,
        icon: "💳",
      },
      {
        id: "debt-credito",
        name: "Crédito de consumo",
        balance: 800000,
        originalBalance: 800000,
        interestEA: 20, // placeholder editable
        order: 2,
        icon: "🏦",
      },
    ],
    pockets: [
      {
        id: "pkt-ahorro",
        name: "Ahorro",
        kind: "savings",
        balance: 0,
        monthlyTarget: 200000,
        icon: "🏛️",
      },
      {
        id: "pkt-emergencia",
        name: "Fondo de emergencia",
        kind: "savings",
        balance: 0,
        goal: 2000000,
        monthlyTarget: 300000,
        icon: "🛟",
      },
      {
        id: "pkt-dolares",
        name: "Dólares",
        kind: "usd",
        balance: 0,
        apyEA: 9,
        monthlyTarget: 200000,
        usdBalance: 0,
        copInvested: 0,
        icon: "💵",
      },
      {
        id: "pkt-colchon",
        name: "Colchón de liquidez",
        kind: "liquidity",
        balance: 0,
        goal: 2000000,
        icon: "🛡️",
      },
    ],
    paychecks: [],
    expenses: [],
    impulses: [],
    movements: [],
    snapshots: [],
    recurring: [
      {
        id: "rec-servicios",
        name: "Servicios / plan",
        amount: 80000,
        dayOfMonth: 1,
        icon: "📱",
        countsToCap: false,
        active: true,
      },
    ],
  };
}
