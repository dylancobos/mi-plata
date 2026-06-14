import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, CalendarCheck, Flag } from "lucide-react";
import { useStore } from "../lib/store";
import { useNavigate } from "../lib/nav";
import { buildProjection, monthlyDebtBudget, totalDebt } from "../lib/finance";
import { formatCOP, formatCOPshort } from "../lib/format";
import { Card, Button, Alert, Pill } from "../components/ui";

export function Proyeccion() {
  const { state } = useStore();
  const navigate = useNavigate();

  const monthlyPay = monthlyDebtBudget(state);
  const debt = totalDebt(state.debts);
  const proj = useMemo(() => buildProjection(state), [state]);

  const data = proj.points.map((p) => ({
    name: p.label,
    Deuda: p.totalDebt,
    Ahorros: p.savings,
    Dólares: p.dollars,
  }));

  // Muestra ~10 etiquetas máximo en el eje X
  const tickInterval = Math.max(0, Math.floor(data.length / 6));

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("mas")} className="p-1 -ml-1 text-white/50">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Tu futuro 🔮</h1>
          <p className="text-sm text-white/50">Proyección con tu plan actual</p>
        </div>
      </div>

      {monthlyPay <= 0 || debt <= 0 ? (
        <Card>
          <Alert level={debt <= 0 ? "ok" : "warn"}>
            {debt <= 0
              ? "¡No tienes deudas que proyectar! Pura ganancia desde aquí. 🎉"
              : "Define un abono mensual a deudas en tu plan (Ajustes) para ver la proyección."}
          </Alert>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-money-600/20 to-ink-800">
              <CalendarCheck className="text-money-400 mb-1" size={20} />
              <p className="text-2xl font-bold">
                {proj.monthsToDebtFree ?? "—"} <span className="text-base font-medium text-white/50">meses</span>
              </p>
              <p className="text-xs text-white/50">para quedar libre de deudas</p>
            </Card>
            <Card className="bg-gradient-to-br from-calm-600/20 to-ink-800">
              <Flag className="text-calm-400 mb-1" size={20} />
              <p className="text-2xl font-bold capitalize">{proj.debtFreeLabel ?? "—"}</p>
              <p className="text-xs text-white/50">mes en que terminas</p>
            </Card>
          </div>

          {proj.fundFreeMonthIndex && (
            <Alert level="info" title={`Deuda del fondo liquidada en ~${proj.fundFreeMonthIndex} meses`}>
              Abonando {formatCOP(monthlyPay)} al mes con método avalancha.
            </Alert>
          )}

          {/* Gráfica */}
          <Card>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="font-semibold text-sm">Deuda vs. ahorro en el tiempo</p>
              <div className="flex gap-2">
                <Pill tone="danger">Deuda</Pill>
                <Pill tone="money">Ahorros</Pill>
                <Pill tone="calm">Dólares</Pill>
              </div>
            </div>
            <div className="h-64 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={tickInterval}
                    tick={{ fill: "#ffffff55", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCOPshort(v)}
                    tick={{ fill: "#ffffff55", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1830",
                      border: "1px solid #ffffff20",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#ffffff99" }}
                    formatter={(v: number) => formatCOP(v)}
                  />
                  <Line type="monotone" dataKey="Deuda" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Ahorros" stroke="#34d399" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Dólares" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <p className="text-xs text-white/40 text-center px-4">
            Estimación con tu plan actual (abonos y aportes mensuales constantes). No incluye nuevos intereses ni
            imprevistos. Si subes tus abonos, ¡terminas antes!
          </p>
        </>
      )}
    </div>
  );
}
