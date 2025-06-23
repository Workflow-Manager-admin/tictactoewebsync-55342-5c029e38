import React, { useState } from "react";

/**
 * Start, Join, or Reset game panel.
 * PUBLIC_INTERFACE
 */
function GameControls({
  onStart,
  onJoin,
  gameId,
  loading,
  inGame,
  onReset,
  playerName,
  setPlayerName,
  joinGameId,
  setJoinGameId,
}) {
  return (
    <div className="ttt-controls">
      {!inGame ? (
        <div>
          <h3>Start a New Game</h3>
          <input
            placeholder="Your Name"
            value={playerName}
            disabled={loading}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            className="btn btn-large"
            style={{ marginLeft: 8 }}
            onClick={onStart}
            disabled={loading || !playerName}
          >
            {loading ? "Starting..." : "Start Game"}
          </button>
          <div style={{ margin: "24px 0 8px", fontSize: 14, color: "#aaa" }}>
            OR
          </div>
          <h3>Join Existing Game</h3>
          <input
            placeholder="Game ID"
            value={joinGameId}
            disabled={loading}
            onChange={(e) => setJoinGameId(e.target.value)}
          />
          <input
            placeholder="Your Name"
            value={playerName}
            disabled={loading}
            style={{ marginLeft: 8 }}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            className="btn btn-large"
            style={{ marginLeft: 8 }}
            onClick={onJoin}
            disabled={loading || !playerName || !joinGameId}
          >
            {loading ? "Joining..." : "Join Game"}
          </button>
        </div>
      ) : (
        <div>
          <h3>Game ID: <span style={{fontFamily: "monospace"}}>{gameId}</span></h3>
          <button className="btn btn-danger" onClick={onReset} disabled={loading}>
            Leave Game
          </button>
        </div>
      )}
    </div>
  );
}

export default GameControls;
