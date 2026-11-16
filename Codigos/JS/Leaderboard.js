/* ==========================================================================
   leaderboard.js
   Lee los registros de localStorage, los ordena y los muestra.
   Si hay una "partidaActual" en sessionStorage (terminó el nivel 5),
   muestra el modal para pedir las iniciales y guarda el nuevo registro.
   ========================================================================== */

(function () {
  // CORRECCIÓN: La ruta correcta al Menú Principal
  const RUTA_MENU_PRINCIPAL = "MenúPrincipal.html";
  const CLAVE_LEADERBOARD = "leaderboardPicoDesk";
  const PUESTOS_EN_PODIO = 3;

  // ==========================================
  // LÓGICA DEL MODAL (Guardar Partida)
  // ==========================================
  const modal = document.getElementById("modalNombre");
  const inputNombre = document.getElementById("inputNombre");
  const btnGuardar = document.getElementById("btn-guardar");

  let partidaPendiente = null;
  try {
    const guardada = sessionStorage.getItem("partidaActual");
    if (guardada) partidaPendiente = JSON.parse(guardada);
  } catch (e) {}

  // Si hay una partida pendiente, mostramos el modal
  if (partidaPendiente && partidaPendiente.ultimoNivel === 5) {
    modal.classList.add("active");
    inputNombre.focus();

    btnGuardar.addEventListener("click", () => {
      let nombre = inputNombre.value.trim().toUpperCase();
      if (nombre.length < 4) nombre = nombre.padEnd(4, "X"); // Rellenar con X si tiene menos de 4

      // Leer historial, añadir nuevo y guardar
      let historial = [];
      try {
        const guardado = localStorage.getItem(CLAVE_LEADERBOARD);
        if (guardado) historial = JSON.parse(guardado);
      } catch (error) {}

      historial.push({
        nombre: nombre,
        puntaje: partidaPendiente.puntajeTotal,
        tiempoMs: partidaPendiente.tiempoTotalMs
      });

      localStorage.setItem(CLAVE_LEADERBOARD, JSON.stringify(historial));

      // Limpiar sesión y recargar
      sessionStorage.removeItem("partidaActual");
      sessionStorage.removeItem("resultadoNivel");
      window.location.reload();
    });
  }

  // ==========================================
  // RENDERIZADO DE LA TABLA Y PODIO
  // ==========================================
  function obtenerParticipantes() {
    try {
      const guardado = localStorage.getItem(CLAVE_LEADERBOARD);
      if (guardado) {
        const lista = JSON.parse(guardado);
        if (Array.isArray(lista)) return lista;
      }
    } catch (error) {
      console.error("No se pudo leer la clasificación:", error);
    }
    return []; // Retornamos vacío si no hay nada, adiós datos de prueba
  }

  function ordenar(lista) {
    return [...lista].sort(
      (a, b) => b.puntaje - a.puntaje || a.tiempoMs - b.tiempoMs
    );
  }

  function formatearTiempo(ms) {
    const totalSegundos = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }

  function rellenarPuesto(numero, participante) {
    const puesto = document.querySelector(`.puesto--${numero}`);
    if (!puesto) return;

    const avatar = puesto.querySelector(".puesto__avatar");
    const nombre = puesto.querySelector(".puesto__nombre");

    if (!participante) {
      puesto.classList.add("puesto--vacio");
      avatar.textContent = "?";
      nombre.textContent = "Sin jugador";
      return;
    }

    puesto.classList.remove("puesto--vacio");
    avatar.textContent = participante.nombre.trim().charAt(0).toUpperCase();
    nombre.textContent = participante.nombre;
  }

  function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
  }

  function rellenarTabla(ranking) {
    const cuerpo = document.getElementById("tabla-cuerpo");
    if (!cuerpo) return;
    cuerpo.replaceChildren();

    if (!ranking.length) {
      const fila = document.createElement("tr");
      const celda = crearCelda("Todavía no hay partidas guardadas. ¡Sé el primero en jugar!");
      celda.colSpan = 4;
      celda.className = "vacio";
      fila.appendChild(celda);
      cuerpo.appendChild(fila);
      return;
    }

    ranking.forEach((participante, i) => {
      const fila = document.createElement("tr");
      fila.appendChild(crearCelda(String(i + 1)));
      fila.appendChild(crearCelda(participante.nombre));
      fila.appendChild(crearCelda(formatearTiempo(participante.tiempoMs)));
      fila.appendChild(crearCelda(String(participante.puntaje)));
      cuerpo.appendChild(fila);
    });
  }

  const ranking = ordenar(obtenerParticipantes());

  for (let n = 1; n <= PUESTOS_EN_PODIO; n++) {
    rellenarPuesto(n, ranking[n - 1]);
  }
  rellenarTabla(ranking);

  // Botón Volver
  const botonVolver = document.getElementById("volver");
  if (botonVolver) {
    botonVolver.addEventListener("click", () => {
      window.location.href = RUTA_MENU_PRINCIPAL;
    });
  }
})();