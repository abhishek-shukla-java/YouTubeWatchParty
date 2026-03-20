import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import ReactPlayer from "react-player";

const socket = io("http://localhost:5000");

function App() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const joinRoom = () => {
    socket.emit("join_room", { roomId, username });
    setJoined(true);
  };

  const handlePlay = () => {
	console.log("Play Clicked");
    socket.emit("play", { roomId });
  };

  const handlePause = () => {
    socket.emit("pause", { roomId });
  };

  useEffect(() => {
  socket.on("play", () => {
    console.log("PLAY RECEIVED");
    setIsPlaying(true);
  });

  socket.on("pause", () => {
    console.log("PAUSE RECEIVED");
    setIsPlaying(false);
  });

  return () => {
    socket.off("play");
    socket.off("pause");
  };
}, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {!joined ? (
        <>
          <h2>Join Room</h2>
          <input
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <br /><br />
          <input
            placeholder="Room ID"
            onChange={(e) => setRoomId(e.target.value)}
          />
          <br /><br />
          <button onClick={joinRoom}>Join</button>
        </>
      ) : (
        <>
          <h2>Room: {roomId}</h2>

          <ReactPlayer
  url="https://www.youtube.com/watch?v=jNQXAC9IVRw"
  playing={isPlaying}  
  controls
  onPlay={() => socket.emit("play", { roomId })}   // ✅ ADD BACK
  onPause={() => socket.emit("pause", { roomId })} // ✅ ADD BACK
/>

          <br /><br />
		  <button onClick={() => setIsPlaying(true)}>Test Play</button>
        </>
      )}
    </div>
  );
}

export default App;