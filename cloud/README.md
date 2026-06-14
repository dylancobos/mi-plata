# 🤖 Activar el Asistente IA (punto 2)

El asistente usa **Claude Haiku 4.5** (el modelo más barato: ~$1 entrada / $5 salida por
millón de tokens → para ti, **centavos al mes**). Tu llave de API **nunca** va dentro de la
app: vive en un pequeño "proxy" (Cloudflare Worker) que tú controlas.

## Paso 1 — Conseguir tu llave de Anthropic
1. Entra a **https://console.anthropic.com** y crea tu cuenta.
2. Ve a **API Keys → Create Key**. Copia la llave (empieza por `sk-ant-...`).
3. Carga unos pocos dólares de saldo (con $5 te sobra para muchos meses).

> ⚠️ No pegues esta llave en la app ni se la mandes a nadie. Solo va en el Worker (paso 2).

## Paso 2 — Crear el proxy (Cloudflare Worker, gratis, sin instalar nada)
1. Entra a **https://dash.cloudflare.com** y crea tu cuenta gratis.
2. Menú **Workers & Pages → Create → Create Worker**. Ponle un nombre (ej. `mi-plata-ia`) → **Deploy**.
3. Toca **Edit code**. Borra lo que haya y **pega TODO el contenido de** [`ai-worker.js`](ai-worker.js). → **Deploy**.
4. Ve a **Settings → Variables and Secrets → Add → Secret**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: tu llave `sk-ant-...`
   - **Encrypt** y guarda. (Vuelve a **Deploy** si te lo pide.)
5. Copia la URL de tu Worker (ej. `https://mi-plata-ia.TU-USUARIO.workers.dev`).

## Paso 3 — Conectarla en la app
1. Abre **Mi Plata → Más → Ajustes → Asistente IA**.
2. Pega la URL del Worker en "Dirección del asistente".
3. Listo: ve a **Más → Asistente IA** y pregúntale lo que quieras 🎉

## ¿Cuánto cuesta?
- Cloudflare Worker: **gratis** (100.000 peticiones/día).
- Claude Haiku 4.5: **centavos al mes** para un solo usuario.
- Total realista: **menos de $1 USD/mes**.

## Privacidad
Cuando usas el chat, se envía a Claude **un resumen de tus finanzas** (saldos, deudas, tope)
para que pueda responder. Lo demás sigue guardándose solo en tu dispositivo. Si prefieres no
mandar nada, simplemente no uses el chat.

---

# ☁️ Activar la Nube (punto 1) — sincronizar entre dispositivos

Hace que tus datos vivan online (gratis con Supabase), se vean en varios dispositivos, y
arregla el detalle de Apple Pay (Safari ↔ app instalada). La app **sigue funcionando sin nube**;
esto es un extra opcional.

## Paso 1 — Crear el proyecto Supabase (gratis)
1. Entra a **https://supabase.com** → **Start your project** → crea cuenta.
2. **New project**. Ponle nombre (ej. `mi-plata`), elige una contraseña de base de datos (guárdala),
   región la más cercana, y **Create**. Espera ~2 min a que termine.

## Paso 2 — Crear la tabla (copiar/pegar SQL)
1. En el proyecto, menú izquierdo **SQL Editor → New query**.
2. Pega esto y dale **Run**:

```sql
-- Tabla que guarda TODO el estado de la app, una fila por usuario.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seguridad: cada quien solo ve y edita SU fila.
alter table public.app_state enable row level security;

create policy "solo mi fila - select" on public.app_state
  for select using (auth.uid() = user_id);
create policy "solo mi fila - insert" on public.app_state
  for insert with check (auth.uid() = user_id);
create policy "solo mi fila - update" on public.app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Paso 3 — Mostrar el código de 6 dígitos en el correo (ajuste de 1 línea)
El login es por **código de 6 dígitos** (así funciona dentro del ícono instalado en iPhone, sin saltar a Safari). Para que el correo traiga el número:
1. Menú **Authentication → Emails** (o **Email Templates**) → pestaña **Magic Link**.
2. Agrega esta línea al cuerpo del correo (arriba del todo sirve):
   ```html
   <p>Tu código para entrar: <strong>{{ .Token }}</strong></p>
   ```
3. **Save**. *(El `{{ .Token }}` es el número de 6 dígitos que escribes en la app.)*

*(Opcional: en **Authentication → URL Configuration** pon tu **Site URL**, ej. `https://tu-app.netlify.app`.)*

## Paso 4 — Copiar tus 2 datos del proyecto
1. **Project URL:** menú **Settings → Data API** (o el botón verde **Connect** arriba) → copia el **Project URL** (`https://....supabase.co`).
2. **Llave pública:** menú **Settings → API Keys** → en **Publishable key** copia la que empieza por **`sb_publishable_...`** (es la nueva "anon public", segura en el navegador gracias al RLS).
   - ⚠️ NO uses la **Secret key** (`sb_secret_...`): esa es privada y nunca va en la app.
   - *(Si prefieres, en la pestaña "Legacy anon, service_role" sigue estando la anon clásica `eyJ...`; también funciona.)*

## Paso 5 — Conectar en la app
1. Abre **Mi Plata → Más → Nube y dispositivos**.
2. Pega el **Project URL** y el **anon public** key → **Guardar y conectar**.
3. Escribe tu **correo** → **Enviar enlace mágico** → abre el correo y toca el enlace **en ese mismo dispositivo**.
4. ¡Listo! Verás “✓ Sincronizado”. Repite el login (pasos 1–3) en tu otro dispositivo con el **mismo correo** y se comparten los datos. ✅

## ¿Cuánto cuesta?
- Supabase capa gratis: **$0/mes** (de sobra para un usuario).

## Notas
- Si dos dispositivos editan al mismo tiempo sin internet, gana el último que sincroniza (raro con un solo dueño).
- La llave `anon` es pública por diseño; la seguridad la da el RLS del Paso 2 + tu login.

---

### Atajo de Apple Pay con nube
Con la nube conectada, el Atajo de iOS puede abrir tu URL en Safari, registrar el gasto, y al abrir
la app instalada lo verás (porque ambos sincronizan con la misma cuenta). Ese era el detalle que faltaba. 🎯
