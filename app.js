// Diario de Estudio - versión 1

// Devuelve la fecha local como texto "YYYY-MM-DD" (lo que usa <input type="date">)
function fechaLocalTexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// Carga las sesiones guardadas (o empieza con una lista vacía)
// Compatible con clave antigua "sesiones" y nuevo formato { date, topic, minutes }
function cargarSesiones() {
  // Primero intenta la clave nueva
  let guardadas = localStorage.getItem("diario-estudio-sesiones");
  let sesiones = [];

  if (guardadas !== null) {
    sesiones = JSON.parse(guardadas);
  } else {
    // Migración desde clave antigua "sesiones" (formato { id, fecha, tema, minutos })
    const antiguas = localStorage.getItem("sesiones");
    if (antiguas !== null) {
      const viejas = JSON.parse(antiguas);
      sesiones = viejas.map(function (s) {
        return {
          date: s.fecha,
          topic: s.tema,
          minutes: s.minutos,
        };
      });
      // Guarda en formato nuevo y borra la clave antigua
      guardarSesiones(sesiones);
      localStorage.removeItem("sesiones");
    }
  }

  return sesiones;
}

// Guarda la lista de sesiones en localStorage
function guardarSesiones(sesiones) {
  localStorage.setItem("diario-estudio-sesiones", JSON.stringify(sesiones));
}

// Calcula la racha actual: días seguidos con al menos una sesión
function calcularRacha(sesiones) {
  // Conjunto con todas las fechas (únicas) que tienen sesión
  const diasConSesion = new Set();
  for (let i = 0; i < sesiones.length; i++) {
    diasConSesion.add(sesiones[i].date);
  }

  const hoy = new Date();
  const cursor = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  // Si hoy no hay sesión, la racha puede empezar ayer (sigue viva hasta que acabe el día)
  if (!diasConSesion.has(fechaLocalTexto(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!diasConSesion.has(fechaLocalTexto(cursor))) {
      return 0;
    }
  }

  // Cuenta hacia atrás los días consecutivos con sesión
  let racha = 0;
  while (diasConSesion.has(fechaLocalTexto(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

// Calcula la mejor racha (récord histórico): máximo de días consecutivos con al menos 1 sesión
function calcularMejorRacha(sesiones) {
  // Conjunto con fechas únicas (AAAA-MM-DD)
  const diasUnicos = new Set();
  for (let i = 0; i < sesiones.length; i++) {
    if (sesiones[i] && sesiones[i].date) {
      diasUnicos.add(sesiones[i].date);
    }
  }

  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  // Obtiene lista ordenada de fechas únicas (local), descarta futuras
  const fechas = [];
  diasUnicos.forEach(function (f) {
    // f es formato AAAA-MM-DD
    const partes = f.split("-");
    if (partes.length === 3) {
      const anio = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);
      const fechaObj = new Date(anio, mes, dia);
      // Solo si es válida (mismo valor)
      if (
        fechaObj.getFullYear() === anio &&
        fechaObj.getMonth() === mes &&
        fechaObj.getDate() === dia
      ) {
        // Descartar fechas futuras
        if (fechaObj.getTime() <= hoyLocal.getTime()) {
          fechas.push(fechaObj);
        }
      }
    }
  });

  // Ordenar de más antigua a más reciente
  fechas.sort(function (a, b) {
    return a.getTime() - b.getTime();
  });

  if (fechas.length === 0) {
    return 0;
  }

  let mejorRacha = 1;
  let rachaActualTramo = 1;

  for (let i = 1; i < fechas.length; i++) {
    const anterior = fechas[i - 1];
    const actual = fechas[i];
    // Comprobar si son consecutivos (+1 día)
    const siguienteDia = new Date(anterior.getFullYear(), anterior.getMonth(), anterior.getDate());
    siguienteDia.setDate(siguienteDia.getDate() + 1);

    if (
      actual.getFullYear() === siguienteDia.getFullYear() &&
      actual.getMonth() === siguienteDia.getMonth() &&
      actual.getDate() === siguienteDia.getDate()
    ) {
      // Consecutivos
      rachaActualTramo++;
    } else {
      // Tramo roto, actualizamos mejor racha si este tramo fue mayor
      if (rachaActualTramo > mejorRacha) {
        mejorRacha = rachaActualTramo;
      }
      rachaActualTramo = 1;
    }
  }

  // Revisar el último tramo
  if (rachaActualTramo > mejorRacha) {
    mejorRacha = rachaActualTramo;
  }

  return mejorRacha;
}

// Muestra la racha en pantalla
function mostrarRacha(sesiones) {
  document.getElementById("rachaNumero").textContent = calcularRacha(sesiones);
}

// Muestra la mejor racha en pantalla
function mostrarMejorRacha(sesiones) {
  document.getElementById("mejorRacha").textContent = calcularMejorRacha(sesiones);
}

// Muestra la lista de sesiones, de la más reciente a la más antigua
function mostrarSesiones(sesiones) {
  const lista = document.getElementById("listaSesiones");
  lista.innerHTML = "";

  if (sesiones.length === 0) {
    const vacio = document.createElement("li");
    vacio.textContent = "Todavía no hay sesiones. ¡Registra la primera!";
    lista.appendChild(vacio);
    return;
  }

  // Copia y ordena: fecha descendente; si son del mismo día, la última añadida primero
  const ordenadas = sesiones.slice().sort(function (a, b) {
    if (a.date === b.date) {
      return b.id - a.id;
    }
    return a.date < b.date ? 1 : -1;
  });

  for (let i = 0; i < ordenadas.length; i++) {
    const sesion = ordenadas[i];
    const item = document.createElement("li");

    const tema = document.createElement("p");
    tema.className = "sesion-tema";
    tema.textContent = sesion.topic;

    const detalle = document.createElement("p");
    detalle.className = "sesion-detalle";
    const fechaBonita = new Date(sesion.date + "T00:00:00").toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    detalle.textContent = fechaBonita + " · " + sesion.minutes + " minutos";

    item.appendChild(tema);
    item.appendChild(detalle);
    lista.appendChild(item);
  }
}

// Calcula los minutos totales de la semana actual (lunes a domingo)
function calcularMinutosSemana(sesiones) {
  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  // Calcular el lunes de esta semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
  const diaSemana = hoyLocal.getDay(); // 0-6
  const offsetLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // si es domingo, retroceder 6 días
  const lunes = new Date(hoyLocal);
  lunes.setDate(lunes.getDate() + offsetLunes);

  // Calcular el domingo de esta semana
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);

  // Convertir a texto para comparar con sesiones[i].date
  const lunesTexto = fechaLocalTexto(lunes);
  const domingoTexto = fechaLocalTexto(domingo);

  let total = 0;
  for (let i = 0; i < sesiones.length; i++) {
    const fechaSesion = sesiones[i].date;
    // Solo sesiones dentro del rango lunes-domingo y no futuras
    if (fechaSesion >= lunesTexto && fechaSesion <= domingoTexto && fechaSesion <= fechaLocalTexto(hoyLocal)) {
      total += sesiones[i].minutes;
    }
  }
  return total;
}

// Muestra los minutos de la semana en pantalla
function mostrarMinutosSemana(sesiones) {
  document.getElementById('minutosSemana').textContent = calcularMinutosSemana(sesiones);
}

// Calcula los días únicos con al menos una sesión en el mes actual (1 a hoy)
function calcularDiasMes(sesiones) {
  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const mesActual = hoyLocal.getMonth();
  const anioActual = hoyLocal.getFullYear();

  const diasConSesion = new Set();

  for (let i = 0; i < sesiones.length; i++) {
    const fechaStr = sesiones[i].date;
    const partes = fechaStr.split("-");
    if (partes.length === 3) {
      const anio = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);

      // Solo si es del mes/año actual y no es fecha futura
      if (anio === anioActual && mes === mesActual) {
        const fechaObj = new Date(anio, mes, dia);
        if (fechaObj.getTime() <= hoyLocal.getTime()) {
          diasConSesion.add(fechaStr);
        }
      }
    }
  }

  return diasConSesion.size;
}

// Muestra los días del mes en pantalla
function mostrarDiasMes(sesiones) {
  document.getElementById('diasMes').textContent = calcularDiasMes(sesiones);
}

// --- Inicio ---

const sesiones = cargarSesiones();

// Por defecto, el campo de fecha muestra hoy
const campoFecha = document.getElementById("fecha");
campoFecha.value = fechaLocalTexto(new Date());

mostrarRacha(sesiones);
mostrarMejorRacha(sesiones);
mostrarMinutosSemana(sesiones);
mostrarDiasMes(sesiones);
mostrarSesiones(sesiones);

// Al enviar el formulario, guardamos la sesión nueva
document.getElementById("formulario").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = document.getElementById("tema").value.trim();
  const minutos = Number(document.getElementById("minutos").value);

  if (fecha === "" || tema === "" || minutos <= 0) {
    document.getElementById("mensaje").textContent = "Revisa los datos: tema obligatorio y minutos mayores que 0.";
    return;
  }

  sesiones.push({
    id: Date.now(),
    date: fecha,
    topic: tema,
    minutes: minutos,
  });

  guardarSesiones(sesiones);
  mostrarRacha(sesiones);
  mostrarMejorRacha(sesiones);
  mostrarMinutosSemana(sesiones);
  mostrarDiasMes(sesiones);
  mostrarSesiones(sesiones);

  // Limpia el formulario y deja el mensaje de confirmación
  document.getElementById("formulario").reset();
  campoFecha.value = fechaLocalTexto(new Date());
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = "¡Sesión guardada! 🎉";
  setTimeout(function () {
    mensaje.textContent = "";
  }, 3000);
});
