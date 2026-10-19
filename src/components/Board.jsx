import Square from './Square';

function Board({ board, selected, legalMoves, checkSquare, onSquareClick }) {
  return (
    <div className="board">
      {board.map((rowArr, row) =>
        rowArr.map((piece, col) => {
          const isSelected = selected && selected.row === row && selected.col === col;
          const isTarget = legalMoves.some((m) => m.to.row === row && m.to.col === col);
          const isCheck = checkSquare && checkSquare.row === row && checkSquare.col === col;

          return (
            <Square
              key={`${row}-${col}`}
              row={row}
              col={col}
              piece={piece}
              isSelected={isSelected}
              isTarget={isTarget}
              isCheck={isCheck}
              onClick={() => onSquareClick(row, col)}
            />
          );
        })
      )}
    </div>
  );
}

export default Board;