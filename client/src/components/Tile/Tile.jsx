import React from "react";

const Tile = ({ image, isWhite, highlight, onClick, playerColor }) => {
  return (
    <div
      className={`w-full h-full ${isWhite ? "bg-light_tile" : "bg-dark_tile"} ${
        highlight ? "border-4 border-zinc-400" : ""
      } ${playerColor === "black" ? "rotate-180" : ""}`}
      onClick={onClick}
    >
      {image && <img src={image} alt="chess piece" className="w-full h-full" />}
    </div>
  );
};

export default Tile;
