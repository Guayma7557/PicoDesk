/* ==========================================================================
   puntaje_nivel_3.js
   Calcula el puntaje del Nivel 3 y guarda el resultado para la Intermisión.
   No depende de herramientas_nivel_3.js ni de misiones_nivel_3.js: escucha
   los eventos personalizados que esos archivos ya disparan, así que
   funciona igual sin importar si la acción se hizo con click o arrastrando
   (drag & drop), ni en qué orden/ranura se pusieron las herramientas. El
   nivel termina cuando se completa la última etapa (hoy, el disco duro:
   colocado, presionado y deslizado bajo el rack).
   ========================================================================== */

(function () {
  // Puntos fijos por cada acción completada, por componente. Para otro
  // componente basta con agregar una línea con su nombre (el mismo
  // data-componente del HTML); los que no figuren usan PUNTOS_POR_DEFECTO.
  const PUNTOS = {
    gpu: { colocar: 10, presionar: 10 }, // 10 por cada GPU colocada y 10 por cada GPU presionada
    disco: { colocar: 10, presionar: 10, deslizar: 10 }, // 10 por cada paso del disco duro
  };
  const PUNTOS_POR_DEFECTO = { colocar: 10, presionar: 10, deslizar: 10 };

  function puntosDe(componente) {
    return PUNTOS[componente] || PUNTOS_POR_DEFECTO;
  }

  // Misma clave genérica que usa el resto de los niveles, así la
  // Intermisión no tiene que saber de qué nivel viene el resultado.
  const CLAVE_SESSION_STORAGE = "resultadoNivel";
  const NUMERO_NIVEL = 3;

  const inicio = Date.now();
  let puntaje = 0;

  function formatearTiempo(ms) {
    const totalSegundos = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }

  document.addEventListener("nivel3:componenteColocado", (evento) => {
    puntaje += puntosDe(evento.detail.componente).colocar;
  });

  document.addEventListener("nivel3:presionado", (evento) => {
    puntaje += puntosDe(evento.detail.componente).presionar || 0;
  });

  document.addEventListener("nivel3:deslizado", (evento) => {
    puntaje += puntosDe(evento.detail.componente).deslizar || 0;
  });

  // Última acción del nivel (se completó la última etapa): cierra el
  // cronómetro y guarda el resultado.
  document.addEventListener("nivel3:nivelCompletado", () => {
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
      console.error("No se pudo guardar el resultado del Nivel 3:", error);
    }
  });
})();
