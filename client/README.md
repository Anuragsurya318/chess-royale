below is my App.jsx file code
import React, { useEffect, useState } from "react";
import ChessBoard from "./components/ChessBoard/ChessBoard";

const App = () => {
const [gameStatus, setGameStatus] = useState(null);

const handleOfferDraw = () => {
if (window.confirm("Do you agree to a draw?")) {
setGameStatus("Draw");
}
};

const handleResign = (team) => {
const opponent = team === "White" ? "Black" : "White";
if (window.confirm(`Are you sure you want to resign?`)) {
setGameStatus(`${opponent} wins by resignation`);
}
};

return (
<div className="w-screen h-screen lg:h-auto flex flex-col items-center  justify-center bg-bg_color">
{gameStatus && <div className="mb-4 mt-10 text-2xl font-bold text-red-600">{gameStatus}</div>}
<ChessBoard setGameStatus={setGameStatus} />
<div className="space-x-2 flex my-20 sm:my-10">
<button
          onClick={handleOfferDraw}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-black font-bold rounded"
        >
Offer Draw
</button>
<button
onClick={() => handleResign("White")}
className="px-4 py-2 bg-red-500 hover:bg-red-600 text-black font-bold rounded" >
Resign (White)
</button>
<button
onClick={() => handleResign("Black")}
className="px-4 py-2 bg-red-500 hover:bg-red-600 text-black font-bold rounded" >
Resign (Black)
</button>
</div>
</div>
);
};

export default App;

below is my ChessBoard.jsx file code
import React, { useRef, useState, useEffect } from "react";
import Tile from "../Tile/Tile";
import Referee from "../../referee/Referee";
import {
VERTICAL_AXIS,
HORIZONTAL_AXIS,
GRID_SIZE,
PieceType,
TeamType,
initialBoardState,
} from "../../Constants";
import { wb, wn, wq, wr, bb, bn, bq, br } from "../../assets/index.js";

export default function ChessBoard({ setGameStatus }) {
const [activePiece, setActivePiece] = useState(null);
const [selectedPosition, setSelectedPosition] = useState(null);
const [promotionPawn, setPromotionPawn] = useState(null);
const [pieces, setPieces] = useState(initialBoardState);
const [highlightedPositions, setHighlightedPositions] = useState([]);
const [currentTurn, setCurrentTurn] = useState(TeamType.OUR); // Start with our team (White)
const chessboardRef = useRef(null);
const modalRef = useRef(null);
const referee = new Referee();

useEffect(() => {
if (promotionPawn) {
modalRef.current.style.display = "flex";
} else {
modalRef.current.style.display = "none";
}
}, [promotionPawn]);

useEffect(() => {
const checkGameStatus = () => {
if (referee.isCheckmate(currentTurn, pieces)) {
setTimeout(() => {
setGameStatus(`${currentTurn === TeamType.OUR ? "Black" : "White"} won by checkmate!`);
}, 1000);
} else if (referee.isStalemate(currentTurn, pieces)) {
setTimeout(() => {
setGameStatus("The game is a stalemate!");
}, 1000);
}
};

    checkGameStatus();

}, [pieces, currentTurn]);

function handleClickPiece(e, x, y) {
const piece = pieces.find((p) => p.x === x && p.y === y);

    if (piece && piece.team === currentTurn) {
      if (selectedPosition && selectedPosition.x === x && selectedPosition.y === y) {
        setSelectedPosition(null);
        setHighlightedPositions([]);
      } else {
        setSelectedPosition({ x, y });
        updateValidMoves(piece);
      }
    } else if (selectedPosition) {
      movePiece(x, y);
    }

}

function updateValidMoves(piece) {
if (piece && piece.team === currentTurn) {
const validMoves = referee.getValidMoves(piece, pieces);
setHighlightedPositions(validMoves);
} else {
setHighlightedPositions([]);
}
}

function movePiece(x, y) {
if (!selectedPosition) return;

    const currentPiece = pieces.find(
      (p) => p.x === selectedPosition.x && p.y === selectedPosition.y
    );
    const validMove = highlightedPositions.some((pos) => pos.x === x && pos.y === y);

    if (currentPiece && currentPiece.team === currentTurn && validMove) {
      const updatedPieces = pieces.reduce((results, piece) => {
        if (piece.x === selectedPosition.x && piece.y === selectedPosition.y) {
          if (Math.abs(selectedPosition.y - y) === 2 && piece.type === PieceType.PAWN) {
            piece.enPassant = true;
          } else {
            piece.enPassant = false;
          }
          piece.x = x;
          piece.y = y;

          if (piece.type === PieceType.KING) {
            piece.hasMoved = true;
            if (Math.abs(selectedPosition.x - x) === 2) {
              const rookX = x > selectedPosition.x ? x - 1 : x + 1;
              const rook = pieces.find(
                (p) =>
                  p.x === (x > selectedPosition.x ? 7 : 0) &&
                  p.y === y &&
                  p.type === PieceType.ROOK &&
                  p.team === piece.team
              );
              if (rook) {
                rook.x = rookX;
                rook.hasMoved = true;
              }
            }
          }
          if (piece.type === PieceType.ROOK) {
            piece.hasMoved = true;
          }

          let promotionRow = piece.team === TeamType.OUR ? 7 : 0;

          if (piece.type === PieceType.PAWN && y === promotionRow) {
            setPromotionPawn(piece);
          }

          results.push(piece);
        } else if (!(piece.x === x && piece.y === y)) {
          if (piece.type === PieceType.PAWN) {
            piece.enPassant = false;
          }
          results.push(piece);
        }
        return results;
      }, []);

      setPieces(updatedPieces);
      setHighlightedPositions([]);
      setSelectedPosition(null);
      setCurrentTurn(currentTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR);
    }

}

function promotePawn(pieceType) {
if (promotionPawn === null) return;
const updatedPieces = pieces.reduce((results, piece) => {
if (piece.x === promotionPawn.x && piece.y === promotionPawn.y) {
piece.type = pieceType;
piece.image =
piece.team === TeamType.OUR
? pieceType === PieceType.ROOK
? wr
: pieceType === PieceType.BISHOP
? wb
: pieceType === PieceType.KNIGHT
? wn
: wq
: pieceType === PieceType.ROOK
? br
: pieceType === PieceType.BISHOP
? bb
: pieceType === PieceType.KNIGHT
? bn
: bq;
}
results.push(piece);
return results;
}, []);

    setPieces(updatedPieces);
    setPromotionPawn(null);
    modalRef.current.classList.add("hidden");

}

const board = [];

for (let j = VERTICAL_AXIS.length - 1; j >= 0; j--) {
for (let i = 0; i < HORIZONTAL_AXIS.length; i++) {
const number = j + i + 2;
let image = undefined;

      pieces.forEach((p) => {
        if (p.x === i && p.y === j) {
          image = p.image;
        }
      });

      const highlight = highlightedPositions.some((p) => p.x === i && p.y === j);

      const isWhite = number % 2 === 0;
      board.push(
        <Tile
          key={`${j},${i}`}
          image={image}
          isWhite={isWhite}
          highlight={highlight}
          onClick={(e) => handleClickPiece(e, i, j)}
        />
      );
    }

}

return (
<>
<div
        id="pawn-promotion-modal"
        ref={modalRef}
        className="absolute top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center select-none hidden"
      >
<div className="modal-body w-[90vw] h-[30vw] sm:w-[550px] sm:h-[225px] z-50 top-1/2 sm:top-48 transform sm:transform-none -translate-y-1/2 bg-[rgba(0,0,0,0.4)] flex justify-center items-center">
{promotionPawn?.team === TeamType.OUR ? (
<>
<img
src={wr}
onClick={() => promotePawn(PieceType.ROOK)}
alt="White Rook"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.2)] rounded-full cursor-pointer"
/>
<img
src={wb}
onClick={() => promotePawn(PieceType.BISHOP)}
alt="White Bishop"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.2)] rounded-full cursor-pointer"
/>
<img
src={wn}
onClick={() => promotePawn(PieceType.KNIGHT)}
alt="White Knight"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.2)] rounded-full cursor-pointer"
/>
<img
src={wq}
onClick={() => promotePawn(PieceType.QUEEN)}
alt="White Queen"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.2)] rounded-full cursor-pointer"
/>
</>
) : (
<>
<img
src={br}
onClick={() => promotePawn(PieceType.ROOK)}
alt="Black Rook"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.1)] rounded-full cursor-pointer"
/>
<img
src={bb}
onClick={() => promotePawn(PieceType.BISHOP)}
alt="Black Bishop"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.1)] rounded-full cursor-pointer"
/>
<img
src={bn}
onClick={() => promotePawn(PieceType.KNIGHT)}
alt="Black Knight"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.1)] rounded-full cursor-pointer"
/>
<img
src={bq}
onClick={() => promotePawn(PieceType.QUEEN)}
alt="Black Queen"
className="h-16 sm:h-36 hover:bg-[rgba(255,255,255,0.1)] rounded-full cursor-pointer"
/>
</>
)}
</div>
</div>
<div
        id="chessboard"
        ref={chessboardRef}
        className="w-full h-[90vw] sm:w-[550px] sm:h-[550px] flex flex-wrap relative transform mt-5 "
      >
{board}
</div>
</>
);
}

below is my Tile.jsx file code
import React from "react";

const Tile = ({ isWhite, image, highlight, onClick }) => {
return (
<div
className={`tile w-[12.5%] h-[12.5%] ${
        isWhite ? "bg-light_tile" : "bg-dark_tile"
      } flex items-center justify-center bg-cover bg-center bg-no-repeat ${
        highlight ? "border-4 border-yellow-500" : ""
      }`}
onClick={onClick} >
{image && (
<div
style={{ backgroundImage: `url(${image})` }}
className="chess-piece w-full h-full bg-cover bg-center" ></div>
)}
</div>
);
};

export default Tile;

im using tailwindcss, write a backend code for this i want to implement multiplayer chess game using socket.io and node.js use cors, express and nodemon for the backend. for now be default im white and i can move both the pieces make sure if i join first i will be white and i then should not be able to move black pieces and if i join second i will be black and i should not be able to move white pieces. i want to implement this feature in my code. when i make a move send the move to the other player and update the board accordingly similarly when the other player makes a move update the board accordingly
