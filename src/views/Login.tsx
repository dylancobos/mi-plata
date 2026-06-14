import { useState } from "react";
import { useCloud } from "../lib/cloudContext";
import { HAS_CLOUD, OWNER_EMAIL } from "../lib/config";
import { Button, TextInput, Field, Alert, Pill } from "../components/ui";

export function Login() {
  const cloud = useCloud();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || pass.length < 6 || busy) return;
    setGateError(null);
    if (email.trim().toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      setGateError("Por ahora la app es privada. Solo el correo del dueño puede entrar.");
      return;
    }
    setBusy(true);
    await cloud.signIn(email, pass);
    setBusy(false);
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-6 py-10 max-w-md mx-auto safe-top safe-bottom">
      {/* Marca */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-4 grid place-items-center bg-gradient-to-br from-calm-600/40 to-money-600/30 ring-1 ring-white/10">
          <span className="text-4xl">📈</span>
        </div>
        <h1 className="text-3xl font-bold">Mi Plata</h1>
        <p className="text-white/50 mt-1">Controla tu plata, con calma.</p>
      </div>

      {!HAS_CLOUD ? (
        <Alert level="warn" title="Falta un pasito de configuración">
          La app todavía no tiene conectada su nube.
        </Alert>
      ) : (
        <div className="rounded-3xl bg-white/[0.035] ring-1 ring-white/[0.05] p-6">
          {/* Pestañas: Entrar activo, Crear cuenta en construcción */}
          <div className="flex gap-2 mb-5 bg-ink-900 rounded-xl p-1">
            <div className="flex-1 py-2 rounded-lg text-sm font-semibold text-center bg-white/12 text-white">
              Entrar
            </div>
            <div className="flex-1 py-2 rounded-lg text-sm font-semibold text-center text-white/30 flex items-center justify-center gap-1">
              Crear cuenta
              <Pill tone="warn">🚧</Pill>
            </div>
          </div>

          <Field label="Correo">
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@gmail.com"
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </Field>
          <Field label="Contraseña" hint="La que elijas. Mínimo 6 caracteres.">
            <TextInput
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              type="password"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </Field>

          {(gateError || cloud.error) && (
            <div className="mb-3">
              <Alert level="danger">{gateError || cloud.error}</Alert>
            </div>
          )}

          <Button full disabled={!email.trim() || pass.length < 6 || busy} onClick={submit}>
            {busy ? "Un momento…" : "Entrar"}
          </Button>

          <p className="text-center text-[11px] text-white/30 mt-4">
            App privada · el registro abierto está en construcción 🚧
          </p>
        </div>
      )}

      <p className="text-center text-[11px] text-white/25 mt-6">
        Tus datos se sincronizan de forma segura y privada.
      </p>
    </div>
  );
}
