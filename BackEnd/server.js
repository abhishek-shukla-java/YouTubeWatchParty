// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {}; // store rooms

io.on("connection", (socket) => {

  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { users: [], host: socket.id };
    }

    rooms[roomId].users.push({
      id: socket.id,
      username
    });

    io.to(roomId).emit("user_joined", rooms[roomId]);
  });

  socket.on("play", ({ roomId }) => {
	console.log("PLAY EVENT RECEIVED:", roomId);
    io.to(roomId).emit("play");
  });

  socket.on("pause", ({ roomId }) => {
    io.to(roomId).emit("pause");
  });
  
  socket.on("seek", ({ roomId, time }) => {
  socket.to(roomId).emit("seek", { time });
  });
  
  socket.on("change_video", ({ roomId, videoId }) => {
  socket.to(roomId).emit("change_video", { videoId });
  });

});

server.listen(5000, () => console.log("Server running"));