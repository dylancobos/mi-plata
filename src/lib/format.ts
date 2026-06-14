// Formato colombiano: $#.###.### (separador de miles con punto)

const copFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCOP(n: number): string {
  const v = Math.round(n || 0);
  const sign = v < 0 ? "-" : "";
  return `${sign}$${copFmt.format(Math.abs(v))}`;
}

export function formatCOPshort(n: number): string {
  const v = Math.abs(n || 0);
  const sign = (n || 0) < 0 ? "-" : "";
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${sign}$${Math.round(v / 1_000)}k`;
  return `${sign}$${Math.round(v)}`;
}

export function formatUSD(n: number): string {
  return `US$${usdFmt.format(n || 0)}`;
}

export function formatPct(n: number, decimals = 0): string {
  return `${(n || 0).toFixed(decimals)}%`;
}

// Convierte lo que el usuario escribe ("1.250.000" o "1250000") a número
export function parseMoney(input: string): number {
  if (!input) return 0;
  const digits = input.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// Muestra el número con puntos mientras se escribe en un input
export function maskMoney(input: string): string {
  const n = parseMoney(input);
  return n ? copFmt.format(n) : "";
}

// ----- Fechas -----

export function nowISO(): string {
  return new Date().toISOString();
}

export function monthKey(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isSameMonth(iso: string, ref: Date = new Date()): boolean {
  return monthKey(iso) === monthKey(ref);
}

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MESES[d.getMonth()]} · ${hh}:${mm}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MESES_LARGO[m - 1]} ${y}`;
}

export function monthLabelShort(key: string): string {
  const [, m] = key.split("-").map(Number);
  return MESES[m - 1];
}

// Horas que faltan para cumplir 24h desde createdAt (regla anti-impulso)
export function hoursUntilReady(createdAtISO: string): number {
  const created = new Date(createdAtISO).getTime();
  const ready = created + 24 * 60 * 60 * 1000;
  return Math.max(0, (ready - Date.now()) / (60 * 60 * 1000));
}

export function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
