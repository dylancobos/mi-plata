# Mi Plata 💰 — app de finanzas personales

App web (PWA) de finanzas personales en **pesos colombianos**.
Hecha con React + Vite + Tailwind. **Tus datos se guardan solo en tu dispositivo** (no hay servidor ni login obligatorio).

> ℹ️ Esta es una versión de demostración: trae datos de ejemplo ficticios y la nube/IA vienen **desactivadas** por defecto. Para activarlas, edita `src/lib/config.ts` y sigue la guía de `cloud/`.

## Probarla en tu computador

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5273
```

## Verla en tu celular (en la misma red WiFi)

```bash
npm run host     # te muestra una dirección tipo http://192.168.x.x:5273
```

Abre esa dirección en Safari de tu iPhone.

## Publicarla GRATIS

La forma más fácil, sin cuenta de programador:

1. Genera la versión final:
   ```bash
   npm run build      # crea la carpeta dist/
   ```
2. Entra a **https://app.netlify.com/drop** (es gratis).
3. Arrastra la carpeta `dist` a esa página.
4. Te da una dirección pública (ej. `https://tu-app.netlify.app`).

> Alternativa: **Vercel** o **Cloudflare Pages** también sirven (carpeta de salida: `dist`).

## Instalarla como app en tu iPhone

1. Abre tu dirección pública en **Safari**.
2. Toca **Compartir** (el cuadrito con la flecha) → **Añadir a pantalla de inicio**.
3. Listo: te queda con su ícono, a pantalla completa, como una app normal.

## Hacer respaldo de tus datos

Como todo se guarda en el dispositivo, de vez en cuando entra a **Ajustes → Respaldar**
para descargar un archivo `.json`. Con **Restaurar** lo vuelves a cargar si cambias de teléfono.

## (Opcional) Nube e IA

Son extras opcionales que tú mismo configuras con tus propias cuentas:

- **Nube** (sincronizar entre dispositivos) con Supabase — gratis.
- **Asistente IA** con un Worker de Cloudflare + tu llave de Anthropic.

Guía completa en [`cloud/README.md`](cloud/README.md). Mientras no las configures, la app funciona 100% local.

## Lo que trae

- **Inicio**: patrimonio neto, deuda total con progreso, bolsillos, mensaje motivador y alerta de tope.
- **Deudas**: método avalancha, abonos y celebración al liquidar.
- **Gasto**: tope de gusto editable con alertas claras.
- **Bolsillos**: fondo de emergencia, dólares con TRM editable, colchón de liquidez.
- **Registro quincenal**: anotas tu plata y la repartes (con botón "repartir según mi plan").
- **Proyección**: cuándo quedas libre de deudas + cómo crecen tus ahorros y dólares.
- **Anti-impulso**: regla de 24 horas + contador de gastos evitados.
- **Ajustes**: todo editable (ingresos, presupuesto, deudas, bolsillos, TRM) + respaldo.

Todo en español, montos en COP ($#.###.###), mobile-first.
