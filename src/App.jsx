import { useState, useEffect, useMemo } from 'react';
import Board from './components/Board';
import PlayerPanel from './components/PlayerPanel';
import MoveList from './components/MoveList';
import { INITIAL_TIME } from './utils/constants';
import {
  createInitialPosition,
  getLegalMoves,
  makeMove,
  getGameStatus,
  getNotation,
  findKing,
} from './utils/chessLogic';
import './App.css';

function App() {
  const [position, setPosition] = useState(createInitialPosition);
  const [selected, setSelected] = useState(null); // clicked piece {row, col}
  const [legalMoves, setLegalMoves] = useState([]); // moves for the clicked piece
  const [moveList, setMoveList] = useState([]); // ["e4", "e5", ...]
  const [captured, setCaptured] = useState([]); // ["bP", "wN", ...]
  const [history, setHistory] = useState([]); // snapshots used by undo
  const [times, setTimes] = useState({ w: INITIAL_TIME, b: INITIAL_TIME });
  const [notice, setNotice] = useState(''); // small warning message

  const status = useMemo(() => getGameStatus(position), [position]);
  const timedOut = times.w <= 0 ? 'w' : times.b <= 0 ? 'b' : null;
  const gameOver = status === 'checkmate' || status === 'stalemate' || timedOut !== null;
  const turnName = position.turn === 'w' ? 'White' : 'Black';

  // ----- Timer -----
  // Only the player whose turn it is loses time.
  // Clocks start after the first move has been played.
  useEffect(() => {
    if (gameOver || moveList.length === 0) return;

    const interval = setInterval(() => {
      setTimes((prev) => ({
        ...prev,
        [position.turn]: Math.max(prev[position.turn] - 1, 0),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [position.turn, gameOver, moveList.length]);

  // ----- Playing a move -----
  function playMove(move) {
    const { position: nextPosition, captured: capturedPiece } = makeMove(position, move);
    const nextStatus = getGameStatus(nextPosition);
    const notation = getNotation(position, move, nextStatus);

    // save the current state so Undo can bring it back
    setHistory([...history, { position, moveList, captured }]);

    setPosition(nextPosition);
    setMoveList([...moveList, notation]);
    if (capturedPiece) setCaptured([...captured, capturedPiece]);

    setSelected(null);
    setLegalMoves([]);
    setNotice('');
  }

  // ----- Clicking a square -----
  function handleSquareClick(row, col) {
    if (gameOver) return;

    const clickedPiece = position.board[row][col];

    // 1. A piece is already selected and the player clicked a legal square -> move
    if (selected) {
      const move = legalMoves.find((m) => m.to.row === row && m.to.col === col);
      if (move) {
        playMove(move);
        return;
      }
    }

    // 2. The player clicked one of their own pieces -> select it
    if (clickedPiece && clickedPiece[0] === position.turn) {
      const moves = getLegalMoves(position, row, col);
      setSelected({ row, col });
      setLegalMoves(moves);
      setNotice(moves.length === 0 ? "That piece can't move right now." : '');
      return;
    }

    // 3. Anything else is an illegal click, so tell the player why
    if (selected) {
      setNotice('Illegal move! Choose one of the highlighted squares.');
    } else if (clickedPiece) {
      setNotice(`It's ${turnName}'s turn.`);
    }
    setSelected(null);
    setLegalMoves([]);
  }

  // ----- Undo and restart -----
  function handleUndo() {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setPosition(last.position);
    setMoveList(last.moveList);
    setCaptured(last.captured);
    setHistory(history.slice(0, -1));
    setSelected(null);
    setLegalMoves([]);
    setNotice('');
  }

  function handleRestart() {
    setPosition(createInitialPosition());
    setSelected(null);
    setLegalMoves([]);
    setMoveList([]);
    setCaptured([]);
    setHistory([]);
    setTimes({ w: INITIAL_TIME, b: INITIAL_TIME });
    setNotice('');
  }

  // ----- Text shown above the move list -----
  function getStatusText() {
    if (timedOut) {
      const winner = timedOut === 'w' ? 'Black' : 'White';
      return `Time's up! ${winner} wins.`;
    }
    if (status === 'checkmate') {
      const winner = position.turn === 'w' ? 'Black' : 'White';
      return `Checkmate! ${winner} wins.`;
    }
    if (status === 'stalemate') return 'Stalemate. The game is a draw.';
    if (status === 'check') return `Check! ${turnName} must respond.`;
    return `${turnName} to move`;
  }

  // Highlight the king when it is in check
  const checkSquare =
    status === 'check' || status === 'checkmate'
      ? findKing(position.board, position.turn)
      : null;

  const capturedByWhite = captured.filter((p) => p[0] === 'b');
  const capturedByBlack = captured.filter((p) => p[0] === 'w');

  return (
    <div className="app">
      <h1>Chess</h1>

      <div className="game">
        <div className="board-area">
          <PlayerPanel
            name="Black"
            time={times.b}
            isActive={!gameOver && position.turn === 'b'}
            capturedPieces={capturedByBlack}
          />

          <Board
            board={position.board}
            selected={selected}
            legalMoves={legalMoves}
            checkSquare={checkSquare}
            onSquareClick={handleSquareClick}
          />

          <PlayerPanel
            name="White"
            time={times.w}
            isActive={!gameOver && position.turn === 'w'}
            capturedPieces={capturedByWhite}
          />
        </div>

        <div className="side-panel">
          <div className={`status ${status} ${gameOver ? 'over' : ''}`}>
            {getStatusText()}
          </div>

          {notice && <div className="notice">{notice}</div>}

          <MoveList moves={moveList} />

          <div className="buttons">
            <button onClick={handleUndo} disabled={history.length === 0 || timedOut !== null}>
              Undo
            </button>
            <button onClick={handleRestart}>New Game</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;