import { ArrowLeft, Cloud, RefreshCw, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "../lib/nav";
import { useCloud } from "../lib/cloudContext";
import { Card, Button, Alert, IconBadge, Pill } from "../components/ui";

export function Nube() {
  const navigate = useNavigate();
  const cloud = useCloud();

  const pill = () => {
    switch (cloud.syncStatus) {
      case "synced":
        return <Pill tone="money">✓ Sincronizado</Pill>;
      case "syncing":
        return <Pill tone="calm">Sincronizando…</Pill>;
      case "error":
        return <Pill tone="danger">Sin conexión</Pill>;
      default:
        return <Pill tone="neutral">Listo</Pill>;
    }
  };

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("mas")} className="p-1 -ml-1 text-white/50">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Mi cuenta ☁️</h1>
          <p className="text-sm text-white/50">Sesión y sincronización</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <IconBadge emoji="👤" tone="money" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{cloud.email || "Tu cuenta"}</p>
            <p className="text-xs text-white/50">Conectado</p>
          </div>
          {pill()}
        </div>
        {cloud.error && cloud.syncStatus === "error" && (
          <p className="text-xs text-white/40 mt-3">
            No hay internet ahora mismo. Tus cambios se guardan en el teléfono y suben solos cuando vuelva la conexión.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="soft" onClick={() => cloud.syncNow()}>
            <RefreshCw size={15} className="inline -mt-0.5 mr-1" /> Sincronizar
          </Button>
          <Button variant="ghost" onClick={() => cloud.signOut()}>
            <LogOut size={15} className="inline -mt-0.5 mr-1" /> Cerrar sesión
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Cloud size={18} className="text-calm-400" />
          <p className="font-semibold text-sm">Cómo funciona</p>
        </div>
        <ul className="text-sm text-white/60 space-y-1.5 list-disc list-inside">
          <li>Todo se guarda automático en tu cuenta.</li>
          <li>Entra con tu correo en otro dispositivo y verás lo mismo.</li>
          <li>Funciona sin internet; sube los cambios cuando vuelva.</li>
        </ul>
      </Card>

      <div className="flex items-center justify-center gap-1.5 text-xs text-white/30 pt-1">
        <ShieldCheck size={13} /> Tus datos son privados y solo tuyos.
      </div>
    </div>
  );
}
