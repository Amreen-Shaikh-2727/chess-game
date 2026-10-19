import { FILES } from './constants';

// ---------- Small helpers ----------

const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

function insideBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function enemyOf(color) {
  return color === 'w' ? 'b' : 'w';
}

function squareName(row, col) {
  return FILES[col] + (8 - row);
}

// ---------- Setting up the game ----------

export function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

  backRow.forEach((type, col) => {
    board[0][col] = 'b' + type;
    board[7][col] = 'w' + type;
  });

  for (let col = 0; col < 8; col++) {
    board[1][col] = 'bP';
    board[6][col] = 'wP';
  }

  return board;
}

// A "position" is everything we need to know to continue the game
export function createInitialPosition() {
  return {
    board: createInitialBoard(),
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true }, // who can still castle
    enPassant: null, // the square a pawn can capture "in passing", if any
  };
}

// ---------- Check detection ----------

// Is this square being attacked by any piece of byColor?
export function isSquareAttacked(board, row, col, byColor) {
  // Pawns attack diagonally forward. White pawns move up the screen,
  // so a white pawn attacking us would be one row below us.
  const pawnRow = byColor === 'w' ? row + 1 : row - 1;
  for (const dc of [-1, 1]) {
    const c = col + dc;
    if (insideBoard(pawnRow, c) && board[pawnRow][c] === byColor + 'P') return true;
  }

  for (const [dr, dc] of KNIGHT_STEPS) {
    const r = row + dr;
    const c = col + dc;
    if (insideBoard(r, c) && board[r][c] === byColor + 'N') return true;
  }

  for (const [dr, dc] of KING_STEPS) {
    const r = row + dr;
    const c = col + dc;
    if (insideBoard(r, c) && board[r][c] === byColor + 'K') return true;
  }

  // Rooks and queens along straight lines
  for (const [dr, dc] of ROOK_DIRS) {
    let r = row + dr;
    let c = col + dc;
    while (insideBoard(r, c)) {
      const piece = board[r][c];
      if (piece) {
        if (piece[0] === byColor && (piece[1] === 'R' || piece[1] === 'Q')) return true;
        break; // something is blocking the line
      }
      r += dr;
      c += dc;
    }
  }

  // Bishops and queens along diagonals
  for (const [dr, dc] of BISHOP_DIRS) {
    let r = row + dr;
    let c = col + dc;
    while (insideBoard(r, c)) {
      const piece = board[r][c];
      if (piece) {
        if (piece[0] === byColor && (piece[1] === 'B' || piece[1] === 'Q')) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return false;
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === color + 'K') return { row: r, col: c };
    }
  }
  return null;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king.row, king.col, enemyOf(color));
}

// ---------- Move generation ----------

// "Pseudo" moves follow how the piece moves, but they might leave
// our own king in check. We filter those out later in getLegalMoves.
function getPseudoMoves(position, row, col) {
  const { board, castling, enPassant } = position;
  const piece = board[row][col];
  if (!piece) return [];

  const color = piece[0];
  const type = piece[1];
  const moves = [];

  const addMove = (toRow, toCol, special = null) => {
    moves.push({ from: { row, col }, to: { row: toRow, col: toCol }, special });
  };

  // Used by rook, bishop and queen: keep going until we hit something
  const addSlidingMoves = (directions) => {
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (insideBoard(r, c)) {
        const target = board[r][c];
        if (!target) {
          addMove(r, c);
        } else {
          if (target[0] !== color) addMove(r, c); // we can capture it
          break;
        }
        r += dr;
        c += dc;
      }
    }
  };

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    // one step forward (only if the square is empty)
    if (insideBoard(row + dir, col) && !board[row + dir][col]) {
      addMove(row + dir, col);

      // two steps from the starting row
      if (row === startRow && !board[row + 2 * dir][col]) {
        addMove(row + 2 * dir, col, 'double');
      }
    }

    // diagonal captures, including en passant
    for (const dc of [-1, 1]) {
      const r = row + dir;
      const c = col + dc;
      if (!insideBoard(r, c)) continue;

      const target = board[r][c];
      if (target && target[0] !== color) {
        addMove(r, c);
      } else if (!target && enPassant && enPassant.row === r && enPassant.col === c) {
        addMove(r, c, 'enPassant');
      }
    }
  }

  if (type === 'N') {
    for (const [dr, dc] of KNIGHT_STEPS) {
      const r = row + dr;
      const c = col + dc;
      if (!insideBoard(r, c)) continue;
      const target = board[r][c];
      if (!target || target[0] !== color) addMove(r, c);
    }
  }

  if (type === 'R') addSlidingMoves(ROOK_DIRS);
  if (type === 'B') addSlidingMoves(BISHOP_DIRS);
  if (type === 'Q') addSlidingMoves([...ROOK_DIRS, ...BISHOP_DIRS]);

  if (type === 'K') {
    for (const [dr, dc] of KING_STEPS) {
      const r = row + dr;
      const c = col + dc;
      if (!insideBoard(r, c)) continue;
      const target = board[r][c];
      if (!target || target[0] !== color) addMove(r, c);
    }

    // Castling: king must be on its home square, the path must be empty,
    // and the king can't start in, pass through, or land in check.
    const homeRow = color === 'w' ? 7 : 0;
    const enemy = enemyOf(color);

    if (row === homeRow && col === 4) {
      const kingSideOk =
        castling[color + 'K'] &&
        board[homeRow][7] === color + 'R' &&
        !board[homeRow][5] &&
        !board[homeRow][6] &&
        !isSquareAttacked(board, homeRow, 4, enemy) &&
        !isSquareAttacked(board, homeRow, 5, enemy) &&
        !isSquareAttacked(board, homeRow, 6, enemy);

      if (kingSideOk) addMove(homeRow, 6, 'castleKing');

      const queenSideOk =
        castling[color + 'Q'] &&
        board[homeRow][0] === color + 'R' &&
        !board[homeRow][1] &&
        !board[homeRow][2] &&
        !board[homeRow][3] &&
        !isSquareAttacked(board, homeRow, 4, enemy) &&
        !isSquareAttacked(board, homeRow, 3, enemy) &&
        !isSquareAttacked(board, homeRow, 2, enemy);

      if (queenSideOk) addMove(homeRow, 2, 'castleQueen');
    }
  }

  return moves;
}

// ---------- Making a move ----------

// If a rook moves away from (or gets captured on) its corner,
// that side loses the right to castle.
function updateRookRights(castling, row, col) {
  if (row === 7 && col === 0) castling.wQ = false;
  if (row === 7 && col === 7) castling.wK = false;
  if (row === 0 && col === 0) castling.bQ = false;
  if (row === 0 && col === 7) castling.bK = false;
}

// Returns a brand new position (we never change the old one, which makes undo easy)
export function makeMove(position, move) {
  const board = position.board.map((rowArr) => [...rowArr]);
  const { from, to, special } = move;

  const piece = board[from.row][from.col];
  const color = piece[0];
  const type = piece[1];
  let captured = board[to.row][to.col];

  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;

  // En passant: the captured pawn is NOT on the square we moved to
  if (special === 'enPassant') {
    captured = board[from.row][to.col];
    board[from.row][to.col] = null;
  }

  // Castling: also move the rook
  if (special === 'castleKing') {
    board[to.row][5] = board[to.row][7];
    board[to.row][7] = null;
  }
  if (special === 'castleQueen') {
    board[to.row][3] = board[to.row][0];
    board[to.row][0] = null;
  }

  // Pawn reaching the last row becomes a queen (keeping it simple)
  if (type === 'P' && (to.row === 0 || to.row === 7)) {
    board[to.row][to.col] = color + 'Q';
  }

  // Work out the new castling rights
  const castling = { ...position.castling };
  if (type === 'K') {
    castling[color + 'K'] = false;
    castling[color + 'Q'] = false;
  }
  updateRookRights(castling, from.row, from.col);
  updateRookRights(castling, to.row, to.col);

  // If a pawn just jumped two squares, the square it skipped is open to en passant
  const newEnPassant =
    special === 'double' ? { row: (from.row + to.row) / 2, col: from.col } : null;

  return {
    position: {
      board,
      turn: enemyOf(color),
      castling,
      enPassant: newEnPassant,
    },
    captured,
  };
}

// ---------- Legal moves ----------

// Legal = pseudo move that doesn't leave our own king in check
export function getLegalMoves(position, row, col) {
  const piece = position.board[row][col];
  if (!piece || piece[0] !== position.turn) return [];

  return getPseudoMoves(position, row, col).filter((move) => {
    const { position: next } = makeMove(position, move);
    return !isInCheck(next.board, piece[0]);
  });
}

export function getAllLegalMoves(position) {
  const all = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = position.board[r][c];
      if (piece && piece[0] === position.turn) {
        all.push(...getLegalMoves(position, r, c));
      }
    }
  }
  return all;
}

// Returns: 'playing' | 'check' | 'checkmate' | 'stalemate'
export function getGameStatus(position) {
  const hasMoves = getAllLegalMoves(position).length > 0;
  const inCheck = isInCheck(position.board, position.turn);

  if (!hasMoves) return inCheck ? 'checkmate' : 'stalemate';
  return inCheck ? 'check' : 'playing';
}

// ---------- Standard notation (e4, Nf3, exd5, O-O, Qh4#) ----------

// When two identical pieces can reach the same square (like two knights),
// we need to say which one moved: Nbd2 or N1f3, etc.
function getDisambiguation(position, move) {
  const { board } = position;
  const { from, to } = move;
  const piece = board[from.row][from.col];
  const rivals = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (r === from.row && c === from.col) continue;
      if (board[r][c] !== piece) continue;

      const canReach = getLegalMoves(position, r, c).some(
        (m) => m.to.row === to.row && m.to.col === to.col
      );
      if (canReach) rivals.push({ row: r, col: c });
    }
  }

  if (rivals.length === 0) return '';

  const sameFile = rivals.some((rival) => rival.col === from.col);
  const sameRank = rivals.some((rival) => rival.row === from.row);

  if (!sameFile) return FILES[from.col];
  if (!sameRank) return String(8 - from.row);
  return FILES[from.col] + (8 - from.row);
}

// positionBefore = the position BEFORE the move was played
// statusAfter = the game status AFTER the move (to add + or #)
export function getNotation(positionBefore, move, statusAfter) {
  const { board } = positionBefore;
  const { from, to, special } = move;
  const piece = board[from.row][from.col];
  const type = piece[1];

  let text = '';

  if (special === 'castleKing') {
    text = 'O-O';
  } else if (special === 'castleQueen') {
    text = 'O-O-O';
  } else {
    const isCapture = board[to.row][to.col] !== null || special === 'enPassant';

    if (type === 'P') {
      if (isCapture) text += FILES[from.col]; // exd5
    } else {
      text += type + getDisambiguation(positionBefore, move);
    }

    if (isCapture) text += 'x';
    text += squareName(to.row, to.col);

    if (type === 'P' && (to.row === 0 || to.row === 7)) text += '=Q';
  }

  if (statusAfter === 'checkmate') text += '#';
  else if (statusAfter === 'check') text += '+';

  return text;
}