/* ==========================================================================
   leaderboard.js
   Ordena a los participantes (mejor puntaje primero, y a igual puntaje gana
   el menor tiempo). Rellena el podio (nombre/avatar de 1.º, 2.º y 3.º) y
   la tabla, que lista a TODOS los participantes con su puesto, tiempo y
   puntaje (el puntaje/tiempo ya no se repite en las tarjetas del podio).

   Punto de cambio para el futuro: obtenerParticipantes() es lo único que
   sabe de dónde vienen los datos. Hoy lee localStorage y, si no hay nada,
   usa datos de prueba. Si más adelante hay backend, solo se cambia esa
   función; el resto no se toca.

   Forma de cada participante: { nombre, puntaje, tiempoMs }
   ========================================================================== */

(function () {
  // Ruta relativa a la ubicación de leaderboard.html (ajustar a la carpeta real).
  const RUTA_MENU_PRINCIPAL = "../Menú_Principal/index.html";

  const CLAVE_LEADERBOARD = "leaderboardPicoDesk";

  // Cantidad de puestos que van arriba en el podio (solo nombre/avatar);
  // la tabla de abajo siempre lista a todos, podio incluido.
  const PUESTOS_EN_PODIO = 3;

  const DATOS_DE_PRUEBA = [
    { nombre: "Lucía",   puntaje: 110, tiempoMs: 95000 },
    { nombre: "Mateo",   puntaje: 110, tiempoMs: 83000 },
    { nombre: "Sofía",   puntaje: 100, tiempoMs: 120000 },
    { nombre: "Tomás",   puntaje: 90,  tiempoMs: 101000 },
    { nombre: "Valentina", puntaje: 90, tiempoMs: 134000 },
    { nombre: "Joaquín", puntaje: 80,  tiempoMs: 142000 },
    { nombre: "Camila",  puntaje: 70,  tiempoMs: 150000 },
    { nombre: "Bruno",   puntaje: 60,  tiempoMs: 171000 },
    { nombre: "Martina", puntaje: 50,  tiempoMs: 188000 },
    { nombre: "Lautaro", puntaje: 40,  tiempoMs: 205000 },
    { nombre: "Emma",    puntaje: 30,  tiempoMs: 233000 },
    { nombre: "Facundo", puntaje: 20,  tiempoMs: 260000 },
  ];

  function obtenerParticipantes() {
    try {
      const guardado = localStorage.getItem(CLAVE_LEADERBOARD);
      if (guardado) {
        const lista = JSON.parse(guardado);
        if (Array.isArray(lista) && lista.length) return lista;
      }
    } catch (error) {
      console.error("No se pudo leer la clasificación:", error);
    }
    return DATOS_DE_PRUEBA;
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

  // Se usa textContent (nunca innerHTML) porque el nombre lo escribe el jugador.
  // NUEVO: el podio ya no muestra puntaje/tiempo (ver .puesto__datos sacado
  // del HTML/CSS) — esos números ahora viven únicamente en la tabla, donde
  // también aparecen el 1.º, 2.º y 3.º puesto (ver rellenarTabla).
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

  // NUEVO: la tabla ahora muestra a TODOS los participantes (incluidos el
  // 1.º, 2.º y 3.º, que antes solo aparecían arriba en el podio). El podio
  // sigue mostrando nombre/avatar de los 3 primeros; el puntaje y el tiempo
  // de todos, posición por posición, se leen acá.
  function rellenarTabla(ranking) {
    const cuerpo = document.getElementById("tabla-cuerpo");
    if (!cuerpo) return;
    cuerpo.replaceChildren();

    if (!ranking.length) {
      const fila = document.createElement("tr");
      const celda = crearCelda("Todavía no hay participantes.");
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

  const botonVolver = document.getElementById("volver");
  if (botonVolver) {
    botonVolver.addEventListener("click", () => {
      window.location.href = RUTA_MENU_PRINCIPAL;
    });
  }
})();