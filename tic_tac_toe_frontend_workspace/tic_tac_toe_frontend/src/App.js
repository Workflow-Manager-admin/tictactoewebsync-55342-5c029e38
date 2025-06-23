import React, { useState, useCallback } from "react";
import "./App.css";
import GameBoard from "./GameBoard";
import GameControls from "./GameControls";
import GameStatus from "./GameStatus";
import MoveHistory from "./MoveHistory";
import Notification from "./Notification";

// tic tac toe API host -- modify if backend runs on a different URL or proxied.
const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:3001";

/**
 * Top-level component for the Tic Tac Toe frontend.
 * PUBLIC_INTERFACE
 */
function App() {
  // Game/session state
  const [gameId, setGameId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinGameId, setJoinGameId] = useState("");
  const [loading, setLoading] = useState(false);

  // API-driven board state
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [players, setPlayers] = useState([]);
  const [moves, setMoves] = useState([]);
  const [nextTurn, setNextTurn] = useState(null);
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] = useState(false);
  const [status, setStatus] = useState("Ready");

  // UX
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --- API calls ---
  const showError = (e) => {
    setError(typeof e === "string" ? e : (e.message || "Unknown error"));
    setTimeout(() => setError(""), 3200);
  };
  const updateFromState = (game) => {
    setGameId(game.game_id || "");
    setBoard(game.board || [[null,null,null],[null,null,null],[null,null,null]]);
    setPlayers(game.players || []);
    setNextTurn(game.next_turn || null);
    setWinner(game.winner || null);
    setDraw(game.draw || false);
    setStatus(game.status || "");
    // Move history management - will be kept client-side.
    if (!game.board || !game.players) setMoves([]);
  };

  // PUBLIC_INTERFACE
  const startGame = async () => {
    if (!playerName) { showError("Enter your name."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_HOST}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: playerName }),
      });
      if (!res.ok) throw new Error(`Start failed (${res.status})`);
      const data = await res.json();
      setMessage("Game created! Share the Game ID to invite an opponent.");
      setPlayerId(data.players[0].player_id);
      updateFromState(data);
      setMoves([]);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const joinGame = async () => {
    if (!playerName || !joinGameId) { showError("Enter game ID and name."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_HOST}/games/${joinGameId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: playerName }),
      });
      if (!res.ok) throw new Error(`Join failed (${res.status})`);
      const data = await res.json();
      setMessage("Joined game!");
      setPlayerId(data.players[1]?.player_id); // Both players should now be present.
      updateFromState(data);
      setGameId(joinGameId);
      setMoves([]);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const makeMove = async (row, col) => {
    // Only allow moves if it's your turn
    if (!gameId || !playerId || row === undefined || col === undefined) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_HOST}/games/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, row, col }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.[0]?.msg || "Invalid move");
      }
      const data = await res.json();
      setMessage("Move registered!");
      updateFromState(data);
      // Add to move history
      const plr = (players || []).find(p => p.player_id === playerId);
      setMoves((prevMoves) => [
        ...prevMoves,
        { player_name: plr?.name || "Player", symbol: plr?.symbol || "?", row, col },
      ]);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_HOST}/games/${gameId}`);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data = await res.json();
      updateFromState(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  const resetGame = () => {
    // Clear state to return to entry screen
    setGameId("");
    setPlayerId("");
    setPlayerName("");
    setJoinGameId("");
    setBoard([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
    setPlayers([]);
    setMoves([]);
    setNextTurn(null);
    setWinner(null);
    setDraw(false);
    setStatus("Ready");
    setError("");
    setMessage("");
  };

  // --- UI render ---
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div className="logo">
              <span className="logo-symbol">*</span> Tic-Tac-Toe
            </div>
            {gameId && (
              <button className="btn" onClick={fetchGame}>
                Refresh Game State
              </button>
            )}
          </div>
        </div>
      </nav>
      <main>
        <div className="container">

          <div className="main-ttt-area">
            <div className="ttt-panel" style={{ minWidth: 340 }}>
              <Notification message={error} type="error" />
              <Notification message={message} type="" />
              <GameControls
                onStart={startGame}
                onJoin={joinGame}
                gameId={gameId}
                loading={loading}
                inGame={!!gameId}
                onReset={resetGame}
                playerName={playerName}
                setPlayerName={setPlayerName}
                joinGameId={joinGameId}
                setJoinGameId={setJoinGameId}
              />
              {gameId && (
                <>
                  <GameStatus
                    status={status}
                    currentPlayer={playerId}
                    players={players}
                    nextTurn={nextTurn}
                    winner={winner}
                    draw={draw}
                  />
                  <GameBoard
                    board={board}
                    onCellClick={makeMove}
                    disabled={loading || !gameId || !!winner || draw || nextTurn !== playerId}
                  />
                  {winner || draw ? (
                    <button className="btn btn-large" style={{ marginTop: 18 }} onClick={resetGame}>
                      {draw ? "Restart" : "Play Again"}
                    </button>
                  ) : null}
                </>
              )}
            </div>
            <div className="ttt-panel" style={{ minWidth: 180 }}>
              <MoveHistory moves={moves} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;