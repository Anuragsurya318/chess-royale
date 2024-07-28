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

export default function ChessBoard({ playerColor, onMove, setGameStatus, opponentMove }) {
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

  useEffect(() => {
    if (opponentMove) {
      const { fromX, fromY, x, y, promotion } = opponentMove;
      const updatedPieces = pieces
        .map((p) => {
          if (p.x === fromX && p.y === fromY) {
            return { ...p, x, y, type: promotion || p.type };
          } else if (p.x === x && p.y === y) {
            return null;
          } else {
            return p;
          }
        })
        .filter(Boolean);

      setPieces(updatedPieces);
      setCurrentTurn(currentTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR);
    }
  }, [opponentMove]);

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

          if (piece.type === PieceType.PAWN && (y === 0 || y === 7)) {
            setPromotionPawn(piece);
          }
          results.push(piece);
        } else if (!(piece.x === x && piece.y === y)) {
          results.push(piece);
        }
        return results;
      }, []);
      setPieces(updatedPieces);
      setSelectedPosition(null);
      setHighlightedPositions([]);
      setCurrentTurn(currentTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR);

      onMove(selectedPosition.x, selectedPosition.y, x, y, promotionPawn?.type);
    }
  }

  function promotePawn(type) {
    if (promotionPawn) {
      const updatedPieces = pieces.map((p) => {
        if (p.x === promotionPawn.x && p.y === promotionPawn.y) {
          const newPiece = { ...p, type };
          switch (type) {
            case PieceType.QUEEN:
              newPiece.image = p.team === TeamType.OUR ? wq : bq;
              break;
            case PieceType.ROOK:
              newPiece.image = p.team === TeamType.OUR ? wr : br;
              break;
            case PieceType.BISHOP:
              newPiece.image = p.team === TeamType.OUR ? wb : bb;
              break;
            case PieceType.KNIGHT:
              newPiece.image = p.team === TeamType.OUR ? wn : bn;
              break;
            default:
              break;
          }
          return newPiece;
        }
        return p;
      });
      setPieces(updatedPieces);
      setPromotionPawn(null);
      modalRef.current.style.display = "none";
      setCurrentTurn(currentTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR);
    }
  }

  const board = [];
  for (let j = VERTICAL_AXIS.length - 1; j >= 0; j--) {
    for (let i = 0; i < HORIZONTAL_AXIS.length; i++) {
      const number = j + i + 2;
      const piece = pieces.find((p) => p.x === i && p.y === j);
      let image = undefined;
      if (piece) {
        image = piece.image;
      }
      let highlight = highlightedPositions.some((pos) => pos.x === i && pos.y === j);
      board.push(
        <Tile
          key={`${j},${i}`}
          image={image}
          isWhite={number % 2 === 0}
          highlight={highlight}
          onClick={(e) => handleClickPiece(e, i, j)}
          playerColor={playerColor}
        />
      );
    }
  }

  return (
    <>
      <div
        ref={modalRef}
        className="absolute z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 hidden"
      >
        <div className="w-1/2 h-1/2 bg-white rounded-lg flex flex-col justify-around items-center">
          <h2 className="text-2xl font-bold">Choose promotion</h2>
          <div className="flex justify-around w-full">
            <img
              src={playerColor === TeamType.OUR ? wq : bq}
              alt="queen"
              className="w-16 h-16 cursor-pointer"
              onClick={() => promotePawn(PieceType.QUEEN)}
            />
            <img
              src={playerColor === TeamType.OUR ? wr : br}
              alt="rook"
              className="w-16 h-16 cursor-pointer"
              onClick={() => promotePawn(PieceType.ROOK)}
            />
            <img
              src={playerColor === TeamType.OUR ? wb : bb}
              alt="bishop"
              className="w-16 h-16 cursor-pointer"
              onClick={() => promotePawn(PieceType.BISHOP)}
            />
            <img
              src={playerColor === TeamType.OUR ? wn : bn}
              alt="knight"
              className="w-16 h-16 cursor-pointer"
              onClick={() => promotePawn(PieceType.KNIGHT)}
            />
          </div>
        </div>
      </div>
      <div
        ref={chessboardRef}
        className={`grid grid-cols-8 grid-rows-8 w-full max-w-lg mx-auto mt-10 ${
          playerColor === "black" ? "rotate-180" : ""
        }`}
      >
        {board}
      </div>
    </>
  );
}
