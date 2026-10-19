import { PIECE_SYMBOLS } from '../utils/constants';

// 605 seconds -> "10:05"
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function PlayerPanel({ name, time, isActive, capturedPieces }) {
  return (
    <div className={`player-panel ${isActive ? 'active' : ''}`}>
      <div>
        <div className="player-name">{name}</div>
        <div className="captured">
          {capturedPieces.map((piece, index) => (
            <span
              key={index}
              className={piece[0] === 'w' ? 'white-piece' : 'black-piece'}
            >
              {PIECE_SYMBOLS[piece[1]]}
            </span>
          ))}
        </div>
      </div>

      <div className={`timer ${time <= 30 ? 'low' : ''}`}>{formatTime(time)}</div>
    </div>
  );
}

export default PlayerPanel;