import { useState, useEffect } from "react";
import socket from "./socket";
import YouTube from "react-youtube";

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [joined, setJoined] = useState(false);
  const [videoId, setVideoId] = useState("M7lc1UVf-VE");
  const [player, setPlayer] = useState(null);
  const [myRole, setMyRole] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const joinRoom = () => {
  if (username && roomId && !joined) {
    socket.emit("join_room", { roomId, username });
    setJoined(true); // prevent duplicate
  }
};



	const onPlayerReady = (event) => {
  setPlayer(event.target);
  if (myRole !== "host") {
    event.target.pauseVideo();
  }
};

const handlePlay = () => {
  console.log("Sending play event:", roomId); // debug
  socket.emit("play", { roomId });
};

const handlePause = () => {
  console.log("Sending pause event:", roomId);
  socket.emit("pause", { roomId });
};

const handleSeek = () => {
  if (player && myRole === "host") {
    const currentTime = player.getCurrentTime();
    console.log("Sending seek:", currentTime);
    socket.emit("seek", { roomId, time: currentTime });
  }
};

const extractVideoId = (url) => {
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0];
  }

  if (url.includes("watch?v=")) {
    return url.split("v=")[1].split("&")[0];
  }

  return url; // fallback
};

const handleChangeVideo = () => {
  const id = extractVideoId(videoUrl);

  console.log("Changing video to:", id);

  socket.emit("change_video", { roomId, videoId: id });
};

const removeUser = (userId) => {
  socket.emit("remove_participant", { roomId, userId });
};

  // Listen for updates from server
  useEffect(() => {
    socket.on("user_joined", (data) => {
  setParticipants(data.participants);

  const me = data.participants.find(
    (user) => user.id === socket.id
  );

  if (me) {
    setMyRole(me.role);
  }
});

    return () => socket.off("user_joined");
  }, []);
  
  useEffect(() => {
  socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  return () => {
    socket.off("connect");
    socket.off("disconnect");
  };
}, []);

useEffect(() => {
  socket.on("connect", () => {
    if (joined) {
      socket.emit("join_room", { roomId, username });
      console.log("Rejoined room");
    }
  });

  return () => socket.off("connect");
}, [joined, roomId, username]);
  
  useEffect(() => {
  socket.on("play", () => {
    console.log("Play event received"); 
    if (player) player.playVideo();
  });

  socket.on("pause", () => {
    if (player) player.pauseVideo();
  });

  return () => {
    socket.off("play");
    socket.off("pause");
  }
 },[player]);
  
  useEffect(() => {
  socket.on("seek", ({ time }) => {
    console.log("Seek received:", time);

    //  delay to ensure player ready
    setTimeout(() => {
      if (player) {
        player.seekTo(time, true);
      }
    }, 500);
  });

  return () => {
    socket.off("seek");
  }; 
}, [player]);

useEffect(() => {
  socket.on("change_video", ({ videoId }) => {
    console.log("New video received:", videoId);
    setVideoId(videoId);
  });

  return () => socket.off("change_video");
}, []);

useEffect(() => {
  socket.on("participant_removed", (data) => {
    setParticipants(data.participants);
  });

  return () => socket.off("participant_removed");
}, []);

useEffect(() => {
  if (myRole !== "host" || !player) return;

  const interval = setInterval(() => {
    const currentTime = player.getCurrentTime();
    socket.emit("seek", { roomId, time: currentTime });
  }, 2000);

  return () => clearInterval(interval);
}, [player, myRole, roomId]);

useEffect(() => {
  socket.on("kicked", () => {
    alert("You were removed by host");
    setJoined(false);
	setParticipants([]);
	setVideoId("");
  });

  return () => socket.off("kicked");
}, []);

  return (
  <div className="min-h-screen bg-black text-white">

    {/* HEADER */}
    <div className="p-4 border-b border-gray-700 text-xl font-semibold">
      🎬 YouTube Watch Party
    </div>

    {/* JOIN SCREEN */}
    {!joined && (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="bg-gray-900 p-8 rounded-xl w-96 text-center shadow-lg">

          <h2 className="text-2xl mb-6">Join Room</h2>

          <input
            type="text"
            placeholder="Enter Username"
            className="w-full p-3 mb-4 rounded bg-gray-800"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter Room ID"
            className="w-full p-3 mb-4 rounded bg-gray-800"
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button
            onClick={joinRoom}
            className="bg-red-600 hover:bg-red-700 w-full py-2 rounded"
          >
            Join Party
          </button>
        </div>
      </div>
    )}

    {/* MAIN APP */}
    {joined && (
      <div className="flex h-[90vh]">

        {/* LEFT SIDEBAR */}
        <div className="w-1/4 bg-gray-900 border-r border-gray-700 p-4">

          <h2 className="text-lg mb-4 font-semibold">Participants</h2>

          <ul className="space-y-2">
            {participants.map((user) => (
              <li
                key={user.id}
                className="flex justify-between items-center bg-gray-800 p-2 rounded"
              >
                <span>
                  {user.username} ({user.role})
                </span>

                {myRole === "host" && user.id !== socket.id && (
                  <button
                    onClick={() => removeUser(user.id)}
                    className="text-red-400 text-sm"
                  >
                    ❌
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* CHANGE VIDEO */}
          {myRole === "host" && (
            <div className="mt-6">
              <input
                type="text"
                placeholder="Paste YouTube URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-2 rounded bg-gray-800"
              />

              <button
                onClick={handleChangeVideo}
                className="bg-blue-600 w-full mt-2 py-2 rounded"
              >
                Change Video
              </button>
            </div>
          )}
        </div>

        {/* VIDEO SECTION */}
        <div className="flex-1 flex flex-col items-center justify-center">

          <div className="w-full max-w-4xl">

            <YouTube
              key={videoId}
              videoId={videoId}
              onReady={onPlayerReady}
              opts={{
                width: "100%",
                height: "500",
                playerVars: { controls: myRole === "host" ? 1 : 0, 
					disablekb: 1,
					autoplay:0,
				},
              }}
            />

            {/* CONTROLS */}
            <div className="mt-4 flex justify-center gap-6">

              <button
                onClick={handlePlay}
                disabled={myRole !== "host"}
                className="bg-green-600 px-6 py-2 rounded text-lg"
              >
                ▶ Play
              </button>

              <button
                onClick={handlePause}
                disabled={myRole !== "host"}
                className="bg-yellow-500 px-6 py-2 rounded text-lg"
              >
                ⏸ Pause
              </button>

            </div>

          </div>

        </div>

      </div>
    )}
  </div>
);
}

export default App;