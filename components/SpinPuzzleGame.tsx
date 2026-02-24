"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";
import styles from "./spin-puzzle-game.module.css";

type DifficultyId = "easy" | "medium" | "hard";
type Move = { row: number; col: number };
type MoveSource = "player" | "solver";
type SolverSpeedId = "slow" | "normal" | "fast";

type Ball = {
  id: string;
  value: number;
};

type BallGrid = Ball[][];

type DifficultyConfig = {
  tileRows: number;
  tileCols: number;
  min: number;
  max: number;
  scrambleSteps: number;
};

type PuzzleState = {
  difficulty: DifficultyId;
  target: number[][];
  solvedBalls: BallGrid;
  startBalls: BallGrid;
  balls: BallGrid;
  scrambleMoves: Move[];
  appliedMoves: Move[];
};

type DifficultyLayout = {
  spacing: number;
  tile: number;
  ball: number;
  viewportScale: number;
};

const DIFFICULTY_CONFIGS: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    tileRows: 2,
    tileCols: 2,
    min: 1,
    max: 9,
    scrambleSteps: 6
  },
  medium: {
    tileRows: 3,
    tileCols: 3,
    min: 1,
    max: 20,
    scrambleSteps: 14
  },
  hard: {
    tileRows: 4,
    tileCols: 4,
    min: 1,
    max: 40,
    scrambleSteps: 28
  }
};

const INITIAL_SEED: Record<DifficultyId, number> = {
  easy: 1207,
  medium: 3199,
  hard: 8821
};

const DIFFICULTY_LAYOUTS: Record<DifficultyId, DifficultyLayout> = {
  easy: {
    spacing: 108,
    tile: 70,
    ball: 42,
    viewportScale: 1.46
  },
  medium: {
    spacing: 92,
    tile: 58,
    ball: 35,
    viewportScale: 1.46
  },
  hard: {
    spacing: 78,
    tile: 50,
    ball: 30,
    viewportScale: 1.46
  }
};

const SOLVER_SPEED_MS: Record<SolverSpeedId, number> = {
  slow: 460,
  normal: 300,
  fast: 220
};
const MOVE_ANIMATION_MS = 240;
const MOVE_ACTIVE_MS = 280;
const OPTIMAL_SEARCH_MAX_MS = 4000;
const OPTIMAL_SEARCH_MAX_NODES = 600000;

const cloneBallGrid = (grid: BallGrid) => grid.map((row) => row.slice());

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;
  return () => {
    current ^= current << 13;
    current ^= current >>> 17;
    current ^= current << 5;
    return (current >>> 0) / 4294967296;
  };
};

const randomInt = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

const randomMove = (rows: number, cols: number, rng: () => number): Move => ({
  row: randomInt(rng, 0, rows - 1),
  col: randomInt(rng, 0, cols - 1)
});

const rotateClockwise = (grid: BallGrid, move: Move) => {
  const next = cloneBallGrid(grid);
  const { row, col } = move;

  const topLeft = grid[row][col];
  const topRight = grid[row][col + 1];
  const bottomRight = grid[row + 1][col + 1];
  const bottomLeft = grid[row + 1][col];

  next[row][col] = bottomLeft;
  next[row][col + 1] = topLeft;
  next[row + 1][col + 1] = topRight;
  next[row + 1][col] = bottomRight;

  return next;
};

const applyMoves = (grid: BallGrid, moves: Move[]) =>
  moves.reduce((acc, move) => rotateClockwise(acc, move), cloneBallGrid(grid));

const formatElapsed = (elapsedMs: number) => {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const countDigits = (value: number) => Math.max(1, Math.abs(Math.trunc(value)).toString().length);

const getDigitScale = (value: number, variant: "target" | "current") => {
  const digits = countDigits(value);
  if (digits <= 2) {
    return 1;
  }

  const base = variant === "target" ? 0.86 : 0.9;
  const perDigitDrop = variant === "target" ? 0.14 : 0.12;
  return Math.max(0.55, base - (digits - 3) * perDigitDrop);
};

const getDigitSpacing = (value: number) => {
  const digits = countDigits(value);
  if (digits <= 2) {
    return "0.01em";
  }
  if (digits === 3) {
    return "-0.015em";
  }
  return "-0.03em";
};

const computeCurrentSums = (balls: BallGrid, tileRows: number, tileCols: number) => {
  const sums: number[][] = [];

  for (let row = 0; row < tileRows; row += 1) {
    const line: number[] = [];
    for (let col = 0; col < tileCols; col += 1) {
      line.push(
        balls[row][col].value +
          balls[row][col + 1].value +
          balls[row + 1][col].value +
          balls[row + 1][col + 1].value
      );
    }
    sums.push(line);
  }

  return sums;
};

const allMatched = (current: number[][], target: number[][]) =>
  current.every((row, rowIndex) => row.every((value, colIndex) => value === target[rowIndex][colIndex]));

const sameMove = (a: Move, b: Move) => a.row === b.row && a.col === b.col;

const simplifyClockwiseSequence = (moves: Move[]) => {
  if (moves.length <= 1) {
    return moves.slice();
  }

  const simplified: Move[] = [];
  let index = 0;

  while (index < moves.length) {
    const pivot = moves[index];
    let count = 1;
    while (index + count < moves.length && sameMove(moves[index + count], pivot)) {
      count += 1;
    }

    const kept = count % 4;
    for (let step = 0; step < kept; step += 1) {
      simplified.push(pivot);
    }

    index += count;
  }

  return simplified;
};

const invertClockwiseMoves = (moves: Move[]) => {
  if (moves.length === 0) {
    return [];
  }

  const inverse: Move[] = [];
  let index = moves.length - 1;

  while (index >= 0) {
    const pivot = moves[index];
    let count = 1;

    while (index - count >= 0 && sameMove(moves[index - count], pivot)) {
      count += 1;
    }

    const needed = (4 - (count % 4)) % 4;
    for (let step = 0; step < needed; step += 1) {
      inverse.push(pivot);
    }

    index -= count;
  }

  return inverse;
};

const createPuzzle = (
  difficulty: DifficultyId,
  rng: () => number,
  retryCount = 0
): PuzzleState => {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const ballRows = config.tileRows + 1;
  const ballCols = config.tileCols + 1;

  let serial = 0;
  const solvedBalls: BallGrid = Array.from({ length: ballRows }, () =>
    Array.from({ length: ballCols }, () => ({
      id: `ball-${difficulty}-${serial++}`,
      value: randomInt(rng, config.min, config.max)
    }))
  );

  const target = computeCurrentSums(solvedBalls, config.tileRows, config.tileCols);

  const scrambleMoves: Move[] = Array.from({ length: config.scrambleSteps }, () =>
    randomMove(config.tileRows, config.tileCols, rng)
  );

  let startBalls = applyMoves(solvedBalls, scrambleMoves);
  let startSums = computeCurrentSums(startBalls, config.tileRows, config.tileCols);

  let guard = 0;
  while (allMatched(startSums, target) && guard < 12) {
    const extra = randomMove(config.tileRows, config.tileCols, rng);
    scrambleMoves.push(extra);
    startBalls = rotateClockwise(startBalls, extra);
    startSums = computeCurrentSums(startBalls, config.tileRows, config.tileCols);
    guard += 1;
  }

  if (allMatched(startSums, target) && retryCount < 16) {
    return createPuzzle(difficulty, rng, retryCount + 1);
  }

  return {
    difficulty,
    target,
    solvedBalls: cloneBallGrid(solvedBalls),
    startBalls: cloneBallGrid(startBalls),
    balls: cloneBallGrid(startBalls),
    scrambleMoves,
    appliedMoves: []
  };
};

const createRandomSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

const buildMoveList = (tileRows: number, tileCols: number) => {
  const moves: Move[] = [];
  for (let row = 0; row < tileRows; row += 1) {
    for (let col = 0; col < tileCols; col += 1) {
      moves.push({ row, col });
    }
  }
  return moves;
};

const flattenPiecesById = (
  balls: BallGrid,
  pieceIndexById: Map<string, number>
) => {
  const flattened: number[] = [];
  for (let row = 0; row < balls.length; row += 1) {
    for (let col = 0; col < balls[row].length; col += 1) {
      const index = pieceIndexById.get(balls[row][col].id);
      if (index === undefined) {
        return null;
      }
      flattened.push(index);
    }
  }
  return flattened;
};

const encodePieces = (pieces: number[]) => {
  let encoded = "";
  for (let index = 0; index < pieces.length; index += 1) {
    encoded += String.fromCharCode(35 + pieces[index]);
  }
  return encoded;
};

const applyClockwiseAt = (
  pieces: number[],
  [tl, tr, br, bl]: [number, number, number, number]
) => {
  const topLeft = pieces[tl];
  const topRight = pieces[tr];
  const bottomRight = pieces[br];
  const bottomLeft = pieces[bl];

  pieces[tl] = bottomLeft;
  pieces[tr] = topLeft;
  pieces[br] = topRight;
  pieces[bl] = bottomRight;
};

const applyCounterClockwiseAt = (
  pieces: number[],
  [tl, tr, br, bl]: [number, number, number, number]
) => {
  const topLeft = pieces[tl];
  const topRight = pieces[tr];
  const bottomRight = pieces[br];
  const bottomLeft = pieces[bl];

  pieces[tl] = topRight;
  pieces[tr] = bottomRight;
  pieces[br] = bottomLeft;
  pieces[bl] = topLeft;
};

const buildOptimalSolveSequence = (
  puzzle: PuzzleState,
  fallbackSequence: Move[]
) => {
  if (fallbackSequence.length <= 1) {
    return fallbackSequence;
  }

  const tileRows = DIFFICULTY_CONFIGS[puzzle.difficulty].tileRows;
  const tileCols = DIFFICULTY_CONFIGS[puzzle.difficulty].tileCols;
  const ballCols = tileCols + 1;
  const ballCount = (tileRows + 1) * (tileCols + 1);

  const pieceIndexById = new Map<string, number>();
  let serial = 0;
  for (let row = 0; row < puzzle.solvedBalls.length; row += 1) {
    for (let col = 0; col < puzzle.solvedBalls[row].length; col += 1) {
      pieceIndexById.set(puzzle.solvedBalls[row][col].id, serial);
      serial += 1;
    }
  }

  const startPieces = flattenPiecesById(puzzle.balls, pieceIndexById);
  if (!startPieces || startPieces.length !== ballCount) {
    return fallbackSequence;
  }

  let alreadySolved = true;
  for (let index = 0; index < startPieces.length; index += 1) {
    if (startPieces[index] !== index) {
      alreadySolved = false;
      break;
    }
  }

  if (alreadySolved) {
    return [];
  }

  const moves = buildMoveList(tileRows, tileCols);
  const moveCycles: Array<[number, number, number, number]> = moves.map((move) => {
    const topLeft = move.row * ballCols + move.col;
    const topRight = topLeft + 1;
    const bottomLeft = (move.row + 1) * ballCols + move.col;
    const bottomRight = bottomLeft + 1;
    return [topLeft, topRight, bottomRight, bottomLeft];
  });

  const positionRows = Array.from({ length: ballCount }, (_, index) =>
    Math.floor(index / ballCols)
  );
  const positionCols = Array.from({ length: ballCount }, (_, index) => index % ballCols);

  const heuristic = (pieces: number[]) => {
    let manhattan = 0;
    let misplaced = 0;

    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (piece !== index) {
        misplaced += 1;
      }
      manhattan +=
        Math.abs(positionRows[index] - positionRows[piece]) +
        Math.abs(positionCols[index] - positionCols[piece]);
    }

    return Math.max(Math.ceil(manhattan / 4), Math.ceil(misplaced / 4));
  };

  const isSolved = (pieces: number[]) => {
    for (let index = 0; index < pieces.length; index += 1) {
      if (pieces[index] !== index) {
        return false;
      }
    }
    return true;
  };

  type DfsResult = {
    found: boolean;
    nextBound: number;
    path?: number[];
  };

  const searchStart = performance.now();
  let expandedNodes = 0;
  let aborted = false;
  const upperBound = fallbackSequence.length;
  let bound = heuristic(startPieces);
  const path: number[] = [];

  const dfs = (
    pieces: number[],
    depth: number,
    currentBound: number,
    seenDepth: Map<string, number>
  ): DfsResult => {
    expandedNodes += 1;
    if (expandedNodes % 256 === 0) {
      if (
        performance.now() - searchStart > OPTIMAL_SEARCH_MAX_MS ||
        expandedNodes > OPTIMAL_SEARCH_MAX_NODES
      ) {
        aborted = true;
        return {
          found: false,
          nextBound: Number.POSITIVE_INFINITY
        };
      }
    }

    const h = heuristic(pieces);
    const estimated = depth + h;
    if (estimated > currentBound || depth >= upperBound) {
      return {
        found: false,
        nextBound: estimated
      };
    }

    if (h === 0 || isSolved(pieces)) {
      return {
        found: true,
        nextBound: depth,
        path: path.slice()
      };
    }

    const key = encodePieces(pieces);
    const previousDepth = seenDepth.get(key);
    if (previousDepth !== undefined && previousDepth <= depth) {
      return {
        found: false,
        nextBound: Number.POSITIVE_INFINITY
      };
    }
    seenDepth.set(key, depth);

    let nextBound = Number.POSITIVE_INFINITY;

    for (let moveIndex = 0; moveIndex < moveCycles.length; moveIndex += 1) {
      const cycle = moveCycles[moveIndex];
      applyClockwiseAt(pieces, cycle);
      path.push(moveIndex);

      const result = dfs(
        pieces,
        depth + 1,
        currentBound,
        seenDepth
      );

      path.pop();
      applyCounterClockwiseAt(pieces, cycle);

      if (result.found) {
        return result;
      }

      if (aborted) {
        return {
          found: false,
          nextBound: Number.POSITIVE_INFINITY
        };
      }

      if (result.nextBound < nextBound) {
        nextBound = result.nextBound;
      }
    }

    return {
      found: false,
      nextBound
    };
  };

  while (!aborted && bound <= upperBound) {
    const startState = startPieces.slice();
    const seenDepth = new Map<string, number>();
    const result = dfs(startState, 0, bound, seenDepth);

    if (result.found && result.path) {
      return result.path.map((index) => moves[index]);
    }

    if (!Number.isFinite(result.nextBound)) {
      break;
    }

    bound = Math.max(bound + 1, result.nextBound);
  }

  return fallbackSequence;
};

export default function SpinPuzzleGame() {
  const { locale, t } = useI18n();
  const activePulseTimer = useRef<number | null>(null);
  const timerOriginRef = useRef<number | null>(null);
  const prevSolvedRef = useRef(false);
  const lastMoveSourceRef = useRef<MoveSource | null>(null);

  const [puzzle, setPuzzle] = useState<PuzzleState>(() =>
    createPuzzle("medium", createSeededRandom(INITIAL_SEED.medium))
  );
  const [solverSpeed, setSolverSpeed] = useState<SolverSpeedId>("normal");
  const [solverQueue, setSolverQueue] = useState<Move[]>([]);
  const [solverRunning, setSolverRunning] = useState(false);
  const [activeMove, setActiveMove] = useState<Move | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const config = DIFFICULTY_CONFIGS[puzzle.difficulty];
  const layout = DIFFICULTY_LAYOUTS[puzzle.difficulty];
  const ballRows = config.tileRows + 1;
  const ballCols = config.tileCols + 1;
  const stageWidth = ballCols * layout.spacing;
  const stageHeight = ballRows * layout.spacing;
  const stageViewWidth = Math.ceil(stageWidth * layout.viewportScale);
  const stageViewHeight = Math.ceil(stageHeight * layout.viewportScale);

  const currentSums = useMemo(
    () => computeCurrentSums(puzzle.balls, config.tileRows, config.tileCols),
    [config.tileCols, config.tileRows, puzzle.balls]
  );

  const solved = useMemo(() => allMatched(currentSums, puzzle.target), [currentSums, puzzle.target]);

  const matchedCount = useMemo(
    () =>
      currentSums.reduce(
        (count, row, rowIndex) =>
          count + row.filter((value, colIndex) => value === puzzle.target[rowIndex][colIndex]).length,
        0
      ),
    [currentSums, puzzle.target]
  );

  const tileCount = config.tileRows * config.tileCols;
  const elapsedText = useMemo(() => formatElapsed(elapsedMs), [elapsedMs]);

  const stableBallOrder = useMemo(() => {
    const ordered: Ball[] = [];
    for (let row = 0; row < puzzle.solvedBalls.length; row += 1) {
      for (let col = 0; col < puzzle.solvedBalls[row].length; col += 1) {
        ordered.push(puzzle.solvedBalls[row][col]);
      }
    }
    return ordered;
  }, [puzzle.solvedBalls]);

  const ballPositionById = useMemo(() => {
    const map = new Map<string, { row: number; col: number; value: number }>();
    for (let row = 0; row < puzzle.balls.length; row += 1) {
      for (let col = 0; col < puzzle.balls[row].length; col += 1) {
        const item = puzzle.balls[row][col];
        map.set(item.id, {
          row,
          col,
          value: item.value
        });
      }
    }
    return map;
  }, [puzzle.balls]);

  const clearActivePulse = useCallback(() => {
    if (activePulseTimer.current !== null) {
      window.clearTimeout(activePulseTimer.current);
      activePulseTimer.current = null;
    }
  }, []);

  const startRoundTimer = useCallback(() => {
    timerOriginRef.current = performance.now();
    setElapsedMs(0);
    setTimerRunning(true);
  }, []);

  const stopRoundTimer = useCallback(() => {
    if (timerOriginRef.current === null) {
      setTimerRunning(false);
      return;
    }

    const finalElapsed = Math.max(0, Math.round(performance.now() - timerOriginRef.current));
    timerOriginRef.current = null;
    setElapsedMs(finalElapsed);
    setTimerRunning(false);
  }, []);

  useEffect(() => {
    if (!timerRunning || timerOriginRef.current === null) {
      return;
    }

    const updateElapsed = () => {
      if (timerOriginRef.current === null) {
        return;
      }
      setElapsedMs(Math.max(0, Math.round(performance.now() - timerOriginRef.current)));
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 100);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    startRoundTimer();
  }, [startRoundTimer]);

  useEffect(
    () => () => {
      clearActivePulse();
    },
    [clearActivePulse]
  );

  const triggerMove = useCallback(
    (move: Move, source: MoveSource) => {
      lastMoveSourceRef.current = source;

      setPuzzle((prev) => {
        const nextBalls = rotateClockwise(prev.balls, move);
        const nextAppliedMoves = [...prev.appliedMoves, move];

        return {
          ...prev,
          balls: nextBalls,
          appliedMoves: nextAppliedMoves
        };
      });

      if (source === "player") {
        setSolverQueue([]);
        setSolverRunning(false);
      }

      clearActivePulse();
      setActiveMove(move);
      activePulseTimer.current = window.setTimeout(() => {
        setActiveMove((current) =>
          current && current.row === move.row && current.col === move.col ? null : current
        );
      }, MOVE_ACTIVE_MS);
    },
    [clearActivePulse]
  );

  useEffect(() => {
    if (!solverRunning) {
      return;
    }

    if (solverQueue.length === 0) {
      setSolverRunning(false);
      return;
    }

    const delay = Math.max(SOLVER_SPEED_MS[solverSpeed], MOVE_ANIMATION_MS + 30);

    const timer = window.setTimeout(() => {
      const [nextMove, ...rest] = solverQueue;
      if (!nextMove) {
        setSolverRunning(false);
        return;
      }
      setSolverQueue(rest);
      triggerMove(nextMove, "solver");
    }, delay);

    return () => window.clearTimeout(timer);
  }, [solverQueue, solverRunning, solverSpeed, triggerMove]);

  useEffect(() => {
    if (solved && solverQueue.length === 0) {
      setSolverRunning(false);
    }
  }, [solved, solverQueue.length]);

  useEffect(() => {
    const wasSolved = prevSolvedRef.current;

    if (!wasSolved && solved) {
      stopRoundTimer();
      if (lastMoveSourceRef.current === "player") {
        setShowCelebration(true);
      }
    }

    prevSolvedRef.current = solved;
  }, [solved, stopRoundTimer]);

  const setDifficulty = useCallback((difficulty: DifficultyId) => {
    setShowCelebration(false);
    setSolverQueue([]);
    setSolverRunning(false);
    setActiveMove(null);
    lastMoveSourceRef.current = null;
    prevSolvedRef.current = false;
    setPuzzle(createPuzzle(difficulty, createSeededRandom(createRandomSeed())));
    startRoundTimer();
  }, [startRoundTimer]);

  const resetPuzzle = useCallback(() => {
    setShowCelebration(false);
    setSolverQueue([]);
    setSolverRunning(false);
    setActiveMove(null);
    lastMoveSourceRef.current = null;
    prevSolvedRef.current = false;
    setPuzzle((prev) => ({
      ...prev,
      balls: cloneBallGrid(prev.startBalls),
      appliedMoves: []
    }));
    startRoundTimer();
  }, [startRoundTimer]);

  const newPuzzle = useCallback(() => {
    setShowCelebration(false);
    setSolverQueue([]);
    setSolverRunning(false);
    setActiveMove(null);
    lastMoveSourceRef.current = null;
    prevSolvedRef.current = false;
    setPuzzle((prev) => createPuzzle(prev.difficulty, createSeededRandom(createRandomSeed())));
    startRoundTimer();
  }, [startRoundTimer]);

  const startSolver = useCallback(() => {
    if (solverRunning || solved) {
      return;
    }

    const sequence = simplifyClockwiseSequence([
      ...invertClockwiseMoves(puzzle.appliedMoves),
      ...invertClockwiseMoves(puzzle.scrambleMoves)
    ]);

    if (sequence.length === 0) {
      return;
    }

    const optimized = buildOptimalSolveSequence(puzzle, sequence);

    setShowCelebration(false);
    setSolverQueue(optimized);
    setSolverRunning(true);
  }, [puzzle, solved, solverRunning]);

  const stopSolver = useCallback(() => {
    setSolverQueue([]);
    setSolverRunning(false);
  }, []);

  const statusText = useMemo(() => {
    if (solverRunning) {
      return t("spin.status.solving");
    }
    if (solved) {
      return t("spin.status.solved");
    }
    return t("spin.status.playing");
  }, [solved, solverRunning, t]);

  return (
    <div className={styles.shell}>
      <div className={styles.topStats}>
        <article className={styles.statBox}>
          <span>{t("spin.stats.moves")}</span>
          <strong>{puzzle.appliedMoves.length.toLocaleString(locale)}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("spin.stats.timer")}</span>
          <strong>{elapsedText}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("spin.stats.matched")}</span>
          <strong>{`${matchedCount.toLocaleString(locale)}/${tileCount.toLocaleString(locale)}`}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("spin.stats.status")}</span>
          <strong>{statusText}</strong>
        </article>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.leftPane}>
          <div className={styles.stageWrap}>
            <div
              className={styles.stageViewport}
              style={
                {
                  "--stage-view-width": `${stageViewWidth}px`,
                  "--stage-view-height": `${stageViewHeight}px`,
                  "--stage-width": `${stageWidth}px`,
                  "--stage-height": `${stageHeight}px`,
                  "--tile-size": `${layout.tile}px`,
                  "--ball-size": `${layout.ball}px`,
                  "--move-ms": `${MOVE_ANIMATION_MS}ms`
                } as React.CSSProperties
              }
            >
              <div className={styles.diamondStage}>
                <div className={styles.stageInner}>
                  {Array.from({ length: config.tileRows }).map((_, row) =>
                    Array.from({ length: config.tileCols }).map((__, col) => {
                      const current = currentSums[row][col];
                      const target = puzzle.target[row][col];
                      const matched = current === target;
                      const active = activeMove?.row === row && activeMove?.col === col;

                    return (
                      <button
                          key={`tile-${row}-${col}`}
                          type="button"
                          className={`${styles.tile} ${matched ? styles.tileMatched : styles.tileUnmatched} ${
                            active ? styles.tileActive : ""
                          }`}
                          style={{
                            left: `${(col + 1) * layout.spacing}px`,
                            top: `${(row + 1) * layout.spacing}px`
                          }}
                          onClick={() => triggerMove({ row, col }, "player")}
                          disabled={solverRunning}
                          aria-label={t("spin.aria.tile", {
                            row: row + 1,
                            col: col + 1,
                            current,
                            target
                          })}
                        >
                          <span className={styles.tileContent}>
                            <span
                              className={styles.targetValue}
                              style={
                                {
                                  "--digit-scale": getDigitScale(target, "target"),
                                  "--digit-spacing": getDigitSpacing(target)
                                } as React.CSSProperties
                              }
                            >
                              {target.toLocaleString(locale)}
                            </span>
                            <strong
                              className={styles.currentValue}
                              style={
                                {
                                  "--digit-scale": getDigitScale(current, "current"),
                                  "--digit-spacing": getDigitSpacing(current)
                                } as React.CSSProperties
                              }
                            >
                              {current.toLocaleString(locale)}
                            </strong>
                          </span>
                        </button>
                      );
                    })
                  )}

                  {stableBallOrder.map((ball) => {
                    const position = ballPositionById.get(ball.id);
                    if (!position) {
                      return null;
                    }

                    return (
                      <div
                        key={ball.id}
                        className={styles.ball}
                        style={{
                          left: `${(position.col + 0.5) * layout.spacing}px`,
                          top: `${(position.row + 0.5) * layout.spacing}px`
                        }}
                      >
                        <span>{position.value.toLocaleString(locale)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <p className={styles.helperText}>{t("spin.guide.hint")}</p>
        </section>

        <section className={styles.rightPane}>
          <div className={styles.panel}>
            <h2>{t("spin.controls.title")}</h2>

            <div className={styles.field}>
              <span>{t("spin.controls.difficulty")}</span>
              <div className={styles.segmented}>
                {(["easy", "medium", "hard"] as DifficultyId[]).map((difficulty) => (
                  <button
                    key={difficulty}
                    type="button"
                    className={`${styles.segmentButton} ${
                      puzzle.difficulty === difficulty ? styles.segmentActive : ""
                    }`}
                    onClick={() => setDifficulty(difficulty)}
                  >
                    {t(`spin.difficulty.${difficulty}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button type="button" className={styles.primaryBtn} onClick={newPuzzle}>
                {t("spin.controls.newPuzzle")}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={resetPuzzle}>
                {t("spin.controls.restart")}
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <h2>{t("spin.controls.solverTitle")}</h2>

            <div className={styles.field}>
              <span>{t("spin.controls.speed")}</span>
              <div className={styles.segmented}>
                {(["slow", "normal", "fast"] as SolverSpeedId[]).map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={`${styles.segmentButton} ${
                      solverSpeed === speed ? styles.segmentActive : ""
                    }`}
                    onClick={() => setSolverSpeed(speed)}
                  >
                    {t(`spin.speed.${speed}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={startSolver}
                disabled={solverRunning || solved}
              >
                {t("spin.controls.getAnswer")}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={stopSolver}
                disabled={!solverRunning}
              >
                {t("spin.controls.stop")}
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <h2>{t("spin.guide.title")}</h2>
            <ul className={styles.guideList}>
              <li>{t("spin.guide.1")}</li>
              <li>{t("spin.guide.2")}</li>
              <li>{t("spin.guide.3")}</li>
            </ul>
          </div>
        </section>
      </div>

      {showCelebration ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.burst} aria-hidden="true">
              {Array.from({ length: 10 }).map((_, index) => (
                <span key={index} style={{ "--spark-index": index } as React.CSSProperties} />
              ))}
            </div>
            <h3>{t("spin.modal.title")}</h3>
            <p>{t("spin.modal.description")}</p>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.primaryBtn} onClick={newPuzzle}>
                {t("spin.modal.next")}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={() => setShowCelebration(false)}>
                {t("spin.modal.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
