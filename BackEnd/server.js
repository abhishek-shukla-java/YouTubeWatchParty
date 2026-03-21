const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Store rooms
let rooms = {};

const getUser = (roomId, socketId) => {
    return rooms[roomId]?.find(u => u.id === socketId);
};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join room
    socket.on("join_room", ({ roomId, username }) => {
        socket.join(roomId);

        // Create room if not exists
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        // Assign role
        const role = rooms[roomId].length === 0 ? "host" : "participant";

        const user = {
            id: socket.id,
            username,
            role,
        };

        const alreadyExists = rooms[roomId].some(
			(u) => u.id === socket.id
		);

		if (!alreadyExists) {
			rooms[roomId].push(user);
		}

        // Send updated participants
        io.to(roomId).emit("user_joined", {
            participants: rooms[roomId],
        });

        console.log(rooms);
    });
	
	socket.on("play", ({ roomId }) => {
    console.log("PLAY RECEIVED FROM:", socket.id, "ROOM:", roomId);

    const user = getUser(roomId, socket.id);

    if (user?.role !== "host") return;

    console.log("BROADCASTING PLAY TO ROOM:", roomId);

    io.to(roomId).emit("play");
});
	
	socket.on("pause", ({ roomId }) => {
    const user = getUser(roomId, socket.id);

    //  Only host allowed
    if (user?.role !== "host") return;

    io.to(roomId).emit("pause");
});

	socket.on("seek", ({ roomId, time }) => {
		const user = getUser(roomId, socket.id);

		if (user?.role !== "host") return;

		console.log("SEEK RECEIVED:", time);
		console.log("ROOM USERS:", rooms[roomId]);

		socket.to(roomId).emit("seek", { time });
	});
	
	socket.on("change_video", ({ roomId, videoId }) => {
    const user = getUser(roomId, socket.id);

    if (user?.role !== "host") return;

    console.log("VIDEO CHANGE:", videoId);

    io.to(roomId).emit("change_video", { videoId });
	});
	
	socket.on("remove_participant", ({ roomId, userId }) => {
    const user = getUser(roomId, socket.id);

    if (user?.role !== "host") return;

    // remove user from room array
    rooms[roomId] = rooms[roomId].filter(u => u.id !== userId);

    //  FORCE that user to leave socket room
    const targetSocket = io.sockets.sockets.get(userId);
    if (targetSocket) {
        targetSocket.leave(roomId);
        targetSocket.emit("kicked"); // notify user
    }

    io.to(roomId).emit("participant_removed", {
        participants: rooms[roomId],
    });
});

});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});