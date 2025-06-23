from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body, Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid


# PUBLIC_INTERFACE
class NewGameRequest(BaseModel):
    player_name: str = Field(..., description="Name of player creating the game.")


# PUBLIC_INTERFACE
class JoinGameRequest(BaseModel):
    player_name: str = Field(..., description="Name of player joining the game.")


# PUBLIC_INTERFACE
class MoveRequest(BaseModel):
    player_id: str = Field(..., description="Player's unique ID.")
    row: int = Field(..., ge=0, le=2, description="Row index (0-2) of the move.")
    col: int = Field(..., ge=0, le=2, description="Column index (0-2) of the move.")


# PUBLIC_INTERFACE
class PlayerState(BaseModel):
    player_id: str
    name: str
    symbol: str


# PUBLIC_INTERFACE
class GameStateResponse(BaseModel):
    game_id: str
    board: List[List[Optional[str]]]
    players: List[PlayerState]
    next_turn: Optional[str] = None
    status: str
    winner: Optional[str] = None
    draw: bool = False


# PUBLIC_INTERFACE
class GameSummary(BaseModel):
    game_id: str
    status: str
    players: List[str]
    next_turn: Optional[str] = None


# --- In-memory store (for development/demo only)
class Game:
    def __init__(self, creator_name: str):
        self.game_id = str(uuid.uuid4())
        self.board = [[None for _ in range(3)] for _ in range(3)]
        player_id = str(uuid.uuid4())
        self.players = [
            {"player_id": player_id, "name": creator_name, "symbol": "X"}
        ]
        self.status = "waiting"  # waiting, in_progress, finished
        self.next_turn = player_id
        self.moves = 0
        self.winner = None
        self.draw = False

    def add_player(self, name: str):
        if len(self.players) >= 2:
            raise ValueError("Game is already full.")
        player_id = str(uuid.uuid4())
        self.players.append({"player_id": player_id, "name": name, "symbol": "O"})
        self.status = "in_progress"
        return player_id

    def get_player(self, pid):
        for p in self.players:
            if p["player_id"] == pid:
                return p
        return None

    def get_state(self):
        return {
            "game_id": self.game_id,
            "board": self.board,
            "players": [
                {"player_id": p["player_id"], "name": p["name"], "symbol": p["symbol"]}
                for p in self.players
            ],
            "next_turn": self.next_turn,
            "status": self.status,
            "winner": self.winner,
            "draw": self.draw,
        }

    def move(self, player_id: str, row: int, col: int):
        if self.status != "in_progress":
            raise ValueError("Game is not in progress.")
        if self.next_turn != player_id:
            raise ValueError("It's not your turn.")
        if not (0 <= row < 3 and 0 <= col < 3):
            raise ValueError("Move out of bounds.")
        if self.board[row][col] is not None:
            raise ValueError("Cell already taken.")
        player = self.get_player(player_id)
        if not player:
            raise ValueError("Invalid player.")
        self.board[row][col] = player["symbol"]
        self.moves += 1
        if self.check_winner(player["symbol"]):
            self.status = "finished"
            self.winner = player_id
        elif self.moves == 9:
            self.status = "finished"
            self.draw = True
        else:
            # Switch turn
            next_player = [
                p["player_id"] for p in self.players if p["player_id"] != player_id
            ]
            if next_player:
                self.next_turn = next_player[0]
            else:
                self.next_turn = None  # Shouldn't happen

    def check_winner(self, symbol: str) -> bool:
        b = self.board
        for i in range(3):
            if all(x == symbol for x in b[i]):
                return True
            if all(b[j][i] == symbol for j in range(3)):
                return True
        if all(b[i][i] == symbol for i in range(3)):
            return True
        if all(b[i][2 - i] == symbol for i in range(3)):
            return True
        return False


# Store: game_id -> Game instance
GAMES: Dict[str, Game] = {}


app = FastAPI(
    title="Tic Tac Toe API",
    description="Backend for multiplayer web-based Tic Tac Toe game.",
    version="1.0.0",
    openapi_tags=[
        {"name": "Games", "description": "Tic Tac Toe game management and play endpoints"}
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"message": "Healthy"}


# PUBLIC_INTERFACE
@app.post(
    "/games",
    response_model=GameStateResponse,
    tags=["Games"],
    summary="Create new Tic Tac Toe game",
    status_code=status.HTTP_201_CREATED,
)
def create_game(request: NewGameRequest = Body(...)):
    """
    Create a new Tic Tac Toe game.

    Args:
        request: Player joining the game.

    Returns:
        JSON with game ID and board state.
    """
    game = Game(request.player_name)
    GAMES[game.game_id] = game
    state = game.get_state()
    return state


# PUBLIC_INTERFACE
@app.post(
    "/games/{game_id}/join",
    response_model=GameStateResponse,
    tags=["Games"],
    summary="Join existing Tic Tac Toe game",
)
def join_game(
    game_id: str = Path(..., description="Game ID to join"),
    request: JoinGameRequest = Body(...),
):
    """
    Join an existing Tic Tac Toe game.

    Args:
        game_id: Game to join.
        request: Player info.

    Returns:
        JSON with game state.
    """
    if game_id not in GAMES:
        raise HTTPException(status_code=404, detail="Game not found")
    game = GAMES[game_id]
    if len(game.players) >= 2:
        raise HTTPException(status_code=403, detail="Game already has 2 players.")
    try:
        game.add_player(request.player_name)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return game.get_state()


# PUBLIC_INTERFACE
@app.post(
    "/games/{game_id}/move",
    response_model=GameStateResponse,
    tags=["Games"],
    summary="Make a move in a game",
)
def make_move(
    game_id: str = Path(..., description="Game ID to make move in"),
    request: MoveRequest = Body(...),
):
    """
    Make a move.

    Args:
        game_id: Game to play in.
        request: Player ID, row, and col.

    Returns:
        JSON with updated game state.

    Raises:
        404 if game not found, 400 for invalid input/violations.
    """
    if game_id not in GAMES:
        raise HTTPException(status_code=404, detail="Game not found.")
    game = GAMES[game_id]
    try:
        game.move(request.player_id, request.row, request.col)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return game.get_state()


# PUBLIC_INTERFACE
@app.get(
    "/games/{game_id}",
    response_model=GameStateResponse,
    tags=["Games"],
    summary="Retrieve current state of a game",
)
def get_game_state(
    game_id: str = Path(..., description="ID of game to retrieve")
):
    """
    Get current state of a specific game.

    Args:
        game_id: The ID of the game.
    Returns:
        Game state, including board, players, whose turn, finished/draw/winner, etc.
    """
    if game_id not in GAMES:
        raise HTTPException(status_code=404, detail="Game not found.")
    game = GAMES[game_id]
    return game.get_state()


# PUBLIC_INTERFACE
@app.get(
    "/games",
    response_model=List[GameSummary],
    tags=["Games"],
    summary="List all active games",
)
def list_games():
    """
    List all active games with their statuses.
    """
    summaries = []
    for gid, game in GAMES.items():
        summaries.append(
            {
                "game_id": gid,
                "status": game.status,
                "players": [p["name"] for p in game.players],
                "next_turn": game.next_turn,
            }
        )
    return summaries
