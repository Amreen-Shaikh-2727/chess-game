// Letters for the columns, used in notation like "e4"
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Unicode chess pieces. We use the solid versions for both colors
// and let CSS decide whether they look white or black.
// The \uFE0E on the pawn stops some phones from turning it into an emoji.
export const PIECE_SYMBOLS = {
  K: '♚',
  Q: '♛',
  R: '♜',
  B: '♝',
  N: '♞',
  P: '♟\uFE0E',
};

// 10 minutes per player, in seconds
export const INITIAL_TIME = 600;