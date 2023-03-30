const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));
// Hola
const io = new Server(httpServer, {});

io.on("connection", (socket) => {
  
    
    socket.on("disconnect",function() {
        console.log("usuari desconnectat");
    })
});

httpServer.listen(3000, ()=>
    console.log(`Server listening at http://localhost:3000`)
);

