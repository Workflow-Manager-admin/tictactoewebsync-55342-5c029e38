import React from "react";
import "./App.css";

/**
 * Shows a 3x3 Tic Tac Toe board.
 * Handles click events to place moves.
 * PUBLIC_INTERFACE
 */
function GameBoard({ board, onCellClick, disabled }) {
  return (
    <div className="ttt-board">
      {board.map((row, rIdx) => (
        <div className="ttt-row" key={rIdx}>
          {row.map((cell, cIdx) => (
            <button
              key={cIdx}
              className="ttt-cell"
              onClick={() => !disabled && onCellClick(rIdx, cIdx)}
              disabled={!!cell || disabled}
              aria-label={`row ${rIdx + 1} col ${cIdx + 1}`}
            >
              {cell}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default GameBoard;
