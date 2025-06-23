import React from "react";

/**
 * Shows flat history of moves (optional).
 * PUBLIC_INTERFACE
 */
function MoveHistory({ moves }) {
  return (
    <div className="ttt-history">
      <h3>Move History</h3>
      <ol>
        {(moves && moves.length > 0) ? (
          moves.map((move, idx) => (
            <li key={idx}>
              {move.desc || (
                <>
                  {move.player_name} ({move.symbol}) → [{move.row + 1},{move.col + 1}]
                </>
              )}
            </li>
          ))
        ) : (
          <div style={{ color: "#aaa" }}>No moves yet.</div>
        )}
      </ol>
    </div>
  );
}

export default MoveHistory;
