import { PIECE_SYMBOLS } from '../utils/constants';
import { FILES } from '../utils/constants';

function Square({ row, col, piece, isSelected, isTarget, isCheck, onClick }) {
  // a8 (row 0, col 0) is a light square, so even sums are light
  const isLight = (row + col) % 2 === 0;

  let className = `square ${isLight ? 'light' : 'dark'}`;
  if (isSelected) className += ' selected';
  if (isCheck) className += ' in-check';

  return (
    <div className={className} onClick={onClick}>
      {/* rank number on the left edge, file letter on the bottom edge */}
      {col === 0 && <span className="rank-label">{8 - row}</span>}
      {row === 7 && <span className="file-label">{FILES[col]}</span>}

      {piece && (
        <span className={`piece ${piece[0] === 'w' ? 'white-piece' : 'black-piece'}`}>
          {PIECE_SYMBOLS[piece[1]]}
        </span>
      )}

      {/* dot for an empty target square, ring for a capture */}
      {isTarget && <span className={piece ? 'hint capture-hint' : 'hint'} />}
    </div>
  );
}

export default Square;