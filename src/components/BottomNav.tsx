import { Home, Target, Wallet, PiggyBank, LayoutGrid } from "lucide-react";
import { Screen } from "../lib/nav";

const ITEMS: { key: Screen; label: string; Icon: typeof Home }[] = [
  { key: "inicio", label: "Inicio", Icon: Home },
  { key: "deudas", label: "Deudas", Icon: Target },
  { key: "gasto", label: "Gasto", Icon: Wallet },
  { key: "bolsillos", label: "Bolsillos", Icon: PiggyBank },
  { key: "mas", label: "Más", Icon: LayoutGrid },
];

export function BottomNav({
  current,
  onNavigate,
}: {
  current: Screen;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-ink-900/90 backdrop-blur-xl border-t border-white/10 safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {ITEMS.map(({ key, label, Icon }) => {
          const active = current === key || (key === "mas" && MAS_GROUP.includes(current));
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="flex flex-col items-center gap-1 py-2.5 transition"
            >
              <Icon
                size={22}
                className={active ? "text-money-400" : "text-white/40"}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? "text-money-400" : "text-white/40"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Pantallas que se consideran parte de "Más"
const MAS_GROUP: Screen[] = ["mas", "registro", "proyeccion", "antiimpulso", "asistente", "nube", "ajustes"];
