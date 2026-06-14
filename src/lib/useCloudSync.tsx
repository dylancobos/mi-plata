import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "./types";
import { getClient, pullState, pushState } from "./cloud";
import { HAS_CLOUD } from "./config";

export type AuthStatus = "loading" | "out" | "in";
export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface CloudApi {
  authStatus: AuthStatus;
  email: string | null;
  syncStatus: SyncStatus;
  error: string | null;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

export function useCloudSync(
  state: AppState,
  dispatch: (a: { t: "IMPORT_STATE"; state: AppState }) => void
): CloudApi {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(HAS_CLOUD ? "loading" : "out");
  const [email, setEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const userId = useRef<string | null>(null);
  const lastAppliedRemote = useRef<string | null>(null);
  const lastPushed = useRef<string | null>(null);

  const doPull = useCallback(async () => {
    const c = getClient();
    if (!c || !userId.current) return;
    setSyncStatus("syncing");
    setError(null);
    try {
      const remote = await pullState(c, userId.current);
      if (remote) {
        const remoteJSON = JSON.stringify(remote);
        if (remoteJSON !== JSON.stringify(stateRef.current)) {
          lastAppliedRemote.current = remoteJSON;
          dispatch({ t: "IMPORT_STATE", state: remote });
        }
        lastPushed.current = remoteJSON;
      } else {
        await pushState(c, userId.current, stateRef.current);
        lastPushed.current = JSON.stringify(stateRef.current);
      }
      setSyncStatus("synced");
    } catch (e: any) {
      setError(e?.message || "Error al sincronizar");
      setSyncStatus("error");
    }
  }, [dispatch]);

  // Init: sesión actual + escuchar cambios de auth
  useEffect(() => {
    const c = getClient();
    if (!c) {
      setAuthStatus("out");
      return;
    }
    let unsub: { unsubscribe: () => void } | undefined;
    (async () => {
      const { data } = await c.auth.getSession();
      if (data.session) {
        userId.current = data.session.user.id;
        setEmail(data.session.user.email || null);
        setAuthStatus("in");
        await doPull();
      } else {
        setAuthStatus("out");
      }
      const res = c.auth.onAuthStateChange(async (_e, session) => {
        if (session) {
          userId.current = session.user.id;
          setEmail(session.user.email || null);
          setAuthStatus("in");
          await doPull();
        } else {
          userId.current = null;
          setEmail(null);
          setAuthStatus("out");
        }
      });
      unsub = res.data.subscription;
    })();
    return () => unsub?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push al cambiar el estado (con debounce)
  useEffect(() => {
    const c = getClient();
    if (!c || !userId.current) return;
    const json = JSON.stringify(state);
    if (json === lastAppliedRemote.current) {
      lastAppliedRemote.current = null;
      return;
    }
    if (json === lastPushed.current) return;
    const t = setTimeout(async () => {
      try {
        setSyncStatus("syncing");
        await pushState(c, userId.current!, state);
        lastPushed.current = json;
        setSyncStatus("synced");
      } catch (e: any) {
        setError(e?.message || "Error al guardar en la nube");
        setSyncStatus("error");
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [state]);

  // Pull al volver a la app
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && userId.current) doPull();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [doPull]);

  const signUp = useCallback(async (mail: string, pass: string): Promise<boolean> => {
    const c = getClient();
    if (!c) return false;
    setError(null);
    const { error } = await c.auth.signUp({ email: mail.trim(), password: pass });
    if (error) {
      setError(error.message);
      return false;
    }
    return true; // onAuthStateChange lleva a "in" (si el correo no requiere confirmación)
  }, []);

  // Entrar; si es el primer ingreso del dueño (cuenta aún sin crear), la crea sola.
  const signIn = useCallback(async (mail: string, pass: string): Promise<boolean> => {
    const c = getClient();
    if (!c) return false;
    setError(null);
    const email = mail.trim();
    const { error } = await c.auth.signInWithPassword({ email, password: pass });
    if (!error) return true;

    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid login credentials")) {
      // No existe la cuenta todavía: créala (primer ingreso).
      const { error: e2 } = await c.auth.signUp({ email, password: pass });
      if (e2) {
        setError(e2.message);
        return false;
      }
      return true;
    }
    setError(error.message);
    return false;
  }, []);

  const signOut = useCallback(async () => {
    const c = getClient();
    if (c) await c.auth.signOut();
  }, []);

  return { authStatus, email, syncStatus, error, signUp, signIn, signOut, syncNow: doPull };
}
