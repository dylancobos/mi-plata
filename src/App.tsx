import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StoreProvider, useStore, uid } from "./lib/store";
import { NavContext, Screen } from "./lib/nav";
import { CloudContext } from "./lib/cloudContext";
import { useCloudSync } from "./lib/useCloudSync";
import { consumeURLExpense } from "./lib/quickadd";
import { nowISO, formatCOP } from "./lib/format";
import { BottomNav } from "./components/BottomNav";
import { Dashboard } from "./views/Dashboard";
import { Deudas } from "./views/Deudas";
import { Gasto } from "./views/Gasto";
import { Bolsillos } from "./views/Bolsillos";
import { Mas } from "./views/Mas";
import { Registro } from "./views/Registro";
import { Proyeccion } from "./views/Proyeccion";
import { AntiImpulso } from "./views/AntiImpulso";
import { Asistente } from "./views/Asistente";
import { Nube } from "./views/Nube";
import { Ajustes } from "./views/Ajustes";
import { Login } from "./views/Login";
import { HAS_CLOUD } from "./lib/config";

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

function Root() {
  const { state, dispatch } = useStore();
  const cloud = useCloudSync(state, dispatch);

  return (
    <CloudContext.Provider value={cloud}>
      {/* 🔓 Modo demo: si la nube/login están desactivados (config.ts sin
          claves), mostramos la interfaz directamente con los datos de ejemplo.
          Al activar la nube (HAS_CLOUD = true) vuelve a aparecer el login. */}
      {!HAS_CLOUD ? (
        <Shell />
      ) : cloud.authStatus === "loading" ? (
        <Splash />
      ) : cloud.authStatus === "out" ? (
        <Login />
      ) : (
        <Shell />
      )}
    </CloudContext.Provider>
  );
}

function Splash() {
  return (
    <div className="min-h-full grid place-items-center">
      <div className="text-center animate-pop">
        <div className="text-4xl mb-2">📈</div>
        <p className="text-white/40 text-sm">Cargando tu plata…</p>
      </div>
    </div>
  );
}

function Shell() {
  const { dispatch } = useStore();
  const [screen, setScreen] = useState<Screen>("inicio");
  const [toast, setToast] = useState<string | null>(null);
  const intakeDone = useRef(false);

  const navigate = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  // Entrada desde el Atajo de iOS (Apple Pay): ?gasto=25000&desc=Éxito
  useEffect(() => {
    if (intakeDone.current) return;
    intakeDone.current = true;
    dispatch({ t: "APPLY_DUE_RECURRING" });
    const intake = consumeURLExpense();
    if (intake) {
      dispatch({
        t: "ADD_EXPENSE",
        expense: {
          id: uid("exp"),
          date: nowISO(),
          amount: intake.amount,
          note: intake.note,
          source: "atajo",
          pending: true,
        },
      });
      setToast(`Gasto de ${formatCOP(intake.amount)} agregado · por confirmar`);
      setScreen("gasto");
      setTimeout(() => setToast(null), 4000);
    }
  }, [dispatch]);

  return (
    <NavContext.Provider value={navigate}>
      {toast && (
        <div className="fixed top-0 inset-x-0 z-[70] flex justify-center px-4 pt-3 safe-top pointer-events-none">
          <div className="bg-money-600 text-white text-sm font-semibold rounded-full px-4 py-2 shadow-glow flex items-center gap-2 animate-pop">
            <CheckCircle2 size={16} /> {toast}
          </div>
        </div>
      )}
      <div className="min-h-full max-w-md mx-auto pb-24 safe-top">
        <div className="px-4 pt-4">
          {screen === "inicio" && <Dashboard />}
          {screen === "deudas" && <Deudas />}
          {screen === "gasto" && <Gasto />}
          {screen === "bolsillos" && <Bolsillos />}
          {screen === "mas" && <Mas />}
          {screen === "registro" && <Registro />}
          {screen === "proyeccion" && <Proyeccion />}
          {screen === "antiimpulso" && <AntiImpulso />}
          {screen === "asistente" && <Asistente />}
          {screen === "nube" && <Nube />}
          {screen === "ajustes" && <Ajustes />}
        </div>
      </div>
      <BottomNav current={screen} onNavigate={navigate} />
    </NavContext.Provider>
  );
}
