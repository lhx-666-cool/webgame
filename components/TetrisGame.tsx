"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";
import styles from "./tetris-game.module.css";

type GameMode = "classic" | "cascade" | "sand";
type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

type PieceDef = {
  color: number;
  rotations: Array<Array<[number, number]>>;
};

type Piece = {
  type: TetrominoType;
  rotation: number;
  row: number;
  col: number;
};

type EngineState = {
  board: number[][];
  sandBoard: number[][] | null;
  sandWakeMask: boolean[][] | null;
  sandSettleTicksLeft: number;
  sandStablePasses: number;
  piece: Piece | null;
  queue: TetrominoType[];
  score: number;
  level: number;
  lines: number;
  combos: number;
  mode: GameMode;
  running: boolean;
  gameOver: boolean;
};

const BOARD_COLS = 10;
const BOARD_ROWS = 22;
const VISIBLE_START_ROW = 2;
const SAND_PIXEL_SCALE = 4;
const SAND_BOARD_COLS = BOARD_COLS * SAND_PIXEL_SCALE;
const SAND_BOARD_ROWS = BOARD_ROWS * SAND_PIXEL_SCALE;
const SAND_VISIBLE_START_ROW = VISIBLE_START_ROW * SAND_PIXEL_SCALE;
const SAND_WAKE_RADIUS_ON_LOCK = 2;
const SAND_WAKE_RADIUS_ON_CLEAR = 1;
const SAND_WAKE_EXPAND_RADIUS = 1;
const SAND_SETTLE_TARGET_MS = 200;
const SAND_STABLE_PASSES = 2;
const SAND_LOCAL_PASSES_PER_TICK = 4;
const SAND_SETTLE_TICKS_MIN = 4;
const SAND_SETTLE_TICKS_MAX = 10;
const PREVIEW_GRID_ROWS = 2;
const PREVIEW_GRID_COLS = 4;

const COLOR_HEX = [
  "#51e2ff",
  "#ffd75b",
  "#b98aff",
  "#6af588",
  "#ff7878",
  "#669dff",
  "#ffab4f"
];

const SAND_COLOR_MAP = [0, 1, 2, 0, 1, 2, 0];

const PIECES: Record<TetrominoType, PieceDef> = {
  I: {
    color: 0,
    rotations: [
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3]
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2]
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3]
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1]
      ]
    ]
  },
  O: {
    color: 1,
    rotations: [
      [
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2]
      ]
    ]
  },
  T: {
    color: 2,
    rotations: [
      [
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 2]
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [1, 3]
      ],
      [
        [1, 1],
        [1, 2],
        [1, 3],
        [0, 2]
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [1, 1]
      ]
    ]
  },
  S: {
    color: 3,
    rotations: [
      [
        [1, 2],
        [1, 3],
        [2, 1],
        [2, 2]
      ],
      [
        [0, 2],
        [1, 2],
        [1, 3],
        [2, 3]
      ]
    ]
  },
  Z: {
    color: 4,
    rotations: [
      [
        [1, 1],
        [1, 2],
        [2, 2],
        [2, 3]
      ],
      [
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 2]
      ]
    ]
  },
  J: {
    color: 5,
    rotations: [
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [2, 3]
      ],
      [
        [0, 2],
        [0, 3],
        [1, 2],
        [2, 2]
      ],
      [
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 3]
      ],
      [
        [0, 2],
        [1, 2],
        [2, 1],
        [2, 2]
      ]
    ]
  },
  L: {
    color: 6,
    rotations: [
      [
        [1, 3],
        [2, 1],
        [2, 2],
        [2, 3]
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [2, 3]
      ],
      [
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 1]
      ],
      [
        [0, 1],
        [0, 2],
        [1, 2],
        [2, 2]
      ]
    ]
  }
};

const TETROMINO_TYPES = Object.keys(PIECES) as TetrominoType[];

const createBoard = () =>
  Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(-1));

const createSandBoard = () =>
  Array.from({ length: SAND_BOARD_ROWS }, () => Array(SAND_BOARD_COLS).fill(-1));

const cloneBoard = (board: number[][]) => board.map((row) => row.slice());

const createWakeMask = (rows: number, cols: number) =>
  Array.from({ length: rows }, () => Array(cols).fill(false));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const shuffle = <T,>(items: T[]) => {
  const next = items.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const rand = Math.floor(Math.random() * (index + 1));
    [next[index], next[rand]] = [next[rand], next[index]];
  }
  return next;
};

const pieceCells = (piece: Piece) => {
  const def = PIECES[piece.type];
  const rotation = def.rotations[piece.rotation % def.rotations.length];
  return rotation.map(([row, col]) => [piece.row + row, piece.col + col] as [number, number]);
};

const isValidPosition = (board: number[][], piece: Piece) => {
  for (const [row, col] of pieceCells(piece)) {
    if (col < 0 || col >= BOARD_COLS || row >= BOARD_ROWS) {
      return false;
    }
    if (row >= 0 && board[row][col] !== -1) {
      return false;
    }
  }
  return true;
};

const isValidPositionOnSand = (sandBoard: number[][], piece: Piece) => {
  const sandRows = sandBoard.length;
  const sandCols = sandBoard[0]?.length ?? 0;

  for (const [row, col] of pieceCells(piece)) {
    if (col < 0 || col >= BOARD_COLS || row >= BOARD_ROWS) {
      return false;
    }

    for (let rowOffset = 0; rowOffset < SAND_PIXEL_SCALE; rowOffset += 1) {
      const sandRow = row * SAND_PIXEL_SCALE + rowOffset;
      if (sandRow < 0) {
        continue;
      }
      if (sandRow >= sandRows) {
        return false;
      }

      for (let colOffset = 0; colOffset < SAND_PIXEL_SCALE; colOffset += 1) {
        const sandCol = col * SAND_PIXEL_SCALE + colOffset;
        if (sandCol < 0 || sandCol >= sandCols) {
          return false;
        }
        if (sandBoard[sandRow][sandCol] !== -1) {
          return false;
        }
      }
    }
  }

  return true;
};

const mergePieceToSand = (sandBoard: number[][], piece: Piece) => {
  const next = cloneBoard(sandBoard);
  const baseColor = PIECES[piece.type].color;
  const color = SAND_COLOR_MAP[baseColor] ?? (baseColor % 3);
  const sandRows = next.length;
  const sandCols = next[0]?.length ?? 0;

  for (const [row, col] of pieceCells(piece)) {
    for (let rowOffset = 0; rowOffset < SAND_PIXEL_SCALE; rowOffset += 1) {
      const sandRow = row * SAND_PIXEL_SCALE + rowOffset;
      if (sandRow < 0 || sandRow >= sandRows) {
        continue;
      }

      for (let colOffset = 0; colOffset < SAND_PIXEL_SCALE; colOffset += 1) {
        const sandCol = col * SAND_PIXEL_SCALE + colOffset;
        if (sandCol < 0 || sandCol >= sandCols) {
          continue;
        }
        next[sandRow][sandCol] = color;
      }
    }
  }

  return next;
};

const hasActiveWakeMask = (wakeMask: boolean[][] | null) => {
  if (!wakeMask) {
    return false;
  }

  for (const row of wakeMask) {
    for (const active of row) {
      if (active) {
        return true;
      }
    }
  }
  return false;
};

const markWakeArea = (wakeMask: boolean[][], centerRow: number, centerCol: number, radius: number) => {
  const rows = wakeMask.length;
  const cols = wakeMask[0]?.length ?? 0;

  for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
    if (row < 0 || row >= rows) {
      continue;
    }

    for (let col = centerCol - radius; col <= centerCol + radius; col += 1) {
      if (col < 0 || col >= cols) {
        continue;
      }
      wakeMask[row][col] = true;
    }
  }
};

const wakeFromPiece = (piece: Piece, radius = SAND_WAKE_RADIUS_ON_LOCK) => {
  const wakeMask = createWakeMask(SAND_BOARD_ROWS, SAND_BOARD_COLS);

  for (const [row, col] of pieceCells(piece)) {
    for (let rowOffset = 0; rowOffset < SAND_PIXEL_SCALE; rowOffset += 1) {
      const sandRow = row * SAND_PIXEL_SCALE + rowOffset;
      if (sandRow < 0 || sandRow >= SAND_BOARD_ROWS) {
        continue;
      }

      for (let colOffset = 0; colOffset < SAND_PIXEL_SCALE; colOffset += 1) {
        const sandCol = col * SAND_PIXEL_SCALE + colOffset;
        if (sandCol < 0 || sandCol >= SAND_BOARD_COLS) {
          continue;
        }
        markWakeArea(wakeMask, sandRow, sandCol, radius);
      }
    }
  }

  return wakeMask;
};

const expandWakeMask = (wakeMask: boolean[][], radius = SAND_WAKE_EXPAND_RADIUS) => {
  const rows = wakeMask.length;
  const cols = wakeMask[0]?.length ?? 0;
  const expanded = createWakeMask(rows, cols);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!wakeMask[row][col]) {
        continue;
      }
      markWakeArea(expanded, row, col, radius);
    }
  }

  return expanded;
};

const mergeWakeMasks = (baseMask: boolean[][] | null, extraMask: boolean[][]) => {
  if (!baseMask) {
    return extraMask;
  }

  const rows = baseMask.length;
  const cols = baseMask[0]?.length ?? 0;
  const merged = createWakeMask(rows, cols);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      merged[row][col] = Boolean(baseMask[row][col] || extraMask[row][col]);
    }
  }

  return merged;
};

const computeSandSettleTicks = (modeSpeedMs: number) => {
  const safeModeSpeed = Math.max(1, modeSpeedMs);
  return clamp(
    Math.ceil(SAND_SETTLE_TARGET_MS / safeModeSpeed),
    SAND_SETTLE_TICKS_MIN,
    SAND_SETTLE_TICKS_MAX
  );
};

const isValidPiecePosition = (state: EngineState, piece: Piece) => {
  if (state.mode === "sand") {
    const sandBoard = state.sandBoard ?? createSandBoard();
    return isValidPositionOnSand(sandBoard, piece);
  }

  return isValidPosition(state.board, piece);
};

const spawnPiece = (type: TetrominoType): Piece => ({
  type,
  rotation: 0,
  row: -1,
  col: 3
});

const ensureQueue = (queue: TetrominoType[]) => {
  const next = queue.slice();
  while (next.length < 8) {
    next.push(...shuffle(TETROMINO_TYPES));
  }
  return next;
};

const pullNextPiece = (queue: TetrominoType[]) => {
  const ensured = ensureQueue(queue);
  const [head, ...rest] = ensured;
  return {
    type: head,
    queue: rest
  };
};

const mergePiece = (board: number[][], piece: Piece) => {
  const next = cloneBoard(board);
  const color = PIECES[piece.type].color;

  for (const [row, col] of pieceCells(piece)) {
    if (row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS) {
      next[row][col] = color;
    }
  }

  return next;
};

const clearFullLines = (board: number[][]) => {
  const kept = board.filter((row) => row.some((cell) => cell === -1));
  const removed = BOARD_ROWS - kept.length;

  if (removed <= 0) {
    return { board, removed: 0 };
  }

  const refill = Array.from({ length: removed }, () => Array(BOARD_COLS).fill(-1));
  return {
    board: [...refill, ...kept],
    removed
  };
};

const lineScore = (removed: number, level: number) => {
  if (removed <= 0) {
    return 0;
  }
  const base = [0, 100, 300, 500, 800][Math.min(removed, 4)] ?? 800;
  return base * level;
};

const sandCellsToLogicalLines = (removedCells: number) => {
  if (removedCells <= 0) {
    return 0;
  }

  const pixelsPerLogicalLine = SAND_BOARD_COLS * SAND_PIXEL_SCALE;
  return Math.max(1, Math.round(removedCells / pixelsPerLogicalLine));
};

const applyVerticalGravityStep = (board: number[][]) => {
  const next = cloneBoard(board);
  let moved = false;

  for (let row = BOARD_ROWS - 2; row >= 0; row -= 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      if (next[row][col] !== -1 && next[row + 1][col] === -1) {
        next[row + 1][col] = next[row][col];
        next[row][col] = -1;
        moved = true;
      }
    }
  }

  return { board: next, moved };
};

const applySandStep = (board: number[][], wakeMask: boolean[][]) => {
  const next = cloneBoard(board);
  let moved = false;
  const rows = next.length;
  const cols = next[0]?.length ?? 0;
  const processed = Array.from({ length: rows }, () => Array(cols).fill(false));
  const movedMask = createWakeMask(rows, cols);

  for (let row = rows - 2; row >= 0; row -= 1) {
    const columns = shuffle(Array.from({ length: cols }, (_, index) => index));
    for (const col of columns) {
      if (!wakeMask[row][col] || processed[row][col]) {
        continue;
      }

      const color = next[row][col];
      if (color === -1) {
        continue;
      }

      let targetRow = row;
      let targetCol = col;

      if (next[row + 1][col] === -1) {
        targetRow = row + 1;
      } else {
        const diagonalDirs = Math.random() > 0.5 ? [-1, 1] : [1, -1];
        for (const dir of diagonalDirs) {
          const candidateCol = col + dir;
          if (candidateCol < 0 || candidateCol >= cols) {
            continue;
          }
          if (next[row + 1][candidateCol] === -1) {
            targetRow = row + 1;
            targetCol = candidateCol;
            break;
          }
        }
      }

      if (targetRow !== row || targetCol !== col) {
        next[targetRow][targetCol] = color;
        next[row][col] = -1;
        processed[targetRow][targetCol] = true;
        processed[row][col] = true;
        moved = true;
        movedMask[row][col] = true;
        movedMask[targetRow][targetCol] = true;
      }
    }
  }

  const nextWakeMask = moved
    ? expandWakeMask(movedMask, SAND_WAKE_EXPAND_RADIUS)
    : createWakeMask(rows, cols);
  return { board: next, moved, nextWakeMask };
};

const clearSandBridges = (board: number[][]) => {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const clearMask = Array.from({ length: rows }, () => Array(cols).fill(false));
  let removed = 0;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ] as const;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const color = board[row][col];
      if (color === -1 || seen[row][col]) {
        continue;
      }

      const stack: Array<[number, number]> = [[row, col]];
      const group: Array<[number, number]> = [];
      seen[row][col] = true;
      let touchesLeft = col === 0;
      let touchesRight = col === cols - 1;

      while (stack.length > 0) {
        const [curRow, curCol] = stack.pop() as [number, number];
        group.push([curRow, curCol]);

        for (const [dr, dc] of dirs) {
          const nextRow = curRow + dr;
          const nextCol = curCol + dc;
          if (
            nextRow < 0 ||
            nextRow >= rows ||
            nextCol < 0 ||
            nextCol >= cols ||
            seen[nextRow][nextCol] ||
            board[nextRow][nextCol] !== color
          ) {
            continue;
          }
          seen[nextRow][nextCol] = true;
          if (nextCol === 0) {
            touchesLeft = true;
          }
          if (nextCol === cols - 1) {
            touchesRight = true;
          }
          stack.push([nextRow, nextCol]);
        }
      }

      if (touchesLeft && touchesRight) {
        for (const [clearRow, clearCol] of group) {
          if (!clearMask[clearRow][clearCol]) {
            clearMask[clearRow][clearCol] = true;
            removed += 1;
          }
        }
      }
    }
  }

  if (removed <= 0) {
    return {
      board,
      removed: 0,
      clearMask: createWakeMask(rows, cols)
    };
  }

  const next = cloneBoard(board);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (clearMask[row][col]) {
        next[row][col] = -1;
      }
    }
  }

  return { board: next, removed, clearMask };
};

const movePiece = (state: EngineState, rowDelta: number, colDelta: number) => {
  if (!state.piece || state.gameOver) {
    return state;
  }

  const candidate: Piece = {
    ...state.piece,
    row: state.piece.row + rowDelta,
    col: state.piece.col + colDelta
  };

  if (!isValidPiecePosition(state, candidate)) {
    return state;
  }

  return {
    ...state,
    piece: candidate
  };
};

const rotatePiece = (state: EngineState) => {
  if (!state.piece || state.gameOver) {
    return state;
  }

  const def = PIECES[state.piece.type];
  const nextRotation = (state.piece.rotation + 1) % def.rotations.length;
  const trial = { ...state.piece, rotation: nextRotation };
  const kicks = [0, -1, 1, -2, 2];

  for (const offset of kicks) {
    const kicked = { ...trial, col: trial.col + offset };
    if (isValidPiecePosition(state, kicked)) {
      return {
        ...state,
        piece: kicked
      };
    }
  }

  return state;
};

const spawnFromQueue = (state: EngineState) => {
  const { type, queue } = pullNextPiece(state.queue);
  const nextPiece = spawnPiece(type);

  if (!isValidPiecePosition(state, nextPiece)) {
    return {
      ...state,
      queue,
      piece: null,
      running: false,
      gameOver: true
    };
  }

  return {
    ...state,
    queue,
    piece: nextPiece
  };
};

const lockPieceAndResolve = (state: EngineState, modeSpeedMs: number) => {
  if (!state.piece) {
    return state;
  }

  let board = state.board;
  let sandBoard = state.sandBoard;
  let sandWakeMask = state.sandWakeMask;
  let sandSettleTicksLeft = state.sandSettleTicksLeft;
  let sandStablePasses = state.sandStablePasses;
  let score = state.score;
  let lines = state.lines;
  let combos = state.combos;

  if (state.mode === "sand") {
    sandBoard = mergePieceToSand(sandBoard ?? createSandBoard(), state.piece);
    sandWakeMask = wakeFromPiece(state.piece, SAND_WAKE_RADIUS_ON_LOCK);
    sandSettleTicksLeft = computeSandSettleTicks(modeSpeedMs);
    sandStablePasses = 0;
  } else {
    board = mergePiece(state.board, state.piece);

    if (state.mode === "classic") {
      const cleared = clearFullLines(board);
      board = cleared.board;
      if (cleared.removed > 0) {
        lines += cleared.removed;
        combos += 1;
        const level = Math.max(1, Math.floor(lines / 10) + 1);
        score += lineScore(cleared.removed, level) + combos * 12;
      } else {
        combos = 0;
      }
    }

    if (state.mode === "cascade") {
      let removedTotal = 0;
      let changed = true;
      while (changed) {
        const cleared = clearFullLines(board);
        removedTotal += cleared.removed;
        board = cleared.board;

        let moved = false;
        let gravity = applyVerticalGravityStep(board);
        while (gravity.moved) {
          moved = true;
          board = gravity.board;
          gravity = applyVerticalGravityStep(board);
        }

        changed = cleared.removed > 0 || moved;
      }

      if (removedTotal > 0) {
        lines += removedTotal;
        combos += 1;
        const level = Math.max(1, Math.floor(lines / 10) + 1);
        score += lineScore(Math.min(4, removedTotal), level) + removedTotal * 40 + combos * 15;
      } else {
        combos = 0;
      }
    }
  }

  const level = Math.max(1, Math.floor(lines / 10) + 1);

  return spawnFromQueue({
    ...state,
    board,
    sandBoard,
    sandWakeMask,
    sandSettleTicksLeft,
    sandStablePasses,
    piece: null,
    score,
    lines,
    combos,
    level
  });
};

const hardDrop = (state: EngineState, modeSpeedMs: number) => {
  if (!state.piece || state.gameOver) {
    return state;
  }

  let dropped = state.piece;
  let distance = 0;

  while (true) {
    const next = { ...dropped, row: dropped.row + 1 };
    if (!isValidPiecePosition(state, next)) {
      break;
    }
    dropped = next;
    distance += 1;
  }

  return lockPieceAndResolve(
    {
      ...state,
      piece: dropped,
      score: state.score + distance * 2
    },
    modeSpeedMs
  );
};

const applyPassivePhysics = (state: EngineState, modeSpeedMs: number) => {
  let board = state.board;
  let sandBoard = state.sandBoard;
  let sandWakeMask = state.sandWakeMask;
  let sandSettleTicksLeft = state.sandSettleTicksLeft;
  let sandStablePasses = state.sandStablePasses;
  let score = state.score;
  let lines = state.lines;
  let combos = state.combos;

  if (state.mode === "cascade") {
    const gravity = applyVerticalGravityStep(board);
    board = gravity.board;

    const cleared = clearFullLines(board);
    board = cleared.board;

    if (cleared.removed > 0) {
      lines += cleared.removed;
      combos += 1;
      const level = Math.max(1, Math.floor(lines / 10) + 1);
      score += lineScore(cleared.removed, level) + combos * 8;
    }
  }

  if (state.mode === "sand") {
    sandBoard = sandBoard ?? createSandBoard();
    let movedAny = false;
    const canSettle =
      sandSettleTicksLeft > 0 && sandWakeMask !== null && hasActiveWakeMask(sandWakeMask);

    if (canSettle) {
      for (let pass = 0; pass < SAND_LOCAL_PASSES_PER_TICK; pass += 1) {
        if (!sandWakeMask || !hasActiveWakeMask(sandWakeMask)) {
          break;
        }

        const nextSand = applySandStep(sandBoard, sandWakeMask);
        sandBoard = nextSand.board;
        sandWakeMask = nextSand.nextWakeMask;

        if (nextSand.moved) {
          movedAny = true;
          sandStablePasses = 0;
        } else {
          sandStablePasses += 1;
        }

        if (sandStablePasses >= SAND_STABLE_PASSES) {
          sandWakeMask = null;
          sandStablePasses = 0;
          sandSettleTicksLeft = 0;
          break;
        }
      }

      sandSettleTicksLeft = Math.max(0, sandSettleTicksLeft - 1);
    }

    if (
      sandSettleTicksLeft <= 0 ||
      sandWakeMask === null ||
      !hasActiveWakeMask(sandWakeMask)
    ) {
      sandSettleTicksLeft = 0;
      sandWakeMask = null;
      sandStablePasses = 0;
    }

    const shouldCheckClear = canSettle || movedAny;
    if (shouldCheckClear) {
      const cleared = clearSandBridges(sandBoard);
      sandBoard = cleared.board;

      if (cleared.removed > 0) {
        const clearWakeMask = expandWakeMask(cleared.clearMask, SAND_WAKE_RADIUS_ON_CLEAR);
        sandWakeMask = mergeWakeMasks(sandWakeMask, clearWakeMask);
        sandSettleTicksLeft = Math.max(
          sandSettleTicksLeft,
          computeSandSettleTicks(modeSpeedMs)
        );
        sandStablePasses = 0;

        const logicalRemoved = sandCellsToLogicalLines(cleared.removed);
        combos += 1;
        lines += logicalRemoved;
        const level = Math.max(1, Math.floor(lines / 10) + 1);
        score += lineScore(logicalRemoved, level) + logicalRemoved * 90 + combos * 10;
      }
    } else if (sandSettleTicksLeft === 0) {
      combos = 0;
    }
  }

  return {
    ...state,
    board,
    sandBoard,
    sandWakeMask,
    sandSettleTicksLeft,
    sandStablePasses,
    score,
    lines,
    combos,
    level: Math.max(1, Math.floor(lines / 10) + 1)
  };
};

const tick = (state: EngineState, modeSpeedMs: number) => {
  if (!state.running || state.gameOver) {
    return state;
  }

  let next = applyPassivePhysics(state, modeSpeedMs);
  if (!next.piece) {
    next = spawnFromQueue(next);
  }

  if (!next.piece) {
    return next;
  }

  const candidate = {
    ...next.piece,
    row: next.piece.row + 1
  };

  if (isValidPiecePosition(next, candidate)) {
    return {
      ...next,
      piece: candidate
    };
  }

  return lockPieceAndResolve(next, modeSpeedMs);
};

const initEngine = (mode: GameMode, randomize = true): EngineState => {
  const seedQueue = randomize ? ensureQueue([]) : createDeterministicQueue();
  const first = randomize
    ? pullNextPiece(seedQueue)
    : {
        type: seedQueue[0],
        queue: seedQueue.slice(1)
      };
  const piece = spawnPiece(first.type);
  const board = createBoard();
  const sandBoard = mode === "sand" ? createSandBoard() : null;

  const blocked =
    mode === "sand"
      ? !isValidPositionOnSand(sandBoard as number[][], piece)
      : !isValidPosition(board, piece);

  return {
    board,
    sandBoard,
    sandWakeMask: null,
    sandSettleTicksLeft: 0,
    sandStablePasses: 0,
    piece: blocked ? null : piece,
    queue: first.queue,
    score: 0,
    level: 1,
    lines: 0,
    combos: 0,
    mode,
    running: !blocked,
    gameOver: blocked
  };
};

const getModeSpeed = (baseSpeed: number, mode: GameMode, level: number) => {
  const normalized = Math.max(1, Math.min(10, baseSpeed));
  const baseMs = 780 - (normalized - 1) * 65;
  const levelAdjust = Math.max(0, level - 1) * 26;
  const modeAdjust = mode === "sand" ? -360 : mode === "cascade" ? -40 : 0;
  const minMs = mode === "sand" ? 24 : 60;
  return Math.max(minMs, baseMs - levelAdjust + modeAdjust);
};

const buildClassicDisplayBoard = (board: number[][], piece: Piece | null) => {
  const merged = cloneBoard(board);

  if (piece) {
    const color = PIECES[piece.type].color;
    for (const [row, col] of pieceCells(piece)) {
      if (row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS) {
        merged[row][col] = color;
      }
    }
  }

  return merged.slice(VISIBLE_START_ROW);
};

const buildSandDisplayBoard = (sandBoard: number[][], piece: Piece | null) => {
  const merged = piece ? mergePieceToSand(sandBoard, piece) : cloneBoard(sandBoard);
  return merged.slice(SAND_VISIBLE_START_ROW);
};

const buildDisplayBoard = (state: EngineState) => {
  if (state.mode === "sand") {
    return buildSandDisplayBoard(state.sandBoard ?? createSandBoard(), state.piece);
  }

  return buildClassicDisplayBoard(state.board, state.piece);
};

const nextPieceTypes = (queue: TetrominoType[]) => queue.slice(0, 4);

const getPreviewMask = (type: TetrominoType | null) => {
  const mask = new Set<string>();
  if (!type) {
    return mask;
  }

  const base = PIECES[type].rotations[0];
  const minRow = Math.min(...base.map(([row]) => row));
  const minCol = Math.min(...base.map(([, col]) => col));

  for (const [row, col] of base) {
    const normalizedRow = row - minRow;
    const normalizedCol = col - minCol;
    if (
      normalizedRow >= 0 &&
      normalizedRow < PREVIEW_GRID_ROWS &&
      normalizedCol >= 0 &&
      normalizedCol < PREVIEW_GRID_COLS
    ) {
      mask.add(`${normalizedRow},${normalizedCol}`);
    }
  }

  return mask;
};

const createDeterministicQueue = () => [...TETROMINO_TYPES, ...TETROMINO_TYPES];

export default function TetrisGame() {
  const { locale, t } = useI18n();

  const [mode, setMode] = useState<GameMode>("classic");
  const [baseSpeed, setBaseSpeed] = useState(5);
  const [engine, setEngine] = useState<EngineState>(() =>
    initEngine("classic", false)
  );
  const [statusText, setStatusText] = useState("");

  const displayBoard = useMemo(
    () => buildDisplayBoard(engine),
    [engine.mode, engine.board, engine.sandBoard, engine.piece]
  );

  const boardCols = displayBoard[0]?.length ?? BOARD_COLS;
  const boardRows = displayBoard.length;
  const isSandPixelBoard = engine.mode === "sand";
  const boardCellSize = isSandPixelBoard ? 6 : 26;
  const boardGap = isSandPixelBoard ? 0 : 1;

  const modeSpeed = useMemo(
    () => getModeSpeed(baseSpeed, engine.mode, engine.level),
    [baseSpeed, engine.mode, engine.level]
  );

  const queuePreview = useMemo(() => {
    const preview = nextPieceTypes(engine.queue);
    return Array.from({ length: 4 }, (_, index) => preview[index] ?? null);
  }, [engine.queue]);

  const setModeAndReset = useCallback(
    (nextMode: GameMode) => {
      setMode(nextMode);
      setEngine(initEngine(nextMode));
      setStatusText(t("tetris.messages.modeSwitched", { mode: t(`tetris.mode.${nextMode}.name`) }));
    },
    [t]
  );

  const toggleRunning = useCallback(() => {
    setEngine((current) => {
      if (current.gameOver) {
        return current;
      }
      return {
        ...current,
        running: !current.running
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setEngine(initEngine(mode));
    setStatusText(t("tetris.messages.reset"));
  }, [mode, t]);

  const doTick = useCallback(() => {
    setEngine((current) => tick(current, modeSpeed));
  }, [modeSpeed]);

  const moveHorizontal = useCallback((delta: number) => {
    setEngine((current) => (current.running ? movePiece(current, 0, delta) : current));
  }, []);

  const softDrop = useCallback(() => {
    setEngine((current) => {
      if (!current.running) {
        return current;
      }
      const next = movePiece(current, 1, 0);
      if (next !== current) {
        return {
          ...next,
          score: next.score + 1
        };
      }
      return lockPieceAndResolve(current, modeSpeed);
    });
  }, [modeSpeed]);

  const rotate = useCallback(() => {
    setEngine((current) => (current.running ? rotatePiece(current) : current));
  }, []);

  const hardDropNow = useCallback(() => {
    setEngine((current) => (current.running ? hardDrop(current, modeSpeed) : current));
  }, [modeSpeed]);

  useEffect(() => {
    const timer = window.setInterval(doTick, modeSpeed);
    return () => window.clearInterval(timer);
  }, [doTick, modeSpeed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveHorizontal(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveHorizontal(1);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        softDrop();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        rotate();
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        hardDropNow();
        return;
      }
      if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        toggleRunning();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hardDropNow, moveHorizontal, rotate, softDrop, toggleRunning]);

  useEffect(() => {
    if (engine.gameOver) {
      setStatusText(t("tetris.messages.gameOver"));
      return;
    }

    if (engine.running) {
      setStatusText(t("tetris.messages.running"));
      return;
    }

    setStatusText(t("tetris.messages.paused"));
  }, [engine.gameOver, engine.running, t]);

  const modeGuide = useMemo(
    () => [
      t(`tetris.mode.${mode}.guide.1`),
      t(`tetris.mode.${mode}.guide.2`),
      t(`tetris.mode.${mode}.guide.3`)
    ],
    [mode, t]
  );

  return (
    <div className={styles.shell}>
      <div className={styles.topStats}>
        <article className={styles.statBox}>
          <span>{t("tetris.stats.score")}</span>
          <strong>{engine.score.toLocaleString(locale)}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("tetris.stats.level")}</span>
          <strong>{engine.level.toLocaleString(locale)}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("tetris.stats.clears")}</span>
          <strong>{engine.lines.toLocaleString(locale)}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("tetris.stats.combo")}</span>
          <strong>{engine.combos.toLocaleString(locale)}</strong>
        </article>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.leftPane}>
          <div className={styles.boardWrap}>
            <div
              className={styles.board}
              style={
                {
                  "--board-cols": boardCols,
                  "--board-rows": boardRows,
                  "--cell-size": `${boardCellSize}px`,
                  "--cell-gap": `${boardGap}px`,
                  "--cell-radius": isSandPixelBoard ? "0px" : "3px"
                } as React.CSSProperties
              }
            >
              {displayBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const color = cell === -1 ? "transparent" : COLOR_HEX[cell];
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={styles.cell}
                      style={
                        {
                          "--cell-color": color
                        } as React.CSSProperties
                      }
                    />
                  );
                })
              )}
            </div>
          </div>
          <p className={styles.status}>{statusText}</p>
          <p className={styles.shortcuts}>{t("tetris.shortcuts")}</p>
        </section>

        <section className={styles.rightPane}>
          <div className={styles.panel}>
            <h2>{t("tetris.controls.title")}</h2>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.primaryBtn} onClick={toggleRunning}>
                {engine.running ? t("tetris.controls.pause") : t("tetris.controls.resume")}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={resetGame}>
                {t("tetris.controls.reset")}
              </button>
            </div>

            <label className={styles.field}>
              <span>{t("tetris.controls.speed", { speed: baseSpeed })}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={baseSpeed}
                onChange={(event) => setBaseSpeed(Number(event.target.value))}
              />
            </label>
          </div>

          <div className={styles.panel}>
            <h2>{t("tetris.mode.title")}</h2>
            <div className={styles.modeList}>
              {(["classic", "cascade", "sand"] as GameMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${styles.modeButton} ${mode === item ? styles.modeActive : ""}`}
                  onClick={() => setModeAndReset(item)}
                >
                  <strong>{t(`tetris.mode.${item}.name`)}</strong>
                  <span>{t(`tetris.mode.${item}.desc`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <h2>{t("tetris.guide.title")}</h2>
            <ul className={styles.guideList}>
              {modeGuide.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.guideHint}>{t("tetris.guide.hint")}</p>
          </div>

          <div className={styles.panel}>
            <h2>{t("tetris.next.title")}</h2>
            <div className={styles.nextQueue}>
              {queuePreview.map((type, index) => {
                const mask = getPreviewMask(type);
                const colorIndex = type
                  ? mode === "sand"
                    ? SAND_COLOR_MAP[PIECES[type].color] ?? (PIECES[type].color % 3)
                    : PIECES[type].color
                  : -1;
                const color = colorIndex >= 0 ? COLOR_HEX[colorIndex] : "transparent";

                return (
                  <article key={index} className={styles.previewCard}>
                    <span className={styles.previewIndex}>{index + 1}</span>
                    <div className={styles.previewGrid}>
                      {Array.from({ length: PREVIEW_GRID_ROWS * PREVIEW_GRID_COLS }).map(
                        (_, cellIndex) => {
                          const row = Math.floor(cellIndex / PREVIEW_GRID_COLS);
                          const col = cellIndex % PREVIEW_GRID_COLS;
                          const active = mask.has(`${row},${col}`);

                          return (
                            <div
                              key={cellIndex}
                              className={styles.previewCell}
                              style={{
                                background: active
                                  ? `linear-gradient(155deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.06)), ${color}`
                                  : "rgba(255, 255, 255, 0.06)"
                              }}
                            />
                          );
                        }
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
