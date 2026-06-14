// Proxy de IA para "Mi Plata" — Cloudflare Worker.
// Solo responde a usuarios con sesión válida (valida el token de Supabase),
// así nadie más puede gastar tu saldo de IA. Modelo: Claude Haiku 4.5.
//
// Variables que debes poner en el Worker (Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY  → Secret  (tu sk-ant-...)
//   SUPABASE_ANON_KEY  → Text    (tu Publishable key sb_publishable_...)
//   SUPABASE_URL       → Text    (https://xxxx.supabase.co)
//   OWNER_EMAIL        → Text    (opcional: si lo pones, solo ese correo puede
//                                 usar la IA; si lo dejas vacío, cualquier
//                                 usuario con sesión válida puede usarla)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return json({ error: "method" }, 405);

    // 1) Validar que sea un usuario con sesión (token de Supabase)
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!(await isValidUser(token, env))) {
      return json({ error: "no_auth" }, 401);
    }

    // 2) Leer la pregunta
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad_json" }, 400);
    }
    const message = String(body.message || "").slice(0, 2000);
    const context = String(body.context || "").slice(0, 8000);
    if (!message) return json({ error: "empty" }, 400);

    const system =
      `Eres el asistente financiero personal de la app "Mi Plata", en español ` +
      `colombiano, cercano y motivador (nunca aburrido como un banco). Ayudas al ` +
      `usuario a controlar el gasto impulsivo, pagar deudas con método avalancha y ` +
      `ahorrar. Responde corto, claro y accionable, con montos en pesos colombianos ` +
      `(formato $#.###.###). No des asesoría de inversión regulada; si te la piden, ` +
      `aclara con cariño que no eres asesor licenciado.\n\n` +
      `Cuando el usuario te pida REGISTRAR o CAMBIAR algo (un gasto, un abono a una ` +
      `deuda, cambiar la TRM, o aportar/retirar de un bolsillo), USA la herramienta ` +
      `correspondiente con los valores exactos extraídos de su mensaje (interpreta ` +
      `"30 mil" como 30000, "4.100" como 4100). Para deudas y bolsillos usa el NOMBRE ` +
      `exacto que aparece en el contexto. Si falta un dato clave (como el monto), NO ` +
      `inventes: pídelo en una frase corta. Siempre acompaña la acción con una frase ` +
      `breve y amable. Esta es la situación actual del usuario:\n\n${context}`;

    const tools = [
      {
        name: "add_expense",
        description: "Registrar un gasto personal del usuario en pesos colombianos.",
        input_schema: {
          type: "object",
          properties: {
            amount: { type: "number", description: "Monto del gasto en COP (entero, sin puntos)." },
            note: { type: "string", description: "En qué fue el gasto (ej: domicilio, ropa)." },
          },
          required: ["amount"],
        },
      },
      {
        name: "pay_debt",
        description: "Registrar un abono/pago a una deuda existente.",
        input_schema: {
          type: "object",
          properties: {
            debt: { type: "string", description: "Nombre de la deuda tal como aparece en el contexto." },
            amount: { type: "number", description: "Monto del abono en COP." },
          },
          required: ["debt", "amount"],
        },
      },
      {
        name: "set_trm",
        description: "Actualizar la TRM (cuántos pesos vale 1 dólar).",
        input_schema: {
          type: "object",
          properties: { trm: { type: "number", description: "Nueva TRM en COP por USD." } },
          required: ["trm"],
        },
      },
      {
        name: "pocket_move",
        description: "Aportar o retirar dinero de un bolsillo de ahorro/inversión.",
        input_schema: {
          type: "object",
          properties: {
            pocket: { type: "string", description: "Nombre del bolsillo tal como aparece en el contexto." },
            amount: { type: "number", description: "Monto en COP." },
            direction: { type: "string", enum: ["aporte", "retiro"], description: "aporte (meter) o retiro (sacar)." },
          },
          required: ["pocket", "amount", "direction"],
        },
      },
    ];

    // 3) Llamar a Claude (con herramientas)
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 700,
        system,
        tools,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return json({ error: "claude", detail: detail.slice(0, 200) }, 502);
    }

    const data = await r.json();
    const blocks = data.content || [];
    const reply = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const actions = blocks
      .filter((b) => b.type === "tool_use")
      .map((b) => ({ name: b.name, input: b.input }));

    return json({ reply, actions });
  },
};

async function isValidUser(token, env) {
  const anonKey = env.SUPABASE_ANON_KEY;
  const supabaseUrl = env.SUPABASE_URL;
  const ownerEmail = (env.OWNER_EMAIL || "").trim();
  if (!token || !anonKey || !supabaseUrl) return false;
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, authorization: `Bearer ${token}` },
    });
    if (!r.ok) return false;
    const u = await r.json();
    // Si no se configuró OWNER_EMAIL, basta con tener sesión válida.
    if (!ownerEmail) return true;
    return (u?.email || "").toLowerCase() === ownerEmail.toLowerCase();
  } catch {
    return false;
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
