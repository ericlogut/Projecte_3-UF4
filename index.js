const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));
// Hola
const io = new Server(httpServer, {});

var idInterval = setInterval(enviar, 5000);

function enviar() {
    console.log("Enviant missatge")
    io.emit("time",{"message": "Mañana hay examen"});
}




var usuaris = [];

io.on("connection", (socket) => {
  
    console.log('Connectat un client...')

    socket.on("nickname", function(data) {
            console.log(data.nickname)
            
            socket.data.nickname = data.nickname;
            // respondre al que ha enviat
            socket.emit("nickname rebut",{"response":"ok"})

            // respondre a la resta de clients menys el que ha enviat
            socket.broadcast.emit("nickname rebut",{"response":data.nickname});

            // Totes les funcions disponibles les tenim a
            //  https://socket.io/docs/v4/emit-cheatsheet/

            io.on("connection", (socket) => {
                const users = [];
                for (let [id, socket] of io.of("/").sockets) {
                  users.push({
                    userID: id,
                    username: socket.username,
                  });
                }
                socket.emit("users", users);
                // ...
              });
            
    })
    socket.on("disconnect",function() {
        console.log("usuari desconnectat");
    })
});

httpServer.listen(3000, ()=>
    console.log(`Server listening at http://localhost:3000`)
);

