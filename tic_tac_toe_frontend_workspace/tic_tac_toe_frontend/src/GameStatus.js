import React from "react";

/**
 * Displays whose turn, winner, or draw notifications.
 * PUBLIC_INTERFACE
 */
function GameStatus({ status, currentPlayer, players, nextTurn, winner, draw }) {
  return (
    <div className="ttt-status">
      <div>
        <b>Status:</b> {status}
      </div>
      {players && players.length > 0 &&
          <div style={{ marginTop: 8 }}>
            <b>Players:</b>
            <ul style={{margin: "2px 0 4px 16px"}}>
              {players.map(p => (
                <li key={p.player_id}>
                  {p.name} ({p.symbol}) {nextTurn === p.player_id ? "← current turn" : ""}
                </li>
              ))}
            </ul>
          </div>
      }
      {draw && <div className="ttt-draw" style={{ color: "#888", marginTop: 8 }}>Game ended in a draw.</div>}
      {winner && !draw && <div className="ttt-win" style={{ color: "#ff3838", marginTop: 8 }}>{winner} wins!</div>}
      {!winner && !draw && nextTurn && (
        <div className="ttt-turn" style={{ color: "#2d88ff", marginTop: 8 }}>
          {(() => {
            const plr = players?.find(p => p.player_id === nextTurn);
            return plr ? `It's ${plr.name}'s (${plr.symbol}) turn` : "";
          })()}
        </div>
      )}
    </div>
  );
}

export default GameStatus;
