// Emojify: asigna un emoji a una categoría/gasto según su nombre (diccionario local).

const MAP: { words: string[]; emoji: string }[] = [
  { words: ["mercado", "super", "supermercado", "fruver", "tienda", "d1", "ara"], emoji: "🛒" },
  { words: ["almuerzo", "comida", "cena", "desayuno", "restaurante", "domicilio", "rappi", "hambur"], emoji: "🍔" },
  { words: ["cafe", "café", "tinto", "starbucks", "juan valdez"], emoji: "☕" },
  { words: ["uber", "taxi", "didi", "bus", "transporte", "transmilenio", "pasaje"], emoji: "🚕" },
  { words: ["gasolina", "combustible", "carro", "moto"], emoji: "⛽" },
  { words: ["ropa", "zapatos", "tenis", "moda", "vestido"], emoji: "👕" },
  { words: ["salud", "farmacia", "droguer", "medic", "eps", "doctor"], emoji: "💊" },
  { words: ["gym", "gimnasio", "ejercicio", "smartfit"], emoji: "💪" },
  { words: ["cine", "salida", "fiesta", "rumba", "trago", "bar", "cerveza"], emoji: "🍻" },
  { words: ["netflix", "spotify", "disney", "hbo", "max", "streaming", "suscrip", "youtube"], emoji: "📺" },
  { words: ["datos", "celular", "plan", "movil", "claro", "tigo", "wom", "internet"], emoji: "📱" },
  { words: ["arriendo", "casa", "hogar", "renta"], emoji: "🏠" },
  { words: ["luz", "agua", "gas", "servicio", "factura", "energia"], emoji: "💡" },
  { words: ["curso", "educacion", "estudio", "universidad", "libro"], emoji: "📚" },
  { words: ["regalo", "cumple", "gift"], emoji: "🎁" },
  { words: ["viaje", "vuelo", "avion", "hotel", "vacaciones"], emoji: "✈️" },
  { words: ["mascota", "perro", "gato", "vet"], emoji: "🐶" },
  { words: ["belleza", "peluquer", "barber", "uñas", "spa"], emoji: "💅" },
  { words: ["tecnolog", "compu", "celu", "gadget", "apple", "iphone"], emoji: "💻" },
  { words: ["ahorro", "emergencia", "meta"], emoji: "🐷" },
  { words: ["dolar", "littio", "usdc", "inversion", "cripto"], emoji: "💵" },
  { words: ["deuda", "abono", "credito", "tarjeta", "prestamo"], emoji: "🎯" },
  { words: ["fna", "banco", "fondo"], emoji: "🏛️" },
];

export function suggestEmoji(name: string): string {
  const n = (name || "").toLowerCase();
  for (const { words, emoji } of MAP) {
    if (words.some((w) => n.includes(w))) return emoji;
  }
  return "💸";
}
