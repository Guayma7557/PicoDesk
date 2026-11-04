/* ==========================================================================
   puntaje_nivel_2.js
   Calcula el puntaje del Nivel 2 (puntos fijos por acción completada) y
   mide el tiempo total que tarda el jugador. Al terminar el nivel, guarda
   el resultado en sessionStorage para que la Intermisión lo pueda leer y
   mostrar (se borra solo al cerrar la pestaña).

   No depende de herramientas_nivel_2.js ni de misiones_nivel_2.js: escucha
   los eventos personalizados que esos archivos ya disparan, así que
   funciona igual sin importar si la acción se hizo con click o arrastrando
   (drag & drop), ni en qué orden/ranura se pusieron las RAM. El nivel
   termina cuando están colocadas la CPU y las dos RAM y se presionaron los
   4 seguros.
   ========================================================================== */

(function () {
  // Puntos fijos por cada acción completada. Ajustar acá si en algún
  // momento se quiere rebalancear el puntaje.
  const PUNTOS_COLOCAR_PLACA = 10; // la CPU
  const PUNTOS_COLOCAR_RAM = 10; // por CADA memoria RAM colocada (son 2)
  const PUNTOS_PRESIONAR_SEGURO = 5; // por CADA seguro presionado (son 4)

  // Misma clave genérica que usa el resto de los niveles, así la
  // Intermisión no tiene que saber de qué nivel viene el resultado.
  const CLAVE_SESSION_STORAGE = "resultadoNivel";
  const NUMERO_NIVEL = 2;

  const inicio = Date.now();
  let puntaje = 0;

  function formatearTiempo(ms) {
    const totalSegundos = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }

  document.addEventListener("nivel2:placaColocada", () => {
    puntaje += PUNTOS_COLOCAR_PLACA;
  });

  document.addEventListener("nivel2:ramColocada", () => {
    puntaje += PUNTOS_COLOCAR_RAM;
  });

  document.addEventListener("nivel2:seguroPresionado", () => {
    puntaje += PUNTOS_PRESIONAR_SEGURO;
  });

  // Última acción del nivel (los 4 seguros presionados): cierra el cronómetro
  // y guarda el resultado.
  document.addEventListener("nivel2:nivelCompletado", () => {
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
      console.error("No se pudo guardar el resultado del Nivel 2:", error);
    }
  });
})();