import React, { useState, useEffect } from "react";
import ChessBoard from "./components/ChessBoard/ChessBoard";
import io from "socket.io-client";

const App = () => {
  const [socket, setSocket] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);

  useEffect(() => {
    const newSocket = io("https://chess-royale-server.vercel.app/");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("player_id", (data) => {
      setPlayerId(data);
    });

    newSocket.on("opponent_joined", (data) => {
      setOpponentId(data);
    });

    newSocket.on("game_start", (data) => {
      setPlayerColor(data.color);
    });

    newSocket.on("opponent_move", (data) => {
      console.log(`Opponent moved: ${data.fromX}, ${data.fromY} -> ${data.x}, ${data.y}`);
      setOpponentMove(data); // Store opponent's move in state
    });

    newSocket.on("game_over", (data) => {
      setGameStatus(data.message);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleMove = (fromX, fromY, x, y, promotion) => {
    if (socket) {
      socket.emit("make_move", { fromX, fromY, x, y, promotion });
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-bg_color">
      {gameStatus && <div className="mb-4 mt-10 text-2xl font-bold text-red-600">{gameStatus}</div>}
      <ChessBoard
        playerColor={playerColor}
        onMove={handleMove}
        gameStatus={gameStatus}
        opponentMove={opponentMove}
      />
      {console.log(playerColor)}
    </div>
  );
};

export default App;
