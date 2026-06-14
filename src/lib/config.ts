// ⚙️ Configuración de "Mi Plata".
//
// La app funciona 100% local sin necesidad de nube. Las siguientes constantes
// son OPCIONALES: solo se usan si quieres activar el respaldo en la nube
// (Supabase) y el asistente de IA (un Worker de Cloudflare que tú despliegas).
//
// Para activarlas, reemplaza los marcadores "PEGA_AQUI_..." con tus propios
// valores. La anon key de Supabase es pública y segura de exponer; la seguridad
// real la dan el login + las políticas RLS de Supabase + la validación del
// Worker. NUNCA pongas aquí tu ANTHROPIC_API_KEY: esa va como secreto en el
// Worker (ver cloud/ai-worker.js).

// Supabase Project URL (sin /rest/v1 al final). Ej: https://xxxx.supabase.co
export const SUPABASE_URL = "PEGA_AQUI_TU_SUPABASE_URL";

// Supabase anon / publishable key (pública).
export const SUPABASE_ANON_KEY = "PEGA_AQUI_TU_SUPABASE_ANON_KEY";

// Worker de IA en Cloudflare. Ej: https://tu-worker.tuusuario.workers.dev
export const AI_ENDPOINT = "PEGA_AQUI_TU_AI_ENDPOINT";

// Si usas la nube de forma privada, pon aquí el correo dueño (solo ese correo
// podrá entrar y usar la IA). Déjalo vacío para permitir cualquier correo.
export const OWNER_EMAIL = "";

// Helpers
export const HAS_CLOUD = !SUPABASE_ANON_KEY.startsWith("PEGA_AQUI");
export const HAS_AI = !AI_ENDPOINT.startsWith("PEGA_AQUI");
