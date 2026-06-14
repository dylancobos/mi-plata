import { useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles, Bot, Check, X, Mic } from "lucide-react";
import { useStore, uid } from "../lib/store";
import { useNavigate } from "../lib/nav";
import { useVoice } from "../lib/useVoice";
import {
  buildContext,
  askAI,
  resolveAction,
  AIMessage,
  ActionStatus,
  AI_SUGGESTIONS,
} from "../lib/ai";
import { HAS_AI } from "../lib/config";
import { Card, Alert, IconBadge } from "../components/ui";

export function Asistente() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading || !HAS_AI) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user" as const, text: msg }];
    setMessages(next);
    setLoading(true);
    try {
      const result = await askAI(msg, buildContext(state));
      const actions = result.actions.map((a) => resolveAction(a, state));
      const status: ActionStatus[] = actions.map(() => "pending");
      const text =
        result.reply || (actions.length ? "Esto fue lo que entendí 👇" : "Listo.");
      setMessages([
        ...next,
        { role: "assistant", text, actions: actions.length ? actions : undefined, status: actions.length ? status : undefined },
      ]);
    } catch (e: any) {
      setError(e?.message || "No pude conectar con el asistente.");
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const setStatus = (mi: number, ai: number, s: ActionStatus) =>
    setMessages((prev) =>
      prev.map((m, i) =>
        i !== mi ? m : { ...m, status: m.status?.map((v, j) => (j === ai ? s : v)) }
      )
    );

  const confirm = (mi: number, ai: number) => {
    const m = messages[mi];
    const r = m?.actions?.[ai];
    if (!r?.ok || !r.dispatch || m.status?.[ai] !== "pending") return;
    const act = { ...r.dispatch };
    if (act.t === "ADD_EXPENSE") act.expense = { ...act.expense, id: uid("exp") };
    dispatch(act);
    setStatus(mi, ai, "done");
  };

  const voice = useVoice((t) => send(t));

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("mas")} className="p-1 -ml-1 text-white/50">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Asistente 🤖</h1>
          <p className="text-sm text-white/50">Pídele que registre o ajuste cosas</p>
        </div>
      </div>

      {!HAS_AI ? (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <IconBadge emoji="🤖" tone="calm" />
            <div>
              <p className="font-semibold">Asistente no disponible</p>
              <p className="text-xs text-white/50">Aún no está conectada la IA en esta versión.</p>
            </div>
          </div>
          <Alert level="info">Vuelve a intentar más tarde.</Alert>
        </Card>
      ) : (
        <>
          <div className="space-y-3 min-h-[36vh]">
            {messages.length === 0 && (
              <Card>
                <div className="flex items-center gap-3">
                  <IconBadge emoji="✨" tone="money" />
                  <p className="text-sm text-white/70">
                    Hola {state.settings.ownerName}. Dime cosas como “gasté 30 mil en domicilio” o “cambió la TRM a
                    4.100” y yo lo registro (tú confirmas con un toque).
                  </p>
                </div>
              </Card>
            )}

            {messages.map((m, mi) => (
              <div key={mi}>
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-calm-600/40 text-white rounded-br-md"
                        : "bg-white/[0.06] text-white/90 rounded-bl-md"
                    }`}
                  >
                    {m.role === "assistant" && <Bot size={14} className="inline -mt-0.5 mr-1 text-money-400" />}
                    {m.text}
                  </div>
                </div>

                {/* Acciones propuestas por la IA */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {m.actions.map((r, ai) => {
                      const st = m.status?.[ai] || "pending";
                      return (
                        <div
                          key={ai}
                          className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] px-3 py-2.5 max-w-[92%]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{r.emoji}</span>
                            <p className="text-sm flex-1 min-w-0">{r.label}</p>
                          </div>
                          {!r.ok ? (
                            <p className="text-xs text-rose-300 mt-1">{r.error}</p>
                          ) : st === "done" ? (
                            <p className="text-xs text-money-400 mt-2 flex items-center gap-1">
                              <Check size={13} /> Hecho
                            </p>
                          ) : st === "dismissed" ? (
                            <p className="text-xs text-white/40 mt-2">Descartado</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 mt-2.5">
                              <button
                                onClick={() => confirm(mi, ai)}
                                className="py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-money-500 to-money-600 text-white active:scale-95"
                              >
                                <Check size={14} className="inline -mt-0.5 mr-1" /> Confirmar
                              </button>
                              <button
                                onClick={() => setStatus(mi, ai, "dismissed")}
                                className="py-2 rounded-lg text-sm font-semibold bg-white/8 text-white/60 active:scale-95"
                              >
                                <X size={14} className="inline -mt-0.5 mr-1" /> Descartar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.06] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-white/50">
                  Pensando…
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {error && <Alert level="danger">{error}</Alert>}

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-white/[0.06] text-white/70 px-3 py-2 rounded-full active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 sticky bottom-24">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Escribe o dicta…"
              className="flex-1 rounded-xl bg-ink-900 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-calm-500"
            />
            {voice.supported && (
              <button
                onClick={voice.start}
                className={`w-12 rounded-xl grid place-items-center transition active:scale-95 ${
                  voice.listening ? "bg-danger/30 text-rose-300 animate-pulse" : "bg-white/8 text-white/70"
                }`}
                aria-label="Dictar"
              >
                <Mic size={18} />
              </button>
            )}
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-12 rounded-xl grid place-items-center bg-gradient-to-br from-money-500 to-money-600 text-white active:scale-95 disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </div>

          <p className="text-[11px] text-white/30 flex items-center gap-1 justify-center">
            <Sparkles size={11} /> Se envía un resumen de tus finanzas a Claude. Tú confirmas cada cambio. No es asesor licenciado.
          </p>
        </>
      )}
    </div>
  );
}
