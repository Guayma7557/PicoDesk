/* ==========================================================================
   SupabaseConfig.js
   ÚNICO lugar donde se configura la conexión con Supabase. Lo usan tanto
   Registro.js como IniciarSesion.js, así que la URL y la clave se pegan
   una sola vez, acá.

   Se carga DESPUÉS de la librería de Supabase (CDN) y ANTES de los demás JS.

   Dónde conseguir los valores: Supabase -> Project Settings -> API.
   Usar SOLO la clave pública (anon / publishable).
   Nunca pegar acá la clave "service_role".
   ========================================================================== */

(function () {
    'use strict';

    const SUPABASE_URL = 'https://cvlkzvuojsjdhtovnepm.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_pqirQp0JzvHi64Gjh-5WdQ_oS5hEM7p';

    const configuracionCompleta =
        window.supabase &&
        typeof window.supabase.createClient === 'function' &&
        !SUPABASE_URL.includes('TU-PROYECTO') &&
        !SUPABASE_ANON_KEY.includes('TU_CLAVE');

    // window.PicoDeskDB es el cliente compartido. Queda en null si la librería
    // no cargó o si todavía no se completaron la URL y la clave.
    // No se usa el sistema de login propio de Supabase, por eso no se guarda
    // ninguna sesión de su parte.
    window.PicoDeskDB = configuracionCompleta
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
              auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;
})();