import { useEffect, useRef } from 'react';

function MoveList({ moves }) {
  const listRef = useRef(null);

  // Keep the list scrolled to the newest move
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [moves.length]);

  // Group the flat list into rows of [white move, black move]
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      number: i / 2 + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="move-list-wrapper">
      <h3>Moves</h3>
      <div className="move-list" ref={listRef}>
        {rows.length === 0 && <p className="empty-text">No moves yet.</p>}

        {rows.map((row) => (
          <div className="move-row" key={row.number}>
            <span className="move-number">{row.number}.</span>
            <span>{row.white}</span>
            <span>{row.black || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MoveList;