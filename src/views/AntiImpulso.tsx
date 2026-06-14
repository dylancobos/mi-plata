import { useState } from "react";
import { ArrowLeft, Shield, Clock, Trash2 } from "lucide-react";
import { useStore, uid } from "../lib/store";
import { useNavigate } from "../lib/nav";
import { avoidedTotal, avoidedCount } from "../lib/finance";
import { formatCOP, nowISO, hoursUntilReady, formatDate } from "../lib/format";
import {
  Card,
  Button,
  Field,
  MoneyInput,
  TextInput,
  Pill,
  EmptyState,
  Confetti,
} from "../components/ui";

export function AntiImpulso() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const pending = state.impulses.filter((i) => i.decision === "pending");
  const decided = state.impulses.filter((i) => i.decision !== "pending");
  const totalAvoided = avoidedTotal(state);
  const countAvoided = avoidedCount(state);

  const add = () => {
    if (!desc.trim() || price <= 0) return;
    dispatch({
      t: "ADD_IMPULSE",
      impulse: {
        id: uid("imp"),
        createdAt: nowISO(),
        description: desc.trim(),
        price,
        decision: "pending",
      },
    });
    setDesc("");
    setPrice(0);
  };

  const decide = (id: string, decision: "bought" | "avoided") => {
    dispatch({ t: "DECIDE_IMPULSE", id, decision });
    if (decision === "avoided") {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3500);
    }
  };

  return (
    <div className="space-y-4 animate-pop">
      <Confetti show={celebrate} />

      <div className="flex items-center gap-2">
        <button onClick={() => navigate("inicio")} className="p-1 -ml-1 text-white/50">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">¿Voy a comprar algo? 🛍️</h1>
          <p className="text-sm text-white/50">Regla de las 24 horas: decide en frío</p>
        </div>
      </div>

      {/* Contador de evitados */}
      <Card className="bg-gradient-to-br from-money-600/25 to-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-money-500/20 grid place-items-center">
            <Shield className="text-money-400" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/60">Gastos innecesarios evitados</p>
            <p className="text-2xl font-bold text-money-400">{formatCOP(totalAvoided)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{countAvoided}</p>
            <p className="text-xs text-white/50">veces</p>
          </div>
        </div>
      </Card>

      {/* Nuevo antojo */}
      <Card>
        <p className="font-semibold text-sm mb-3">Apunta el antojo antes de caer 👇</p>
        <Field label="¿Qué quieres comprar?">
          <TextInput value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: unos tenis, audífonos..." />
        </Field>
        <Field label="¿Cuánto cuesta?">
          <MoneyInput value={price} onChange={setPrice} />
        </Field>
        <Button full disabled={!desc.trim() || price <= 0} onClick={add}>
          <Clock size={16} className="inline -mt-0.5 mr-1" /> Guardar y esperar 24h
        </Button>
      </Card>

      {/* Pendientes */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-bold mb-2">Pensándolo en frío</h2>
          <div className="space-y-3">
            {pending.map((i) => {
              const hours = hoursUntilReady(i.createdAt);
              const ready = hours <= 0;
              return (
                <Card key={i.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{i.description}</p>
                      <p className="text-money-300 font-bold">{formatCOP(i.price)}</p>
                    </div>
                    {ready ? (
                      <Pill tone="calm">¡Listo para decidir!</Pill>
                    ) : (
                      <Pill tone="warn">faltan {Math.ceil(hours)}h</Pill>
                    )}
                  </div>
                  {!ready && (
                    <p className="text-xs text-white/40 mt-2">
                      Espera a mañana. Si todavía lo quieres y te alcanza, ahí decides 😌
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button variant="primary" onClick={() => decide(i.id, "avoided")}>
                      🛡️ Me aguanté
                    </Button>
                    <Button variant="soft" onClick={() => decide(i.id, "bought")}>
                      Igual lo compré
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial */}
      {decided.length > 0 && (
        <div>
          <h2 className="font-bold mb-2">Tus decisiones</h2>
          <Card className="divide-y divide-white/5 p-0">
            {decided.slice(0, 15).map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{i.decision === "avoided" ? "🛡️" : "🛒"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{i.description}</p>
                  <p className="text-xs text-white/40">
                    {i.decision === "avoided" ? "Te aguantaste" : "Lo compraste"} ·{" "}
                    {i.decidedAt ? formatDate(i.decidedAt) : ""}
                  </p>
                </div>
                <span className={`font-semibold ${i.decision === "avoided" ? "text-money-400" : "text-white/50"}`}>
                  {i.decision === "avoided" ? "+" : "−"}{formatCOP(i.price)}
                </span>
                <button
                  onClick={() => dispatch({ t: "DELETE_IMPULSE", id: i.id })}
                  className="text-white/20 hover:text-rose-400 p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {pending.length === 0 && decided.length === 0 && (
        <EmptyState emoji="🧘" title="Sin antojos pendientes" sub="Cuando te den ganas de comprar algo, apúntalo aquí primero." />
      )}
    </div>
  );
}
