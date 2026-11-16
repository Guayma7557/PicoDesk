/* ==========================================================================
   resultados_intermision.js
   Acumula los resultados de cada nivel en "partidaActual" (sessionStorage)
   y muestra un contador regresivo antes de pasar al siguiente nivel.
   ========================================================================== */

(function () {
  const elNumeroNivel = document.querySelector("#numero-nivel");
  const elValorPuntaje = document.querySelector("#valor-puntaje");
  const elValorTiempo = document.querySelector("#valor-tiempo");
  const elCountdown = document.querySelector("#countdown");

  let resultado = null;
  try {
    const guardado = sessionStorage.getItem("resultadoNivel");
    if (guardado) resultado = JSON.parse(guardado);
  } catch (error) {
    console.error("No se pudo leer el resultado del nivel:", error);
  }

  // Si entramos directo por URL, no hay partida.
  if (!resultado) {
    if (elNumeroNivel) elNumeroNivel.textContent = "-";
    if (elValorPuntaje) elValorPuntaje.textContent = "0";
    if (elValorTiempo) elValorTiempo.textContent = "00:00";
    if (elCountdown) elCountdown.parentElement.style.display = "none";
    return;
  }

  // 1. Acumular datos en "partidaActual"
  let partida = { puntajeTotal: 0, tiempoTotalMs: 0, ultimoNivel: 0 };
  try {
    const guardada = sessionStorage.getItem("partidaActual");
    if (guardada) partida = JSON.parse(guardada);
  } catch (e) {}

  // Sumamos los puntos y tiempos del nivel actual
  partida.puntajeTotal += resultado.puntaje;
  partida.tiempoTotalMs += resultado.tiempoMs;
  partida.ultimoNivel = resultado.nivel;

  // Guardamos la partida actualizada y borramos el resultado individual
  // para evitar que se sume dos veces si el usuario recarga la página.
  sessionStorage.setItem("partidaActual", JSON.stringify(partida));
  sessionStorage.removeItem("resultadoNivel");

  // 2. Mostrar datos en pantalla
  const formatearTiempo = (ms) => {
    const totalSeg = Math.floor(ms / 1000);
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  if (elNumeroNivel) elNumeroNivel.textContent = partida.ultimoNivel;
  if (elValorPuntaje) elValorPuntaje.textContent = partida.puntajeTotal;
  if (elValorTiempo) elValorTiempo.textContent = formatearTiempo(partida.tiempoTotalMs);

  // 3. Lógica de redirección y cuenta regresiva
  let segundosRestantes = 5;
  if (elCountdown) elCountdown.textContent = segundosRestantes;

  const intervalo = setInterval(() => {
    segundosRestantes--;
    if (elCountdown) elCountdown.textContent = segundosRestantes;

    if (segundosRestantes <= 0) {
      clearInterval(intervalo);
      if (partida.ultimoNivel < 5) {
        window.location.href = `Niveles/nivel_${partida.ultimoNivel + 1}/nivel_${partida.ultimoNivel + 1}.html`;
      } else {
        window.location.href = 'Leaderboard.html';
      }
    }
  }, 1000);

})();