const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware para servir archivos estáticos
app.use(express.static("public"));

// Ruta de inicio para el juego
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Array de preguntas para el juego
let preguntas = [
  {
    pregunta: "¿Cuál es la capital de España?",
    respuestas: ["Madrid", "Barcelona", "Sevilla", "Valencia"],
    respuestaCorrecta: "Madrid",
  },
  {
    pregunta: "¿En qué país se encuentra la Torre Eiffel?",
    respuestas: ["Italia", "Francia", "Alemania", "Reino Unido"],
    respuestaCorrecta: "Francia",
  },
  {
    pregunta: "¿Cuál es el río más largo del mundo?",
    respuestas: ["Nilo", "Amazonas", "Misisipi", "Yangtse"],
    respuestaCorrecta: "Amazonas",
  },
];

// Objeto para guardar los jugadores conectados
const jugadores = {};
let preguntaActualIndex = 0;

let temporizador;
const DURACION_TEMPORIZADOR = 10000; // 10 segundos en milisegundos


// Función para obtener una pregunta aleatoria del array de preguntas
function obtenerPreguntaActual() {
  const pregunta = preguntas[preguntaActualIndex];
  preguntaActualIndex = (preguntaActualIndex + 1) % preguntas.length;
   // Iniciar el temporizador
   temporizador = setTimeout(() => {
    // Si el temporizador termina, obtener la siguiente pregunta y enviarla al jugador
    const siguientePregunta = obtenerPreguntaActual();
    io.emit("nuevaPregunta", siguientePregunta);
  }, DURACION_TEMPORIZADOR);
  return pregunta;
}



// Función para comprobar si una respuesta es correcta
function comprobarRespuesta(pregunta, respuesta) {
  return pregunta.respuestaCorrecta === respuesta;
}

// Manejador de eventos para cuando un jugador se conecta
io.on("connection", (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

// Guardar al jugador en el objeto de jugadores
socket.on("nuevoJugador", (nombre) => {
  console.log(`Jugador conectado: ${socket.id} (${nombre})`);

  jugadores[socket.id] = {
    nombre: nombre,
    puntos: 0,
  };
  // Enviar historial de usuarios a todos los clientes
  const historialUsuarios = Object.values(jugadores).map((jugador) => jugador.nombre);
  io.emit("actualizarHistorialUsuarios", historialUsuarios);
});

  // Enviar la pregunta inicial al jugador
  let pregunta = obtenerPreguntaActual();
  socket.emit("nuevaPregunta", pregunta);
  

// Manejador de eventos para cuando un jugador envía una respuesta
socket.on("enviarRespuesta", (respuesta) => {
  const jugador = jugadores[socket.id];

  // Comprobar si la respuesta es correcta
  const esCorrecta = comprobarRespuesta(pregunta, respuesta);

  if (esCorrecta) {
    // Sumar un punto al jugador
    jugador.puntos++;
  } 

 // Cancelar el temporizador actual y obtener una nueva pregunta
 clearTimeout(temporizador);
 pregunta = obtenerPreguntaActual();

  // Enviar una nueva pregunta al jugador
  socket.emit("nuevaPregunta", pregunta);

  // Emitir un evento a todos los jugadores para actualizar la puntuación
  io.emit("actualizarPuntuacion", jugadores);
});


    // Manejador de eventos para cuando un jugador se desconecta
    socket.on("disconnect", () => {
      console.log(`Jugador desconectado: ${socket.id}`);
  
      // Eliminar al jugador del objeto de jugadores
      delete jugadores[socket.id];
       // Enviar historial de usuarios a todos los clientes
    const historialUsuarios = Object.values(jugadores).map((jugador) => jugador.nombre);
    io.emit("actualizarHistorialUsuarios", historialUsuarios);
  
      // Emitir un evento a todos los jugadores para actualizar la puntuación
      io.emit("actualizarPuntuacion", jugadores);
    });
  });
  
  // Iniciar el servidor
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
  

 
