import { ChevronRight, Wallet2, Sparkles, Bell, Smartphone, PiggyBank, Calendar } from "lucide-react";
import { useNavigate, Screen } from "../lib/nav";
import { useStore } from "../lib/store";
import { Card, IconBadge, Button, Alert } from "../components/ui";

const MENU: { key: Screen; emoji: string; title: string; sub: string }[] = [
  { key: "registro", emoji: "💰", title: "Registrar quincena", sub: "Me llegó plata y la reparto" },
  { key: "proyeccion", emoji: "🔮", title: "Proyección", sub: "Cuándo quedo libre de deudas" },
  { key: "antiimpulso", emoji: "🛡️", title: "Anti-impulso", sub: "Regla de 24h y gastos evitados" },
  { key: "asistente", emoji: "🤖", title: "Asistente IA", sub: "Chatea con tus finanzas" },
  { key: "nube", emoji: "👤", title: "Mi cuenta", sub: "Sesión, sincronización y cerrar sesión" },
  { key: "ajustes", emoji: "⚙️", title: "Ajustes", sub: "Edita ingresos, metas y deudas" },
];

export function Mas() {
  const navigate = useNavigate();
  const { state } = useStore();
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://tu-app";

  const downloadReminders = () => {
    // Genera un .ics con recordatorios quincenales (días 15 y 30) por 6 meses
    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const events: string[] = [];
    for (let m = 0; m < 6; m++) {
      for (const day of [15, 30]) {
        const d = new Date(now.getFullYear(), now.getMonth() + m, day, 18, 0, 0);
        const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}0000`;
        events.push(
          [
            "BEGIN:VEVENT",
            `UID:miplata-${stamp}@miplata`,
            `DTSTART:${stamp}`,
            `DTEND:${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}3000`,
            "SUMMARY:💰 Registrar mi quincena en Mi Plata",
            "DESCRIPTION:Anota tu ingreso, repártelo y revisa tu plan.",
            "BEGIN:VALARM\nTRIGGER:-PT0M\nACTION:DISPLAY\nDESCRIPTION:Registrar quincena\nEND:VALARM",
            "END:VEVENT",
          ].join("\n")
        );
      }
    }
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Mi Plata//ES\n${events.join("\n")}\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recordatorios-mi-plata.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-pop">
      <div>
        <h1 className="text-2xl font-bold">Más opciones</h1>
        <p className="text-sm text-white/50">Todo lo de {state.settings.appName}</p>
      </div>

      {/* Menú */}
      <Card className="p-0 divide-y divide-white/5">
        {MENU.map((m) => (
          <button
            key={m.key}
            onClick={() => navigate(m.key)}
            className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-white/5 transition"
          >
            <IconBadge emoji={m.emoji} tone="neutral" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{m.title}</p>
              <p className="text-xs text-white/40">{m.sub}</p>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>
        ))}
      </Card>

      {/* Apple Pay / Atajo */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="text-calm-400" size={20} />
          <p className="font-bold">Registrar compras de Apple Pay</p>
        </div>
        <p className="text-sm text-white/60 mb-3">
          Con <b>iOS 17+</b> tus pagos Apple Pay <b>presenciales</b> pueden registrarse casi solos, con una
          Automatización de tipo <b>“Transacción”</b>:
        </p>
        <ol className="text-sm text-white/70 space-y-1.5 list-decimal list-inside mb-3">
          <li>Atajos → pestaña <b>Automatización</b> → <b>+</b> → <b>Transacción</b>.</li>
          <li>Elige tu tarjeta y activa <b>“Ejecutar inmediatamente”</b>.</li>
          <li>Acción <b>“Abrir URL”</b>:<br /><code className="text-calm-400 text-xs break-all">{`${appUrl}/?gasto=[Monto]&desc=[Comercio]`}</code></li>
          <li>Al pagar, el gasto entra solo a <b>“Por confirmar”</b>.</li>
        </ol>
        <Alert level="info">
          Apple a veces no manda el monto (limitación de ellos, no de la app). Para esos casos te queda el
          <b> registro rápido</b> y la <b>voz 🎙️</b> en la pestaña <b>Gasto</b>. Cuando publiquemos, te paso el enlace exacto.
        </Alert>
      </Card>

      {/* Recordatorios */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Bell className="text-warn" size={20} />
          <p className="font-bold">Recordatorios quincenales</p>
        </div>
        <p className="text-sm text-white/60 mb-3">
          Descarga recordatorios para los días 15 y 30, así no se te olvida registrar tu plata y revisar el plan.
        </p>
        <Button variant="soft" full onClick={downloadReminders}>
          <Calendar size={16} className="inline -mt-0.5 mr-1" /> Añadir a mi calendario
        </Button>
      </Card>

      {/* Atajos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("registro")}
          className="rounded-xl2 p-4 bg-calm-500/10 border border-calm-500/20 text-left active:scale-95"
        >
          <Wallet2 className="text-calm-400 mb-1" size={20} />
          <p className="text-sm font-semibold">Registrar quincena</p>
        </button>
        <button
          onClick={() => navigate("bolsillos")}
          className="rounded-xl2 p-4 bg-money-500/10 border border-money-500/20 text-left active:scale-95"
        >
          <PiggyBank className="text-money-400 mb-1" size={20} />
          <p className="text-sm font-semibold">Mis bolsillos</p>
        </button>
      </div>

      <p className="text-center text-xs text-white/25 pt-1 flex items-center justify-center gap-1">
        <Sparkles size={12} /> Mi Plata v1 · hecho para ti
      </p>
    </div>
  );
}
