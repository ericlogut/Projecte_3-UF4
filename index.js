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


var nombres = [];

// Array de preguntas para el juego
// Preguntas del JSON
const preguntasJSONLOL = require('./preguntes/preguntasLOL.json');
const preguntasJSONGEN = require('./preguntes/preguntasGEN.json');
const preguntasJSONMC = require('./preguntes/preguntasMC.json');

var preguntas = preguntasJSONLOL.Preguntas;
// Objeto para guardar los jugadores conectados
const jugadores = {};
var pregunta = {};
let preguntaActualIndex = 0;

// Función para obtener una pregunta aleatoria del array de preguntas
function obtenerPreguntaActual() {
  pregunta = preguntas[preguntaActualIndex];
  preguntaActualIndex = (preguntaActualIndex + 1) % preguntas.length;
  return pregunta;
}

// Función para comprobar si una respuesta es correcta
function comprobarRespuesta(respostaComparar, respuesta) {
  return respostaComparar == respuesta; // Manejador de eventos para cuando un jugador se conecta
}

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

socket.on("preguntasSeleccion", (seleccionado) => {
  if (seleccionado == "LOL") {
    preguntas = preguntasJSONLOL.Preguntas;
  } else if (seleccionado == "GEN") {
    preguntas = preguntasJSONGEN.Preguntas;
  } else if (seleccionado == "MC") {
    preguntas = preguntasJSONMC.Preguntas;
  }
});

socket.on("comprovarNombre", (nombre) => {
  if (nombres.includes(nombre)) {
    io.emit("nombreRepetido", true)
  } else {
    nombres.push(nombre);
    io.emit("nombreRepetido", false)
  }
});

// Manejador de eventos para cuando un jugador envía una respuesta
socket.on("enviarRespuesta", (respuesta, respostaComparar) => {
  const jugador = jugadores[socket.id];
  // Comprobar si la respuesta es correcta
  const esCorrecta = comprobarRespuesta(respostaComparar, respuesta);

  if (esCorrecta) {
    // Sumar un punto al jugador
    jugador.puntos++;
    socket.emit("SoundCorrect");
  } else {
    socket.emit("SoundIncorrect");
  }
 // Obtener una nueva pregunta y actualizar la variable preguntaActual
   pregunta = obtenerPreguntaActual();

  // Enviar una nueva pregunta al jugador
  socket.emit("nuevaPregunta", pregunta);

  // Emitir un evento a todos los jugadores para actualizar la puntuación
  io.emit("actualizarPuntuacion", jugadores);
});

socket.on('start', () => {
  // Enviar la pregunta inicial al jugador
  let preguntaParaUsar = obtenerPreguntaActual();
  io.emit("nuevaPregunta", preguntaParaUsar);
  io.emit('mostrarPreguntaYRespuestas');

  const timer = setInterval(() => {
    console.log('Temporizador iniciado!');
    
    // Enviamos la señal al  cliente cuando el temporizador ha terminado
    io.emit('timerEnded', jugadores);
    
    // Limpiamos el temporizador después de un minuto
    clearInterval(timer);
  }, 60000);

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
      socket.emit("actualizarPuntuacion", jugadores);
    });
  });
  
  
  // Iniciar el servidor
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
  

 
