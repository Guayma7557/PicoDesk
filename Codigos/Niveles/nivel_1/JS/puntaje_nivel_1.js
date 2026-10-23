/* ==========================================================================
   puntaje-nivel1.js
   Calcula el puntaje del Nivel 1 (puntos fijos por acción completada) y
   mide el tiempo total que tarda el jugador. Al terminar el nivel, guarda
   el resultado en sessionStorage para que la Intermisión lo pueda leer y
   mostrar (se borra solo al cerrar la pestaña).

   No depende de herramientas-nivel1.js ni de misiones-nivel1.js: escucha
   los mismos eventos personalizados que esos archivos ya disparan, así
   que funciona igual sin importar si la acción se hizo con click o
   arrastrando (drag & drop) — y sin importar cuántos tornillos tenga el
   nivel, porque no hay ningún total "hardcodeado" acá.
   ========================================================================== */

(function () {
  // Puntos fijos por cada acción completada. Ajustar acá si en algún
  // momento se quiere rebalancear el puntaje (ej. dar más valor a
  // "ajustar" que a "colocar").
  const PUNTOS_COLOCAR_PLACA = 10;
  const PUNTOS_COLOCAR_TORNILLO = 10;
  const PUNTOS_AJUSTAR_TORNILLO = 10;

  // Misma clave genérica que usa el resto de los niveles, así la
  // Intermisión no tiene que saber de qué nivel viene el resultado.
  const CLAVE_SESSION_STORAGE = "resultadoNivel";
  const NUMERO_NIVEL = 1;

  const inicio = Date.now();
  let puntaje = 0;

  function formatearTiempo(ms) {
    const totalSegundos = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }

  document.addEventListener("nivel1:placaColocada", () => {
    puntaje += PUNTOS_COLOCAR_PLACA;
  });

  document.addEventListener("nivel1:tornilloColocado", () => {
    puntaje += PUNTOS_COLOCAR_TORNILLO;
  });

  document.addEventListener("nivel1:tornilloApretado", () => {
    puntaje += PUNTOS_AJUSTAR_TORNILLO;
  });

  // Se dispara justo cuando se ajusta el último tornillo: el nivel está
  // terminado, así que cerramos el cronómetro y guardamos el resultado.
  document.addEventListener("nivel1:pasoCompletado", () => {
    const tiempoMs = Date.now() - inicio;

    const resultado = {
      nivel: NUMERO_NIVEL,
      puntaje,
      tiempoMs,
      tiempoTexto: formatearTiempo(tiempoMs),
    };

    try {
      sessionStorage.setItem(CLAVE_SESSION_STORAGE, JSON.stringify(resultado));
    } catch (error) {
      // Si sessionStorage no está disponible (ej. modo privado estricto),
      // la Intermisión va a quedar con los valores por defecto del HTML.
      console.error("No se pudo guardar el resultado del Nivel 1:", error);
    }
  });
})();