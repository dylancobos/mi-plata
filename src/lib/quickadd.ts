// Registro rápido: convierte texto como "domicilio 25000" o "25k almuerzo"
// en { amount, note }. También entiende "mil", "k" y montos con puntos.

export interface QuickParsed {
  amount: number;
  note: string;
}

export function parseQuickExpense(input: string): QuickParsed {
  const text = (input || "").trim();
  if (!text) return { amount: 0, note: "" };

  // Busca patrones de monto: 25000 | 25.000 | 25k | 25 mil | 1.5k
  const re = /(\d+(?:[.,]\d+)?)\s*(k|mil|m)?/gi;
  let amount = 0;
  let matchText = "";
  let best = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    let n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
    // Si tenía puntos de miles (ej "25.000"), parseFloat con replace ya lo dejó en 25000
    const unit = (m[2] || "").toLowerCase();
    if (unit === "k" || unit === "m") n = n * 1000;
    else if (unit === "mil") n = n * 1000;
    // Nos quedamos con el número más grande encontrado (el monto)
    if (n > best) {
      best = n;
      amount = Math.round(n);
      matchText = m[0];
    }
  }

  // La nota es el texto sin el monto
  let note = text;
  if (matchText) {
    note = text.replace(matchText, "").trim();
  }
  note = note.replace(/\s{2,}/g, " ").replace(/^[\s,.-]+|[\s,.-]+$/g, "");
  // Capitaliza la primera letra
  if (note) note = note.charAt(0).toUpperCase() + note.slice(1);

  return { amount, note };
}

// Lee y consume parámetros de la URL puestos por el Atajo de iOS:
// ?gasto=25000&desc=Éxito   (o #gasto=...)
export function consumeURLExpense(): { amount: number; note: string } | null {
  if (typeof window === "undefined") return null;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const raw = search.get("gasto") || hash.get("gasto");
  if (!raw) return null;

  const digits = String(raw).replace(/[^\d]/g, "");
  const amount = digits ? parseInt(digits, 10) : 0;
  const note = (search.get("desc") || hash.get("desc") || "Apple Pay").slice(0, 60);

  // Limpia la URL para no duplicar al recargar
  try {
    window.history.replaceState({}, "", window.location.pathname);
  } catch {
    /* noop */
  }

  if (amount <= 0) return null;
  return { amount, note };
}
